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

## Lane worktrees, for a parallel batch

Up to 3 lane worktrees - the same concurrency cap *Draining an epic* in `SKILL.md` dispatches - in addition to the epic worktree above. *Pick the tree* in `SKILL.md` calls this out as the one exception to "one per epic, never per slice": a lane is a **slot**, not a per-slice thing - it outlives any one occupant, reused round after round for as long as the drain keeps dispatching.

**The path**: a sibling of the epic's own worktree path, never a child of it - `~/.solve/worktrees/<repo>/<feature>--lane-<N>/` (or the configured path's parent with the same substitution), `N` from 1 to the concurrency cap - `lane-<N>` is fixed, not slugified, so only `<feature>` itself could collide with another epic's, the same assumption the epic worktree's own path already carries. Nesting it under the epic path instead (`<epic-path>/lane-<N>/`) would sit the lane's checkout inside the epic worktree's own tracked tree - `git status` there would then see it as untracked content, tripping the dirty-tree checks *Pick the tree* runs on the epic worktree (the pre-flight gate, the "something else in flight" test) against the batch's own in-flight work. A sibling avoids that.
A batch needs these worktrees regardless of whether **Worktrees** in `docs/agents/solve.md` is *On* or *Off* - concurrent subagents can't share one working tree either way, so a batch uses lanes even when a sequential single-slice drain in this repo would use the shared tree.

**Sizing the round**: before assigning anything, count free lanes - detached HEAD, per *Freeing a lane* below, means free; a named slice branch checked out means occupied, whether by an in-flight build or by an unresolved stopped member from an earlier round (*Freeing a lane* never runs for a stopped member, so its lane stays occupied until it resolves). A lane that hasn't been created yet - true for every lane on a drain's first round - counts as free too: capacity is the concurrency cap minus what's occupied, not a count of worktree paths that already exist on disk. The round's batch is capped at whichever is smaller - 3 currently-startable hub slices, or lanes currently free. A startable slice that doesn't fit waits for the next round, same as any overflow past 3.

**Assigning a lane**: one member at a time, in the round's dispatch order - claim each member's lane before moving to the next, so two members never resolve to the same free lane. For each member, first check whether any lane - free or occupied - already has `<member-slice-branch>` checked out. If so, that's the member's lane, unconditionally - this is the only case that fires, a member stopped in an earlier round whose lane was never freed, so it stays occupied on its own branch until it resolves. Skip the scan below for it.
No match -> the first free lane, claimed immediately - moved off detached HEAD onto the member's branch - before assigning the next member's lane. Reused if a free one already exists from an earlier round in this drain, created if none does. Without the own-branch check first, this scan would hand a resuming stopped member a *different* lane than the one still holding its branch, and creating or switching to that branch there fails - it's already checked out at the member's original lane.

**Creating a lane** (no worktree at that path yet): a batch only dispatches mid-drain, so the epic branch always exists by then (*Clean the tree, cut the epic branch* in `SKILL.md` already ran) - but unlike case **A** above, a lane can't check out `<epic-branch>` itself: that branch is already checked out elsewhere (the epic worktree, or the shared tree), and git refuses a second checkout of the same branch. Cut the member's own slice branch off `<epic-branch>` at creation time instead - this is the same branch *Build it* in `SKILL.md` says a hub slice gets anyway, just cut here rather than after. Base it on `origin/<epic-branch>`, not the local ref: the local ref goes stale the moment an earlier round's member merges server-side (nothing else in this lifecycle updates it), so a lane created mid-drain off the local branch can miss prior rounds' merges - fetch first, same as *Reusing a lane* below:

```
git fetch
git worktree add -b <member-slice-branch> <lane-path> origin/<epic-branch>
git -C <lane-path> push -u origin <member-slice-branch>
```

Once it's up, record it the same way *Creating a worktree* above records the epic worktree - `gh issue comment <epic> --body "lane: <lane-path> on <machine>"` - once per lane path, the first time it's created; a reused lane doesn't need a second comment, its path is already on record. Without this, a batch that halts leaves lane worktrees with no trace beyond `git worktree list` on the machine that created them - exactly the cross-machine gap *Cleanup*'s two-places claim below depends on not existing.

**Reusing a lane** (the path already exists, parked from an earlier occupant): no `worktree add` - the worktree is already there, just move it onto the new member's branch:

```
git -C <lane-path> fetch
git -C <lane-path> switch -c <member-slice-branch> origin/<epic-branch>
git -C <lane-path> push -u origin <member-slice-branch>
```

Either way, the subagent handed that path builds directly on its own slice branch, already checked out - the draining agent resolves the tree and cuts the branch before dispatch, the subagent doesn't cut it itself (*Delegate the build*).
*Making it runnable*, below, applies the same way as the epic worktree the first time a lane is created. A reused lane already has its symlinks and install from the last occupant - skip both **unless** the new branch's lockfile differs from the occupant's (diff it before skipping): a changed lockfile means step 2's install has to run again, same as a first-time lane.

**Freeing a lane**: once that member's merge lands (*Close the loop* step 4 in `SKILL.md`), get off its branch so *Close the loop* step 6 can delete it. Not `git switch <epic-branch>` - that branch is already checked out elsewhere (the epic worktree, or the shared tree), the same exclusivity *Creating a lane* runs into. Detach instead: `git fetch && git -C <lane-path> switch --detach origin/<epic-branch>` - and leave the worktree standing there, parked at the epic branch's current tip with nothing named checked out. This replaces removing it: a lane is never torn down mid-drain, only parked, ready for the next round's *Assigning a lane* - a lane in detached HEAD is free, one still on a named slice branch is occupied.
A batch that halts on a stopped member (*Draining an epic* in `SKILL.md`) still frees every lane whose member reported `ready-to-merge` - each merges and its lane parks, same as any round. Only the stopped member's lane stays as it was, unparked, for whoever resolves the stop to inspect - don't assign it to a later round until that happens.
A merge that hits a conflict (*Draining an epic*'s conflict-halts-the-queue rule) leaves its member's lane the same way - unparked, still on that member's branch - since this section only runs once a merge actually lands, and a conflicting one never does. Same for any ready-to-merge sibling the conflict's queue-halt skipped before its own merge was even attempted: no merge landed for it either, so its lane stays unparked too, ready for the next round's retry (*Draining an epic*).
Resuming that same stopped member later reuses this same lane - *Assigning a lane*'s own-branch check above finds it directly, since the lane was never freed and lane paths aren't derived per slice the way the epic worktree's is.

**Removing a lane**: only when the drain has no more work for it - the epic's last round, or a halt with nothing left to retry. Same deferral as the epic worktree, below: `ship` doesn't remove it, `land` does, named in the integration PR body alongside the epic worktree.

## Making it runnable

In this order. Config first, because a missing registry credential fails the install itself.

**1. Symlink the gitignored config** - a worktree carries only tracked files, and some of what stays behind is what boots the app. Never copy: a copied secret outlives the worktree.

- **Link each of these that actually exists** - `.env` and its variants, `.npmrc` or whatever carries the registry credential, local certs and keyfiles. Check first: `ln -s` to a missing target succeeds silently - a dangling link the app can't read, and nothing says so until the suite fails. If the name isn't gitignored the link also shows up as an untracked file that the next `git add -A` commits.
- **Never link** - `node_modules`, `dist`, `build`, `coverage`, caches, logs, and this repo's equivalents (`target/`, `vendor/`, `__pycache__`, ...). Derived from *this* branch - sharing them across worktrees ranges from useless to actively broken (native modules, different deps per branch, stale output).
- Anything else: **can a command recreate it?** Then run the command instead of linking it.

**2. Install dependencies** - the bootstrap command from **Worktrees** when `setup` captured one, otherwise inferred from the repo: the lockfile present, a `Makefile`, the repo's own scripts, `CONTRIBUTING`. No lockfile and nothing declared? Install nothing - don't reach for a command that needs one (`npm ci` fails outright without a lockfile). The bar is an outcome, not a particular command: **the worktree runs the app and the test suite** - every slice's done depends on it.

**3. Report what you linked and installed.**

## Cleanup

`ship` never removes the epic worktree, or a lane worktree - it doesn't merge the integration PR, so it never learns when either is safe to drop. It leaves the paths in two places instead: the epic-issue comment (survives a halted drain) and the `git worktree remove <path>` calls in the integration PR body, one per lane still standing plus the epic worktree. `land` is what actually removes them.

Cleaning up by hand: `git worktree remove` refuses on a dirty tree, so it can't take unmerged work with it, and `git worktree list` is the source of truth (`git worktree prune` clears records of any deleted outside git).
