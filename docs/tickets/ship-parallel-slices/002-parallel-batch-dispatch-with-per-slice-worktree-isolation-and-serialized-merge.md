# 002 - Parallel batch dispatch with per-slice worktree isolation and serialized merge

## Goal

When 2 or more hub slices are simultaneously startable in github tracker mode, ship dispatches up to 3 of them at once as concurrent delegated builds, each isolated in its own worktree, and merges their finished results into the epic branch one at a time.

## Context

docs/specs/ship-parallel-slices.md#solution (Scope stories 2-4), docs/glossary.md - parallel batch, hub slice, docs/adr/0001-parallel-slice-draining-in-ship.md. Builds on 001's delegated-build report contract.

## Definition of done

- [ ] Finding the next startable work in github mode returns every currently-startable hub slice, not just one; the draining agent takes up to 3 of them as one batch, still respecting the existing "of this epic" scoping.
- [ ] Each batch member's subagent gets its own worktree, created before dispatch and removed once that member's merge lands - the shared, one-worktree-per-epic model stays unchanged for sequential drains and for local mode.
- [ ] The draining agent merges each batch member's "ready-to-merge" report into the epic branch one at a time, in the order the reports arrive - never two merges in flight at once.
- [ ] A same-file conflict between two batch members' merges stops that merge and reports it, exactly as today's single-slice conflict policy (Close the loop) - no auto-resolve.
- [ ] A batch never exceeds 3 concurrently-dispatched members, even when more than 3 hub slices are simultaneously startable - the rest wait for the next round.
- [ ] If any batch member's report is "blocked" or "failed", the drain halts before merging any member of that batch (conservative default - ticket 003 changes this).
- [ ] Local-mode drains and github drains with only one startable hub slice at a time are unaffected - they keep going through 001's sequential delegated build.
- [ ] Tests: no tests - per spec. Verify with a manual dry run: a github-mode test epic with 3 simultaneously-startable hub slices - confirm 3 subagents dispatch concurrently, `git worktree list` shows 3 separate trees mid-batch, merges land one at a time, and each worktree is gone after its slice merges.

## Blocked by

[001](./001-delegate-slice-build-to-a-subagent.md)
