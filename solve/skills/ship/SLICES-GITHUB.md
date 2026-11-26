# Slice delivery - github

The transport for a slice when **Slice delivery** in `docs/agents/solve.md` is `github`, or the section is absent. Steps 2-6 of *Close the loop* in `SKILL.md`, whole - read this file end to end and no other `SLICES-*.md`. The output contract every delivery mode meets is in *Slice delivery* in `SKILL.md`.

Each slice travels as its own PR: the slice branch is pushed, a PR opens against the slice's base, and the merge happens server-side with `gh pr merge`. Steps 2-3 run in the subagent, the check and steps 4-6 in the draining agent.

**2. Push the slice branch.**
`git push -u origin <slice-branch>` - github needs it before a PR can be opened, and it's what step 6 verifies and deletes against.

**3. Open the PR.**
Every slice gets its own PR. If the repo has a PR template (`.github/PULL_REQUEST_TEMPLATE.md`), fill it; otherwise short prose (no hard-wrap), three parts:
- `Closes #<n>` - links the ticket. It **won't auto-close on merge** (the slice merges into the epic branch, not the default branch), so **close the issue explicitly** after merging (`gh issue close <n>`).
- **what shipped** - the actual change in a line or two, not a copy of the goal.
- **verified** - definition of done met: checks and suite green, tests at the agreed seam (or "no tests - per spec").

## Check before merging

Before step 4, the draining agent runs one sanity check on the report itself, not a re-run of steps 1-3's own checks: `git fetch` and confirm `origin/<branch>` exists, and that the ticket's Definition of done boxes read `[x]` in the issue body (`gh issue view <n> --json body --jq .body`, grepped for `- [ ]`). A report that doesn't hold up here is treated as `outcome: "stopped"` - name the mismatch and halt, don't merge on faith.
Then have what it delivered checked before merging - not by you: dispatch a fresh subagent with only the ticket and the PR's diff (`gh pr diff <pr>`), so the check sees neither how it was built nor your drain's context. It answers two things - does everything in the diff serve this slice (no debug output, stray files, unrelated edits), and does every definition-of-done box point at a change it can name in the diff - and returns what's missing, nothing else; it never stops the drain. Clean -> step 4. Findings -> dispatch the slice once more through *Delegate the build*, on the same branch and PR, with those findings, then check again - one round, no more. Still findings after that -> merge anyway: post them as a comment on the slice PR, starting with the hidden marker `<!-- ship:slice-check -->`, and carry them as the slice's `note`, so they reach the integration PR's review instead of halting an unattended drain. The check reads only a diff and can be wrong; the stop conditions stay the build's own. This is not a `code-review` pass - the adversarial review is the integration PR's.

## Merge, close, delete

**4. Merge the slice into its base** - always a merge commit, never squash or rebase: the per-slice history *is* the review surface this model exists to keep. A repo that forbids merge commits is a conflict to raise, not to work around - `land` gates on the same thing.
Its base is whatever *Build it* cut it from: the **epic branch** for a hub slice, **the blocker's branch** for a stacked one whose blocker is still open - merge a stacked slice straight into the epic branch and it drags the blocker's unreviewed commits along, leaving the blocker's own PR with nothing to merge.
`gh pr merge <pr> --merge`.
**Refused for a merge conflict?** One resolution attempt on the **slice branch**, never on its base - *Resolving a slice-merge conflict*, below, has the procedure. Whatever it can't land is an **unresolved conflict**: stop and report the files.

**5. Close the issue** (`gh issue close <n>`).
That explicit close releases the next tickets and fires the **retarget**: any slice stacked on this one moves its PR base to the epic branch. Enumerate them, don't guess - `gh pr list --base <slice-branch>` is the list, and each one gets `gh pr edit <pr> --base <epic-branch>`.
Skip this and step 6 closes those PRs outright: GitHub closes any open PR whose base branch is deleted. Operations in `docs/agents/solve.md` -> **Branching**.

**6. Delete the slice branch.** Get off it first - `git switch <the base you merged into> && git pull` - then `git branch -d <slice-branch>` + `git push origin --delete <slice-branch>`. Nothing moved you off the slice branch (merge happened server-side), and git refuses to delete the branch you're standing on. The `pull` is what leaves the base current for the next slice.
**In a lane worktree, get off it by detaching instead of switching** - the base is already checked out in the shared tree, so `git switch <base>` is refused there: *Freeing a lane* in [WORKTREES.md](./WORKTREES.md) has the exact steps. Delete the branch the same way either side.
Two rules, both about not losing work:
- **Delete after the retarget (step 5), never before** - dropping a branch an open PR still targets orphans the slice stacked on it. So `gh pr merge --delete-branch` at step 4 is the wrong tool: it deletes on merge, before the retarget runs.
- **Confirm the merge landed before deleting**, and not with `-d`: with an upstream set (step 2) it validates against that upstream, not the base you merged into, and will delete an unmerged branch - warning, but exiting 0.
  Check against **the base you merged into at step 4** - the epic branch, or the blocker's branch for a stacked slice; check a stacked slice against the epic branch and a good merge reads as missing, halting the drain.
  Both sides must be **remote** refs: `git fetch`, then `git merge-base --is-ancestor origin/<slice-branch> origin/<that base>`. `gh pr merge` merges server-side, so your *local* copy of that base doesn't have the merge yet and the check fails on a slice that landed perfectly. If it doesn't succeed, stop - don't delete. Still `-d`, never `-D`.

## Resolving a slice-merge conflict

Read only when `gh pr merge` refuses a slice PR for a merge conflict - step 4 above.

One resolution attempt, on the **slice branch** in the tree it was built in (its lane, or the shared tree) - never on its base:

1. `git -C <tree> fetch && git -C <tree> merge origin/<base>` - a merge commit, never `rebase`.
2. Hand the conflict to a subagent - the slice's ticket, its spec section, the conflicting files - that returns *Delegate the build*'s close-out report:
   - **Semantic overlap** (both sides changed the same logic, signature or contract, or resolving would alter behaviour beyond the slice's spec): `git -C <tree> merge --abort`, `outcome: "stopped"`, `reason` naming the files.
   - **Additive or mechanical overlap** (independent entries in a shared list, enum, switch, registry, test file or imports): resolve it, then verify the definition of done as *Close the loop* in `SKILL.md` describes. Red: `git -C <tree> merge --abort`, `stopped` with what failed. Green: commit the merge, push, `ready-to-merge`.
   A missing or malformed report counts as `stopped` - run the `merge --abort` yourself if the merge is still in progress. Either way the tree is left clean on the slice branch.
3. `ready-to-merge`: wait for the PR's required checks - `gh pr checks <pr> --watch --required --fail-fast`, at most 2 hours. "no checks reported" exits 1 but means there's nothing to wait for: treat it as green. Then, once `gh pr view <pr> --json mergeable` no longer reads `UNKNOWN`, `gh pr merge <pr> --merge` again.
4. Merged: carry on with *Close the loop* step 5. Anything else - `stopped`, checks red or past the bound, a second refusal - is an **unresolved conflict**: stop and report the files.

## Unresolved slice checks, for the integration PR

Gathered from the PRs, not from memory: every slice PR merged into the epic branch (`gh pr list --base <epic-branch> --state merged`) that carries a `<!-- ship:slice-check -->` comment gets one line under **Unresolved slice checks** in the integration PR's body - the finding and a link to that comment. None -> omit the section.

## Lane branches

When *Creating a lane* or *Reusing a lane* in [WORKTREES.md](./WORKTREES.md) cuts the member's slice branch, push it right then, before dispatch: `git -C <lane-path> push -u origin <member-slice-branch>`.

## A stopped member's activity

Before resolving a stop (retrying the slice, reassigning its lane), check `origin/<member-slice-branch>` for pushes after the timeout mark.
