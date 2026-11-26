# Slice delivery - github

The transport for a slice when **Slice delivery** in `docs/agents/solve.md` is `github`, or the section is absent. Steps 2-6 of *Close the loop* in `SKILL.md` - read this file end to end and no other `SLICES-*.md`. The output contract, *Check before merging* and *Resolving a slice-merge conflict* are in *Slice delivery* in `SKILL.md`; this file gives their commands.

Each slice travels as its own PR: the slice branch is pushed, a PR opens against the slice's base, and the merge happens server-side with `gh pr merge`. Steps 2-3 run in the subagent, the check and steps 4-6 in the draining agent.

`<slice-base>` is the branch the slice merges into: the **epic branch** for a hub slice, **the blocker's branch** for a stacked one whose blocker is still open.

**2. Push the slice branch.**
`git push -u origin <slice-branch>` - github needs it before a PR can be opened, and it's what step 6 verifies and deletes against.

**3. Open the PR.**
Every slice gets its own PR. If the repo has a PR template (`.github/PULL_REQUEST_TEMPLATE.md`), fill it; otherwise short prose (no hard-wrap), three parts:
- `Closes #<n>` - links the ticket. It **won't auto-close on merge** (the slice merges into the epic branch, not the default branch), so **close the issue explicitly** after merging (`gh issue close <n>`).
- **what shipped** - the actual change in a line or two, not a copy of the goal.
- **verified** - definition of done met: checks and suite green, tests at the agreed seam (or "no tests - per spec").

## Check before merging

- **The slice branch exists**: `git fetch`, then `origin/<slice-branch>` is there.
- **The slice's diff**: `gh pr diff <pr>`. The re-dispatch reuses the same branch and PR.
- **Findings still open after the round**: post them as a comment on the slice PR, starting with the hidden marker `<!-- ship:slice-check -->`.

## Merge, close, delete

**4. Merge the slice into its base** - always a merge commit, never squash or rebase: the per-slice history *is* the review surface this model exists to keep. A repo that forbids merge commits is a conflict to raise, not to work around - `land` gates on the same thing.
Its base is `<slice-base>` - merge a stacked slice straight into the epic branch and it drags the blocker's unreviewed commits along, leaving the blocker's own PR with nothing to merge.
`gh pr merge <pr> --merge`.
**Refused for a merge conflict?** *Resolving a slice-merge conflict* in `SKILL.md`, with the commands below. Whatever it can't land is an **unresolved conflict**: stop and report the files.

**5. Close the issue** (`gh issue close <n>`).
That explicit close releases the next tickets and fires the **retarget**: any slice stacked on this one moves its PR base to the epic branch. Enumerate them, don't guess - `gh pr list --base <slice-branch>` is the list, and each one gets `gh pr edit <pr> --base <epic-branch>`.
Skip this and step 6 closes those PRs outright: GitHub closes any open PR whose base branch is deleted. Operations in `docs/agents/solve.md` -> **Branching**.

**6. Delete the slice branch.** Get off it first - `git switch <slice-base> && git pull` - then `git branch -d <slice-branch>` + `git push origin --delete <slice-branch>`. Nothing moved you off the slice branch (merge happened server-side), and git refuses to delete the branch you're standing on. The `pull` is what leaves the base current for the next slice.
**In a lane worktree, get off it by detaching instead of switching** - the base is already checked out in the shared tree, so `git switch <slice-base>` is refused there: *Freeing a lane* in [WORKTREES.md](./WORKTREES.md) has the exact steps. Delete the branch the same way either side.
Two rules, both about not losing work:
- **Delete after the retarget (step 5), never before** - dropping a branch an open PR still targets orphans the slice stacked on it. So `gh pr merge --delete-branch` at step 4 is the wrong tool: it deletes on merge, before the retarget runs.
- **Confirm the merge landed before deleting**, and not with `-d`: with an upstream set (step 2) it validates against that upstream, not the base you merged into, and will delete an unmerged branch - warning, but exiting 0.
  Check against `<slice-base>` - check a stacked slice against the epic branch and a good merge reads as missing, halting the drain.
  Both sides must be **remote** refs: `git fetch`, then `git merge-base --is-ancestor origin/<slice-branch> origin/<slice-base>`. `gh pr merge` merges server-side, so your *local* copy of that base doesn't have the merge yet and the check fails on a slice that landed perfectly. If it doesn't succeed, stop - don't delete. Still `-d`, never `-D`.

## Resolving a slice-merge conflict

The commands for *Resolving a slice-merge conflict* in `SKILL.md`, read only when `gh pr merge` refuses a slice PR for a merge conflict:

- **Merge the base in**: `git -C <tree> fetch && git -C <tree> merge origin/<slice-base>`.
- **Publish the resolution**: after committing the merge, `git -C <tree> push`.
- **Merge again**: wait for the PR's required checks - `gh pr checks <pr> --watch --required --fail-fast`, at most 2 hours. "no checks reported" exits 1 but means there's nothing to wait for: treat it as green. Then, once `gh pr view <pr> --json mergeable` no longer reads `UNKNOWN`, `gh pr merge <pr> --merge` again. Checks red or past the bound -> **unresolved conflict**.

## Unresolved slice checks, for the integration PR

Gathered from the PRs, not from memory: every slice PR merged into the epic branch (`gh pr list --base <epic-branch> --state merged`) that carries a `<!-- ship:slice-check -->` comment gets one line under **Unresolved slice checks** in the integration PR's body - the finding and a link to that comment. None -> omit the section.

## Lane branches

When *Creating a lane* or *Reusing a lane* in [WORKTREES.md](./WORKTREES.md) cuts the member's slice branch, push it right then, before dispatch: `git -C <lane-path> push -u origin <member-slice-branch>`.

## A stopped member's activity

Before resolving a stop (retrying the slice, reassigning its lane), check `origin/<member-slice-branch>` for pushes after the timeout mark.
