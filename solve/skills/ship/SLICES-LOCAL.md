# Slice delivery - local

The transport for a slice when **Slice delivery** in `docs/agents/solve.md` is `local`. Steps 2-6 of *Close the loop* in `SKILL.md` - read this file end to end and no other `SLICES-*.md`. The output contract, *Check before merging* and *Resolving a slice-merge conflict* are in *Slice delivery* in `SKILL.md`; this file gives their commands.

No slice PR exists and a slice branch is never pushed. The slice's record is its **merge commit**; the draining agent merges it into its base in the shared tree and pushes the **epic branch** after every merge, so `origin/<epic-branch>` stays current for lanes, resume, other clones and `land`. Issues, the epic branch and the integration PR stay on GitHub. Steps 2-3 run in the subagent, the check and steps 4-6 in the draining agent.

Every branch here is local to this repository, so the shared tree and every lane worktree see each other's slice branches - that is what lets the draining agent merge what a lane built.

`<slice-base>` is the branch the slice merges into: the **epic branch** for a hub slice, **the blocker's branch** for a stacked one whose blocker is still open.

**2. Publish the slice** - nothing to push. The subagent stops after its commit and reports with `pr` set to `null`. Never push a slice branch: nothing reads it on the remote, and `land` would find a stray.

**3. Record the slice** - a slice has no PR body, so the record is written at the merge (step 4) and the subagent hands over what goes in it: the report carries `shipped` (the actual change in a line or two, not a copy of the goal) and `verified` (definition of done met: checks and suite green, tests at the agreed seam, or "no tests - per spec").

## Check before merging

- **The slice branch exists**: `git rev-parse --verify <slice-branch>`.
- **The slice's diff**: `git diff <slice-base>...<slice-branch>`. The re-dispatch reuses the same branch.
- **Findings still open after the round**: they go in the merge commit message, one line each starting `ship:slice-check:` (step 4).

## Merge, close, delete

**4. Merge the slice into its base** - always a merge commit, never squash or rebase: the per-slice history *is* the review surface this model exists to keep. Merge a stacked slice straight into the epic branch and it drags the blocker's unreviewed commits along.
A **stacked** slice exists only when `ship` is handed a slice whose blocker is still open, and in this mode both its branch and the blocker's are local-only until merged: **stacks are single-clone**, nobody can resume one from another clone. The blocker's branch isn't in this clone, or `git switch <blocker-branch>` is refused because a lane holds it -> stop and say so.
**Already merged?** If `git log --merges --grep='^Merge slice #<n> into' --format=%h -1 <slice-base>` finds this slice's merge commit, an earlier attempt died after the merge, before the push or the close: skip the merge and go on from the push. A slice branch that is an ancestor of `<slice-base>` *without* such a commit has no commits of its own to deliver: `outcome: "stopped"`, `reason: "slice branch has no commits of its own"`.
In the **shared tree**, clean, and never anywhere else: `git switch <slice-base>`; for the epic branch also `git fetch && git pull --ff-only` (the blocker's branch has no remote, skip it). The pull refused because the epic branch **diverged** from `origin/<epic-branch>` -> stop and report which commits are local-only (`git log origin/<epic-branch>..<epic-branch>`); never reset or force. Write the message into the run's scratch dir (`mktemp -d`) with a file-write tool, never through the shell. `shipped` and `verified` come from the build's close-out report, even after a conflict resolution:

```
Merge slice #<n> into <slice-base>: <ticket title>

Closes #<n>

shipped: <the report's shipped>
verified: <the report's verified>
ship:slice-check: <the finding>      (only a slice whose check still had findings; one line each)
```

then `git merge --no-ff <slice-branch> -F "<dir>/msg"`. Landed on the **epic branch** -> `git push origin <epic-branch>`. Refused as non-fast-forward, someone else pushed: stop and report, never force - the merge stays in the local epic branch. A person settles the divergence, then finishes the slice by hand: push the epic branch, `gh issue close <n>`, and step 6. Landed on a blocker's branch -> no push: it was never published.
**The merge stopped on a conflict?** `git merge --abort` first, so the shared tree is clean again, then *Resolving a slice-merge conflict* in `SKILL.md`, with the commands below. Whatever it can't land is an **unresolved conflict**: stop and report the files.
**Stopped for any other reason** - a commit-msg hook rejecting the merge message, say - `git merge --abort` if `git rev-parse -q --verify MERGE_HEAD` finds a merge in progress, then stop and report the reason. The slice stays `ready-to-merge`, unmerged, for the next round.

**5. Close the issue** (`gh issue close <n>`).
That explicit close releases the next tickets. There is nothing to retarget: no PR points at the slice branch, and a slice stacked on this one resolves its base at its own merge - the epic branch, now that this one is closed.

**6. Delete the slice branch.** Get off it first - in the shared tree step 4 already left you on the base; in a lane, detach: *Freeing a lane* in [WORKTREES.md](./WORKTREES.md) has the exact steps. Then **prove the merge landed**: after the push, `git fetch` and `git merge-base --is-ancestor <slice-branch> origin/<epic-branch>` (against the blocker's branch, the local ref - nothing else holds it). If it doesn't succeed, stop - don't delete. Then `git branch -d <slice-branch>`; there is no remote branch to delete. Still `-d`, never `-D`.

## Resolving a slice-merge conflict

The commands for *Resolving a slice-merge conflict* in `SKILL.md`, read only when step 4's `git merge` stopped on a conflict:

- **Merge the base in**: start on the slice branch - `git -C <tree> switch <slice-branch>`, a no-op in a lane, but after step 4's abort the shared tree is still on the base, and merging the base into itself resolves nothing. Then `git -C <tree> merge <slice-base>`. The local ref is right: this mode keeps it current.
- **Publish the resolution**: nothing to push.
- **Merge again**: run step 4 again - there are no PR checks to wait for.

## Unresolved slice checks, for the integration PR

Gathered from the commits, not from memory: `git log --merges --grep='^ship:slice-check:' --format='%h%n%b' origin/<destination>..<epic-branch>` - each matching merge commit gets one line under **Unresolved slice checks** in the integration PR's body, the finding and the commit's short hash. None -> omit the section.

## Lane branches

When *Creating a lane* or *Reusing a lane* in [WORKTREES.md](./WORKTREES.md) cuts the member's slice branch, no push. *WORKTREES.md* cuts the branch with `--no-track`, so nothing reads `origin/<epic-branch>` as its upstream: a stray `git pull` can't merge the epic into the slice, and `git branch -d` at step 6 compares against the base.

## A stopped member's activity

Before resolving a stop (retrying the slice, reassigning its lane), check the member's slice branch in its lane for commits after the timeout mark: `git -C <lane-path> log --since=<mark>`. There is no remote ref to read.
