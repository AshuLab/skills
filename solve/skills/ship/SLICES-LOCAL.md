# Slice delivery - local

The transport for a slice when **Slice delivery** in `docs/agents/solve.md` is `local`. Steps 2-6 of *Close the loop* in `SKILL.md`, whole - read this file end to end and no other `SLICES-*.md`. The output contract every delivery mode meets is in *Slice delivery* in `SKILL.md`.

No slice PR exists and a slice branch is never pushed. The slice's record is its **merge commit**; the draining agent merges it into its base in the shared tree and pushes the **epic branch** after every merge, so `origin/<epic-branch>` stays current for lanes, resume, other clones and `land`. Issues, the epic branch and the integration PR stay on GitHub. Steps 2-3 run in the subagent, the check and steps 4-6 in the draining agent.

Every branch here is local to this repository, so the shared tree and every lane worktree see each other's slice branches - that is what lets the draining agent merge what a lane built.

**2. Publish the slice** - nothing to push. The subagent stops after its commit and reports with `pr` set to `null`. Never push a slice branch: nothing reads it on the remote, and `land` would find a stray.

**3. Record the slice** - a slice has no PR body, so the record is written at the merge (step 4) and the subagent hands over what goes in it: the report carries `shipped` (the actual change in a line or two, not a copy of the goal) and `verified` (definition of done met: checks and suite green, tests at the agreed seam, or "no tests - per spec").

## Check before merging

Before step 4, the draining agent runs one sanity check on the report itself, not a re-run of steps 1-3's own checks: `git rev-parse --verify <branch>` confirms the slice branch exists here, and the ticket's Definition of done boxes read `[x]` in the issue body (`gh issue view <n> --json body --jq .body`, grepped for `- [ ]`). A report that doesn't hold up is treated as `outcome: "stopped"` - name the mismatch and halt, don't merge on faith.
Then have what it delivered checked before merging - not by you: dispatch a fresh subagent with only the ticket and the slice's diff (`git diff <base>...<slice-branch>`, `<base>` as step 4 defines it), so the check sees neither how it was built nor your drain's context. It answers two things - does everything in the diff serve this slice (no debug output, stray files, unrelated edits), and does every definition-of-done box point at a change it can name in the diff - and returns what's missing, nothing else; it never stops the drain. Clean -> step 4. Findings -> dispatch the slice once more through *Delegate the build*, on the same branch, with those findings, then check again - one round, no more. Still findings after that -> merge anyway: put them in the merge commit message on a line starting `ship:slice-check:`, and carry them as the slice's `note`, so they reach the integration PR's review instead of halting an unattended drain. The check reads only a diff and can be wrong; the stop conditions stay the build's own. This is not a `code-review` pass - the adversarial review is the integration PR's.

## Merge, close, delete

**4. Merge the slice into its base** - always a merge commit, never squash or rebase: the per-slice history *is* the review surface this model exists to keep.
Its base is whatever *Build it* cut it from: the **epic branch** for a hub slice, **the blocker's branch** for a stacked one whose blocker is still open - merge a stacked slice straight into the epic branch and it drags the blocker's unreviewed commits along.
A **stacked** slice exists only when `ship` is handed a slice whose blocker is still open, and in this mode both its branch and the blocker's are local-only until merged: **stacks are single-clone**, nobody can resume one from another clone. A `git switch <blocker-branch>` refused because a lane holds that branch -> stop and say so.
**Already merged?** If `git log --merges --grep='^Merge slice #<n> into' --format=%h -1 <base>` finds this slice's merge commit, an earlier run died after the merge, before the push or the close: skip the merge and go on from the push. A slice branch that is an ancestor of `<base>` *without* such a commit has no commits of its own to deliver: `outcome: "stopped"`, `reason: "slice branch has no commits of its own"`.
In the **shared tree**, clean, and never anywhere else: `git switch <base>`; for the epic branch also `git fetch && git pull --ff-only` (the blocker's branch has no remote, skip it). The pull refused because the epic branch **diverged** from `origin/<epic-branch>` -> stop and report which commits are local-only (`git log origin/<epic-branch>..<epic-branch>`); never reset or force. Write the message into the run's scratch dir (`mktemp -d`) with a file-write tool, never through the shell:

```
Merge slice #<n> into <base>: <ticket title>

Closes #<n>

shipped: <the report's shipped>
verified: <the report's verified>
ship:slice-check: <the finding>      (only a slice whose check still had findings; one line each)
```

then `git merge --no-ff <slice-branch> -F "<dir>/msg"`. Landed on the **epic branch** -> `git push origin <epic-branch>`. Refused as non-fast-forward, someone else pushed: stop and report, never force - the merge stays in the local epic branch. Once a person has settled the divergence, run `ship` again **on that ticket** - it finds the slice already merged (above) and retries only the push; a fresh drain won't pick it up, since the slice is still assigned. Or push the epic branch and close the issue by hand. Landed on a blocker's branch -> no push: it was never published.
**The merge stopped on a conflict?** `git merge --abort` first, so the shared tree is clean again, then one resolution attempt on the **slice branch**, never on its base - *Resolving a slice-merge conflict*, below. Whatever it can't land is an **unresolved conflict**: stop and report the files.
**Stopped for any other reason** - a commit-msg hook rejecting the merge message, say - `git merge --abort` if `git rev-parse -q --verify MERGE_HEAD` finds a merge in progress, then stop and report the reason. The slice stays `ready-to-merge`, unmerged, for the next round.

**5. Close the issue** (`gh issue close <n>`).
That explicit close releases the next tickets. There is nothing to retarget: no PR points at the slice branch, and a slice stacked on this one resolves its base at its own merge - the epic branch, now that this one is closed.

**6. Delete the slice branch.** Get off it first - in the shared tree step 4 already left you on the base; in a lane, detach: *Freeing a lane* in [WORKTREES.md](./WORKTREES.md) has the exact steps. Then **prove the merge landed**: after the push, `git fetch` and `git merge-base --is-ancestor <slice-branch> origin/<epic-branch>` (against the blocker's branch, the local ref - nothing else holds it). If it doesn't succeed, stop - don't delete. Then `git branch -d <slice-branch>`; there is no remote branch to delete. Still `-d`, never `-D`.

## Resolving a slice-merge conflict

Read only when step 4's `git merge` stopped on a conflict.

One resolution attempt, on the **slice branch** in the tree it was built in (its lane, or the shared tree) - never on its base:

1. Start on the slice branch: `git -C <tree> switch <slice-branch>` - a no-op in a lane, but after step 4's abort the shared tree is still on the base, and merging the base into itself resolves nothing. Then `git -C <tree> merge <base>` - a merge commit, never `rebase`. `<base>` is the local ref: this mode keeps it current.
2. Hand the conflict to a subagent - the slice's ticket, its spec section, the conflicting files - that returns *Delegate the build*'s close-out report:
   - **Semantic overlap** (both sides changed the same logic, signature or contract, or resolving would alter behaviour beyond the slice's spec): `git -C <tree> merge --abort`, `outcome: "stopped"`, `reason` naming the files.
   - **Additive or mechanical overlap** (independent entries in a shared list, enum, switch, registry, test file or imports): resolve it, then verify the definition of done as *Close the loop* in `SKILL.md` describes. Red: `git -C <tree> merge --abort`, `stopped` with what failed. Green: commit the merge, `ready-to-merge`.
   A missing or malformed report counts as `stopped` - run the `merge --abort` yourself if the merge is still in progress. Either way the tree is left clean on the slice branch.
3. `ready-to-merge`: run step 4 again - there are no PR checks to wait for.
4. Merged: carry on with step 5. Anything else - `stopped`, or a second conflict - is an **unresolved conflict**: stop and report the files.

## Unresolved slice checks, for the integration PR

Gathered from the commits, not from memory: `git log --merges --grep='^ship:slice-check:' --format='%h%n%b' origin/<destination>..<epic-branch>` - each matching merge commit gets one line under **Unresolved slice checks** in the integration PR's body, the finding and the commit's short hash. None -> omit the section.

## Lane branches

When *Creating a lane* or *Reusing a lane* in [WORKTREES.md](./WORKTREES.md) cuts the member's slice branch, no push. *WORKTREES.md* cuts the branch with `--no-track`, so nothing reads `origin/<epic-branch>` as its upstream: a stray `git pull` can't merge the epic into the slice, and `git branch -d` at step 6 compares against the base.

## A stopped member's activity

Before resolving a stop (retrying the slice, reassigning its lane), check the member's slice branch in its lane for commits after the timeout mark: `git -C <lane-path> log --since=<mark>`. There is no remote ref to read.
