# Lane worktrees

How a parallel batch stands up its worktrees. An epic never gets one of its own - it drains in the shared tree (*Pick the tree* in `SKILL.md`); the only worktrees `ship` creates are the lanes below.

## The path

From **Worktrees** in `docs/agents/solve.md` - default `~/.solve/worktrees/<repo>/<feature>/`, `<repo>` being the repository directory's name. A lane is that path with `<feature>` replaced by `<feature>--lane-<N>`. Both segments earn their place: `<feature>` keeps two epics in one repo apart, `<repo>` keeps the same feature name in two repos apart. A configured path dropping `<repo>` collides across repos, and the collision looks exactly like another agent holding your lane.

`<feature>` is the epic's token, fixed once for the whole epic (*Build it*) - never re-slugify it here. An older `solve.md` may still carry a `**off**` / `**on**` line under **Worktrees**: ignore it, only the path, bootstrap and linked config are read.

## The record comment

One comment on the epic issue per lane path, so a halted drain still leaves a trace of where each lane lives - and on which machine, which a failing `git worktree add` can't see. Write the text into the run's scratch dir (`mktemp -d`) with a file-write tool, never through the shell, and post it with `gh issue comment <epic> --body-file "<dir>/body"` - `gh` without `--body` or `--body-file` opens an interactive prompt that hangs a drain with no output.

Fill every `<token>` with its real value. The footer stays informational - no cleanup steps: who removes a lane is `land`'s business and can change, while a posted comment can't. `<user>` is `whoami`, `<host>` is `hostname`, `<os> <arch>` is `uname -sm` - a bare hostname repeats across people and machines.

Lane worktree (the first time the lane path is created; a reused lane needs no second comment):

```markdown
**Lane <N> worktree**

- **Machine:** `<user>@<host>` (<os> <arch>)
- **Path:** `<lane-path>`
- **Epic branch:** `<epic-branch>`
- **First slice:** #<n> (`<member-slice-branch>`)

Created by [`solve:ship`](https://github.com/AshuLab/skills/blob/main/solve/skills/ship/WORKTREES.md) to build slices in parallel. The lane is reused between rounds, so it may be on another slice now: `git -C <lane-path> branch --show-current`.
```

## Lane worktrees, for a parallel batch

Up to 3 lane worktrees - the same concurrency cap *Draining an epic* in `SKILL.md` dispatches - alongside the shared tree, where the epic itself drains. A lane is a **slot**, not a per-slice thing - it outlives any one occupant, reused round after round as long as the drain keeps dispatching.

**The path**: `~/.solve/worktrees/<repo>/<feature>--lane-<N>/` (or the configured path with the same `<feature>` substitution), `N` from 1 to the concurrency cap. `lane-<N>` is fixed, not slugified, so only `<feature>` itself could collide with another epic's. A configured path inside the repo (`.worktrees/`) nests the lane's checkout in the shared tree - `git status` there sees it as untracked content, tripping the dirty-tree checks *Pick the tree* runs against the batch's own in-flight work - so it needs a `.gitignore` entry, and the default avoids it.
A batch needs these worktrees every time - concurrent subagents can't share one working tree - and nothing turns them off. A single-slice run never creates one.

**Sizing the round**: before assigning anything, count free lanes - detached HEAD (per *Freeing a lane* below) means free; a named slice branch checked out means occupied, whether by an in-flight build or an unresolved stopped member from an earlier round (*Freeing a lane* never runs for a stopped member, so its lane stays occupied until it resolves). A lane not yet created - true for every lane on a drain's first round - counts as free too: capacity is the concurrency cap minus what's occupied, not a count of worktree paths already on disk. The round's batch is capped at whichever is smaller - 3 currently-startable hub slices, or lanes currently free. A startable slice that doesn't fit waits for the next round, same as any overflow past 3.

**Assigning a lane**: one member at a time, in the round's dispatch order - claim each member's lane before moving to the next, so two members never resolve to the same free lane. For each member, first check whether any lane - free or occupied - already has `<member-slice-branch>` checked out. If so, that's the member's lane, unconditionally - this only fires for a member stopped in an earlier round whose lane was never freed, so it stays occupied on its own branch until resolved. Skip the scan below for it.
No match -> the first free lane, claimed immediately - moved off detached HEAD onto the member's branch - before assigning the next member's lane. Reused if a free one exists from an earlier round in this drain, created if none does. Without the own-branch check first, this scan would hand a resuming stopped member a *different* lane than the one still holding its branch, and creating or switching to that branch there fails - it's already checked out at the member's original lane.

**Creating a lane** (no worktree at that path yet): a batch only dispatches mid-drain, so the epic branch already exists (*Clean the tree, cut the epic branch* in `SKILL.md` already ran) - but a lane can't check out `<epic-branch>` itself: the shared tree already has it checked out, and git refuses a second checkout of the same branch. Cut the member's own slice branch off `<epic-branch>` instead - the same branch *Build it* in `SKILL.md` says a hub slice gets anyway, just cut here rather than after. Base it on `origin/<epic-branch>`, not the local ref: the local ref goes stale the moment an earlier round's member merges server-side (nothing else in this lifecycle updates it), so a lane created mid-drain off the local branch can miss prior rounds' merges - fetch first, same as *Reusing a lane* below:

```
git fetch
git worktree add -b <member-slice-branch> <lane-path> origin/<epic-branch>
```

Once it's up, record it with *The record comment* above (the lane variant) - once per lane path, the first time it's created. Without this, a batch that halts leaves lane worktrees with no trace beyond `git worktree list` on the machine that created them - exactly the cross-machine gap *Cleanup*'s two-places claim below depends on not existing.

**Reusing a lane** (the path already exists, parked from an earlier occupant): no `worktree add` - the worktree is already there, just move it onto the new member's branch:

```
git -C <lane-path> fetch
git -C <lane-path> switch -c <member-slice-branch> origin/<epic-branch>
```

Either way, publish the branch the way the delivery mode says (*Lane branches* in `SLICES-GITHUB.md` pushes it right here; `SLICES-LOCAL.md` publishes nothing). The subagent handed that path builds directly on its own slice branch, already checked out - the draining agent resolves the tree and cuts the branch before dispatch, the subagent doesn't cut it itself (*Delegate the build*).
*Making it runnable*, below, applies the first time a lane is created. A reused lane already has its symlinks and install from the last occupant - skip both **unless** the new branch's lockfile differs (diff it before skipping): a changed lockfile means step 2's install runs again, same as a first-time lane.

**Freeing a lane**: once that member's merge lands (*Close the loop* step 4 in `SKILL.md`), get off its branch so *Close the loop* step 6 can delete it. Not `git switch <epic-branch>` - the shared tree already has it checked out, the same exclusivity *Creating a lane* runs into. Detach instead: `git fetch && git -C <lane-path> switch --detach origin/<epic-branch>` - leave the worktree parked there, at the epic branch's current tip with nothing named checked out. This replaces removing it: a lane is never torn down mid-drain, only parked, ready for the next round's *Assigning a lane* - detached HEAD is free, a named slice branch is occupied.
A batch that halts on a stopped member (*Draining an epic* in `SKILL.md`) still frees every lane whose member reported `ready-to-merge` - each merges and its lane parks, same as any round. Only the stopped member's lane stays as it was, unparked, for whoever resolves the stop to inspect - don't assign it to a later round until that happens.
A merge that stays unresolved after the slice-branch attempt (*Resolving a slice-merge conflict* in the delivery mode's `SLICES-*.md`) leaves its member's lane the same way - unparked, still on that member's branch, the attempt's merge aborted so the tree is clean - since this section only runs once a merge actually lands, and an unmerged one never does. Same for any ready-to-merge sibling the conflict's queue-halt skipped before its merge was attempted: no merge landed for it either, so its lane stays unparked too, ready for the next round's retry (*Draining an epic*).
Resuming that same stopped member later reuses this same lane - *Assigning a lane*'s own-branch check above finds it directly, since the lane was never freed and lane paths aren't derived per slice.

**Removing a lane**: only when the drain has no more work for it - the epic's last round, or a halt with nothing left to retry. `ship` doesn't remove it, `land` does, named in the integration PR body (*Cleanup*, below).

## Making it runnable

In this order. Config first, because a missing registry credential fails the install itself.

**1. Symlink the gitignored config** - a worktree carries only tracked files, and some of what stays behind is what boots the app. Never copy: a copied secret outlives the worktree.

- **Link each of these that actually exists** - `.env` and its variants, `.npmrc` or whatever carries the registry credential, local certs and keyfiles. Check first: `ln -s` to a missing target succeeds silently - a dangling link the app can't read, and nothing says so until the suite fails. If the name isn't gitignored, the link also shows up as an untracked file the next `git add -A` commits.
- **Never link** - `node_modules`, `dist`, `build`, `coverage`, caches, logs, and this repo's equivalents (`target/`, `vendor/`, `__pycache__`, ...). Derived from *this* branch - sharing them across worktrees ranges from useless to actively broken (native modules, different deps per branch, stale output).
- Anything else: **can a command recreate it?** Then run the command instead of linking it.

**2. Install dependencies** - the bootstrap command from **Worktrees** when `setup` captured one, otherwise inferred from the repo: the lockfile present, a `Makefile`, the repo's own scripts, `CONTRIBUTING`. No lockfile and nothing declared? Install nothing - don't reach for a command that needs one (`npm ci` fails outright without a lockfile). The bar is an outcome, not a particular command: **the worktree runs the app and the test suite** - every slice's done depends on it.

**3. Report what you linked and installed.**

## Cleanup

`ship` never removes a lane worktree - it doesn't merge the integration PR, so it never learns when a lane is safe to drop. It leaves the paths in two places instead: the epic-issue comment (survives a halted drain) and the `git worktree remove <path>` calls in the integration PR body, one per lane still standing. `land` actually removes them.

Cleaning up by hand: `git worktree remove` refuses on a dirty tree, so it can't take unmerged work with it, and `git worktree list` is the source of truth (`git worktree prune` clears records of any deleted outside git).
