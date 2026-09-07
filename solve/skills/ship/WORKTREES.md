# Creating a worktree

How to stand one up - whether you need one at all is the call of *Pick the tree* in `SKILL.md`.

## The path

From **Worktrees** in `docs/agents/solve.md` - default `~/.solve/worktrees/<repo>/<feature>/`, `<repo>` being the repository directory's own name. Both segments earn their place: `<feature>` keeps two epics in one repo apart, `<repo>` keeps the same feature name in two repos apart. A configured path that drops `<repo>` collides across repos, and the collision looks exactly like another agent holding your epic.

`<feature>` is the epic's token, fixed once for the whole epic (*Build it*) - never re-slugify it here.

## Carrying loose work across

Only for work **you** left in the shared tree during this run - *Pick the tree* in `SKILL.md` has the rule. Someone else's uncommitted work is not yours to move, and `git stash` is one stack shared by every worktree, so two runs stashing at once pop each other's entries.

A worktree is cut from *committed* state, so loose work stays behind - and `git stash` only sees the tree you're standing in. Run this order from the shared tree:

1. **Sort what's dirty** into the four cases *Clean the tree, cut the epic branch* defines in `SKILL.md`: epic-level design artifacts, work belonging to the slice you're about to build, the repo's own config, unrelated strays.
2. **Stash the first two by path** - `git stash push -u -- <paths>` - commit the config on the base branch, and leave the strays. Bare `git stash -u` sweeps the strays in too - they end up committed on the epic branch, in the base of every PR. Miss a path and that work is silently abandoned in the shared tree.
3. **Create the worktree** (below), then **pop there** - the stash is shared across worktrees.

## Reuse before you create

`git worktree list` first, and compare against the derived path.
**If it's already there, it's yours** - from an earlier slice or a halted drain. Use it; skip to *Making it runnable* only if the install is missing. `git worktree add` reports an already-checked-out branch identically whether it's another agent's or your own, so skipping the check reads your own worktree as a collision and halts a resumable drain.

## Creating it

Only once the path isn't in `git worktree list`. Run **exactly one** of A or B - they're alternatives, not a sequence.

**A - the epic branch already exists:**

```
git fetch
git worktree add <path> <epic-branch>
git -C <path> pull
```

`git worktree add` resolves the **local** epic ref, which is stale after every server-side merge - hence the fetch and the pull.

**B - it doesn't exist yet** (the epic's first slice):

```
git fetch
git worktree add -b <epic-branch> <path> origin/<base>
git -C <path> push -u origin <epic-branch>
```

Don't shorten B. The fetch, naming the base and pushing are the same three rules as *Clean the tree, cut the epic branch* in `SKILL.md`, and `-b` bites harder here: you often arrive standing on **another epic's branch**, so an unnamed base rides its commits into every slice PR. And until you push, `git worktree add -b ... origin/<base>` leaves the branch *tracking `origin/<base>`* - a later `git pull` on the epic branch silently merges the base into it, exit 0.

Failing here because the branch is checked out at a path you *didn't* derive is the real collision signal - another agent holds this epic. Stop and report it; never `--force`, and never pick a different path to get around it.

**From here, every command runs inside `<path>`** - pass the path per command (`git -C <path> ...`, the install's own prefix flag) or chain it in the same invocation (`cd <path> && ...`). Never assume a bare `cd` survives to the next command - plenty of runtimes reset the working directory between them, and the install then lands in the shared tree while every slice in the epic fails its done.
Git only blocks the shared tree while the worktree holds that exact branch - for most of a drain the worktree sits on a slice branch, so the shared tree takes the epic branch silently.

Once it's up, in github **record it on the epic issue** - path and machine, in one comment: `gh issue comment <epic> --body "worktree: <path> on <machine>"`. Always `--body`; without it `gh` opens an interactive prompt that hangs a drain with no output. (*find a slice's epic* in `docs/agents/solve.md` -> **Tracker operations**.)
It's the only record spanning the worktree's whole life - a halted drain never opens the integration PR - and the only cross-machine one: a failing `git worktree add` sees only *this* machine.
In local mode there's no issue to write on, so `git worktree list` on that machine is the whole record.

## Making it runnable

In this order. Config first, because a missing registry credential fails the install itself.

**1. Symlink the gitignored config** - a worktree carries only tracked files, and some of what stays behind is what boots the app. Never copy: a copied secret outlives the worktree.

- **Link each of these that actually exists** - `.env` and its variants, `.npmrc` or whatever carries the registry credential, local certs and keyfiles. Check first: `ln -s` to a missing target succeeds silently - a dangling link the app can't read, and nothing says so until the suite fails. If the name isn't gitignored the link also shows up as an untracked file that the next `git add -A` commits.
- **Never link** - `node_modules`, `dist`, `build`, `coverage`, caches, logs, and this repo's equivalents (`target/`, `vendor/`, `__pycache__`, ...). Derived from *this* branch - sharing them across worktrees ranges from useless to actively broken (native modules, different deps per branch, stale output).
- Anything else: **can a command recreate it?** Then run the command instead of linking it.

**2. Install dependencies** - the bootstrap command from **Worktrees** when `setup` captured one, otherwise inferred from the repo: the lockfile present, a `Makefile`, the repo's own scripts, `CONTRIBUTING`. No lockfile and nothing declared? Install nothing - don't reach for a command that needs one (`npm ci` fails outright without a lockfile). The bar is an outcome, not a particular command: **the worktree runs the app and the test suite** - every slice's done depends on it.

**3. Report what you linked and installed.**

## Cleanup

`ship` never removes a worktree - it doesn't merge the integration PR, so it never learns when the branch is safe to drop. It leaves the path in two places instead: the epic-issue comment (survives a halted drain) and the `git worktree remove <path>` in the integration PR body. `land` is what actually removes it.

Cleaning up by hand: `git worktree remove` refuses on a dirty tree, so it can't take unmerged work with it, and `git worktree list` is the source of truth (`git worktree prune` clears records of any deleted outside git).
