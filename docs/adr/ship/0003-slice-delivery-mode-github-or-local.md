# 0003 - Slice delivery becomes a mode: github or local

- Status: accepted
- Date: 2026-11-25

## Context

`ship` delivers every slice through a GitHub PR: push the slice branch, open the PR, `gh pr merge --merge` into the epic branch. Each slice PR triggers the repo's CI, and on a wide epic that is up to 3 concurrent runs per round that nobody reads - the suite already ran locally in the slice's subagent, and the one review surface is the integration PR. The cost is wall-clock time and runner queue, and, where branch protection requires checks on the epic branches, a merge that `gh pr merge` refuses until CI passes.

ADR 0002 removed local mode from the whole solve skill set because two parallel paths inside the same files produced real bugs (local text disagreeing with github text, found by the `code-resolve` pass on PR #4). What the user wants now is narrower than what 0002 removed: the **tracker** stays GitHub, only the **transport of a slice** - how its branch reaches the epic branch - becomes switchable.

## Decision

`setup` asks once how slices are delivered and records it in `docs/agents/solve.md` under a **Slice delivery** section: `github` (default, today's behavior) or `local`.

- **github** - unchanged: slice branch pushed, one PR per slice, `gh pr merge --merge`, retarget for stacked slices.
- **local** - the slice branch is never pushed and no slice PR exists. The PR's record (`Closes #n`, what shipped, verified) goes in the merge commit message. The draining agent merges with `git merge --no-ff <slice-branch>` in the tree that has the epic branch checked out, then pushes the **epic branch** after every merge, so `origin/<epic-branch>` stays the source of truth for lanes, resume, other clones and `land`.

What stays on GitHub in both modes: issues (claim, close, epic, sub-issues, dependency edges), the epic branch itself, and the **integration PR** - the one a human reviews and `land` merges. `land` needs no mode-specific path - the one thing it learns is that a never-pushed slice branch is proved from the local ref and deleted locally only.

**One complete file per mode, never inline branching.** `ship/SKILL.md` keeps what is identical in both modes (the branch model, delegation and the close-out report, draining, stop conditions, the hard rules) plus an **output contract** both modes must meet: slice merged into the epic branch with a merge commit, issue closed, slice branch deleted, epic branch pushed, report fields. The transport steps - push and record, the diff the check reads, merge, issue close, retarget, merge proof and branch delete, conflict resolution, how unresolved slice checks reach the integration PR - live in `ship/SLICES-GITHUB.md` and `ship/SLICES-LOCAL.md`. `ship` reads the mode once, then reads exactly one of the two files, whole; the subagent is handed the same path. An absent `solve.md` means `github`; an unrecognised value stops the run rather than guessing.

## Alternatives considered

- **Inline `if local` branches in `ship/SKILL.md`.** Rejected: it is the shape 0002 removed - one file the reader must mentally filter, and the disagreement bug lives in exactly that filtering.
- **Fix the CI cost in the repo's workflow config** (run CI only on PRs into the destination, concurrency cancel, no required checks on `<type>/*/epic`). Not rejected - it needs no plugin change and works today - but it leaves the PR-per-slice overhead and is the repo owner's config, not something `setup` can offer.
- **Push the epic branch once, at the end of the drain.** Rejected: a halted drain would leave merged work only on one machine, and every `origin/<epic-branch>` reference in lanes, resume and `land` would need a local-ref variant.
- **Also make the integration PR local.** Rejected: it is the single human review surface, and `land`'s gates (mergeable, review decision, checks) are built on it.

## Consequences

Two transport files that must stay in step. Their duplicated invariants (merge commit only, an ancestor check before any delete, never `-D`) are accepted as duplication - each file reads end to end without jumping - and the **output contract** in `SKILL.md` is the single place a behavior change is written; a change to one mode file requires reading the other against it.

In `local` mode the slice-level safety net is the suite each subagent already runs and the integration PR's CI; there is no CI on an individual slice and no PR thread for a reviewer to attach to it. `ship`'s per-slice subagent check still runs, reading `git diff <base>...<slice-branch>` instead of `gh pr diff`.

The merge needs a clean tree with the epic branch checked out - always the shared tree, since [0004](0004-epics-drain-in-the-shared-tree-worktrees-are-lanes-only.md) removed the per-epic worktree - so the dirty-tree rules of *Pick the tree* apply to it.

The epic branch is pushed after every merge, so a CI workflow triggered `on: push` to branches still runs once per slice; only `pull_request`-triggered CI is skipped, unless the repo excludes `<branch-type>/*/epic` from the push trigger. `setup` says so when it asks. A stacked slice (handed to `ship` directly while its blocker is open) has only local copies in this mode, so stacks are single-clone.

This amends 0002, it does not reverse it: GitHub remains the only tracker, and no local tickets, specs-as-final or claim operations come back.
