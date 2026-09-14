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

## Per-slice worktrees, for a parallel batch

One worktree per batch member of a parallel batch, in addition to the epic worktree above - *Pick the tree* in `SKILL.md` calls this out as the one exception to "one per epic, never per slice".

**The path**: a sibling of the epic's own worktree path, never a child of it - `~/.solve/worktrees/<repo>/<feature>--<slice>/` (or the configured path's parent with the same substitution), `<slice>` the ticket handle (e.g. `002-parallel-batch-dispatch-...`). Nesting it under the epic path instead (`<epic-path>/<slice>/`) would sit the member's checkout inside the epic worktree's own tracked tree - `git status` there would then see it as untracked content, tripping the dirty-tree checks *Pick the tree* runs on the epic worktree (the pre-flight gate, the "something else in flight" test) against the batch's own in-flight work. A sibling avoids that, and still keeps two batch members apart from each other and from the epic worktree.
Batch dispatch needs this worktree regardless of whether **Worktrees** in `docs/agents/solve.md` is *On* or *Off* - concurrent subagents can't share one working tree either way, so a batch creates one per member even when a sequential drain in this repo would use the shared tree.

**Creating one**: a batch only dispatches mid-drain, so the epic branch always exists by then (*Clean the tree, cut the epic branch* in `SKILL.md` already ran) - every member's worktree is case **A** above, just at the member's own path:

```
git fetch
git worktree add <member-path> <epic-branch>
git -C <member-path> pull
```

The subagent handed that path cuts its own slice branch inside it, same as any hub slice off the epic branch (*Build it* in `SKILL.md`) - the draining agent resolves the tree before dispatch, it doesn't pre-cut the branch (*Delegate the build*).
*Making it runnable*, below, applies the same way as the epic worktree.

**Removing one**: once that member's merge lands (*Close the loop* step 4 in `SKILL.md`), `git worktree remove <member-path>` - immediately, done by the draining agent itself. This differs from *Cleanup* below: `land` removes the epic worktree because `ship` never merges the integration PR and so never learns when that one's safe to drop; a batch member is different - the draining agent performs that member's merge itself, so it's already there to remove the worktree the moment it lands. Never reuse a removed member's path for a later round - each dispatch gets a fresh one.
A batch that halts on a stopped member (*Draining an epic* in `SKILL.md`) still reaches this step for every member that reported `ready-to-merge` - each merges and its worktree is removed the moment that merge lands, same as any batch member. Only the stopped member's worktree is left standing, same as a stopped slice's branch, for whoever resolves the stop to inspect.

## Making it runnable

In this order. Config first, because a missing registry credential fails the install itself.

**1. Symlink the gitignored config** - a worktree carries only tracked files, and some of what stays behind is what boots the app. Never copy: a copied secret outlives the worktree.

- **Link each of these that actually exists** - `.env` and its variants, `.npmrc` or whatever carries the registry credential, local certs and keyfiles. Check first: `ln -s` to a missing target succeeds silently - a dangling link the app can't read, and nothing says so until the suite fails. If the name isn't gitignored the link also shows up as an untracked file that the next `git add -A` commits.
- **Never link** - `node_modules`, `dist`, `build`, `coverage`, caches, logs, and this repo's equivalents (`target/`, `vendor/`, `__pycache__`, ...). Derived from *this* branch - sharing them across worktrees ranges from useless to actively broken (native modules, different deps per branch, stale output).
- Anything else: **can a command recreate it?** Then run the command instead of linking it.

**2. Install dependencies** - the bootstrap command from **Worktrees** when `setup` captured one, otherwise inferred from the repo: the lockfile present, a `Makefile`, the repo's own scripts, `CONTRIBUTING`. No lockfile and nothing declared? Install nothing - don't reach for a command that needs one (`npm ci` fails outright without a lockfile). The bar is an outcome, not a particular command: **the worktree runs the app and the test suite** - every slice's done depends on it.

**3. Report what you linked and installed.**

## Cleanup

`ship` never removes the epic worktree - it doesn't merge the integration PR, so it never learns when the branch is safe to drop. It leaves the path in two places instead: the epic-issue comment (survives a halted drain) and the `git worktree remove <path>` in the integration PR body. `land` is what actually removes it. A per-slice batch worktree is the one exception - *Per-slice worktrees, for a parallel batch* above, *removing one* - `ship` removes those itself.

Cleaning up by hand: `git worktree remove` refuses on a dirty tree, so it can't take unmerged work with it, and `git worktree list` is the source of truth (`git worktree prune` clears records of any deleted outside git).
