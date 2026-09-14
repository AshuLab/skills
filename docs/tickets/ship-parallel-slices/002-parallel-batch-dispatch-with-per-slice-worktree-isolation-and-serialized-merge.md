# 002 - Parallel batch dispatch with per-slice worktree isolation and serialized merge

## Goal

When 2 or more hub slices are simultaneously startable in github tracker mode, ship dispatches up to 3 of them at once as concurrent delegated builds, each isolated in its own worktree, and merges their finished results into the epic branch one at a time.

## Context

docs/specs/ship-parallel-slices.md#solution (Scope stories 2-4), docs/glossary.md - parallel batch, hub slice, docs/adr/0001-parallel-slice-draining-in-ship.md. Builds on 001's delegated-build report contract.

## Definition of done

- [x] Finding the next startable work in github mode returns every currently-startable hub slice, not just one; the draining agent takes up to 3 of them (lowest-numbered first) as one batch, still respecting the existing "of this epic" scoping.
- [x] Each batch member's subagent gets its own worktree, created before dispatch and removed once that member's merge lands - the shared, one-worktree-per-epic model stays unchanged for sequential drains and for local mode.
- [x] The draining agent merges each batch member's "ready-to-merge" report into the epic branch one at a time, in the order the reports arrive - never two merges in flight at once.
- [x] A same-file conflict between two batch members' merges stops that merge and reports it, exactly as today's single-slice conflict policy (Close the loop) - no auto-resolve.
- [x] A batch never exceeds 3 concurrently-dispatched members, even when more than 3 hub slices are simultaneously startable - the rest wait for the next round.
- [x] If any batch member's report is "blocked" or "failed", the drain halts before merging any member of that batch (conservative default - ticket 003 changes this). Shipped grounded in the actual report contract's outcome value rather than this loose wording: a member reporting `outcome: "stopped"` (001's contract - "blocked" already means something else in this file, an open dependency) halts the whole batch before any merge, even members that already reported `ready-to-merge`.
- [x] Local-mode drains and github drains with only one startable hub slice at a time are unaffected - they keep going through 001's sequential delegated build.
- [x] Tests: no tests - per spec. Verified by design/consistency review (self and adversarial 3-axis code-review) plus reasoning through the full lifecycle against `docs/adr/0001-parallel-slice-draining-in-ship.md` and `docs/specs/ship-parallel-slices.md`. The literal manual dry run this box describes - a github-mode test epic with 3 simultaneously-startable hub slices - needs github tracker mode, which this repo doesn't run (it ships in local tracker mode); it's deferred to the first real github-mode epic that reaches 2+ simultaneously-startable hub slices, the same way ticket 001's dry run was this epic building itself.

## Blocked by

[001](./001-delegate-slice-build-to-a-subagent.md)
