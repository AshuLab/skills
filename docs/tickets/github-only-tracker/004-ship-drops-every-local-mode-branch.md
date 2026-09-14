# 004 - ship drops every local-mode branch

## Goal

`ship` (+ WORKTREES.md) only ever operates in github mode - claiming, the next-startable-slice query, drain-completion checks, and `Blocked by` resolution all drop their local-mode branch.

## Context

docs/specs/github-only-tracker.md#scope (story 4), docs/adr/0002-github-becomes-solves-only-tracker-mode.md. Heaviest file in the epic - 13 local-mode mentions today.

## Definition of done

- [ ] "Claim it" keeps only the github self-assign path; the local "opening the ticket file, nothing recorded, concurrency isn't safe" branch is removed.
- [ ] "Draining an epic"'s next-startable-slice query, its `Blocked by` resolution, and its "Nothing startable" / "Every slice closed" epilogues keep only the github path (issue queries, `gh issue view --json subIssues`) - every local-mode reading-tickets-off-the-epic-branch branch is removed.
- [ ] "Close the loop" keeps only the github path for step 3 (open PR) and step 5 (close the issue, retarget stacked PRs) - the "local tracker has no PRs / no issue, boxes ticked is the signal" branches are removed.
- [ ] `WORKTREES.md`'s "In local mode there's no issue to write on" line, and any other local-mode branch in the worktree-recording step, are removed - github issue-comment recording is the only path.
- [ ] Absent `docs/agents/solve.md`, `ship` infers github (owner/name from the remote, base branch from origin's HEAD, `feature/<feature>/epic` + `feature/<feature>/<NNN-slug>` branch names) instead of defaulting to local tracker.
- [ ] Tests: no tests - per spec. Verified by manual dry run: run `ship` on a real github ticket in this repo, then drain a small multi-slice github epic, and confirm no local-mode branch is ever taken.

## Blocked by

nothing
