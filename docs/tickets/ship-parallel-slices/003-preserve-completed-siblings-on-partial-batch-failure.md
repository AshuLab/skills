# 003 - Preserve completed siblings on partial batch failure

## Goal

When one member of a parallel batch fails or is blocked, the batch members that reported "ready-to-merge" still merge into the epic branch before the drain halts, instead of discarding their finished work.

## Context

docs/specs/ship-parallel-slices.md#solution (Scope story 5), docs/adr/0001-parallel-slice-draining-in-ship.md. Replaces 002's conservative halt-before-merging-any behavior.

## Definition of done

- [ ] In a batch where at least one member reports "ready-to-merge" and at least one other reports "blocked" or "failed", every "ready-to-merge" member still merges into the epic branch, one at a time, per 002's serialized merge.
- [ ] The drain halts after those merges land, reporting which slice(s) failed or are blocked and why - matching today's single-slice halt report.
- [ ] The drain does not pick another startable slice to replace the failed one, or retry it automatically - same "don't cherry-pick to keep moving" rule as today's single-slice halt.
- [ ] Resuming the drain later (the failed slice resolved) picks up correctly: the merged siblings are already closed out and don't get re-picked, and the previously-failed slice is evaluated fresh.
- [ ] Tests: no tests - per spec. Verify with a manual dry run: a batch of 2, one scripted to fail its build - confirm the other merges into the epic branch and the drain halts reporting only the failed one, then confirm a second drain run doesn't re-touch the merged slice.

## Blocked by

[002](./002-parallel-batch-dispatch-with-per-slice-worktree-isolation-and-serialized-merge.md)
