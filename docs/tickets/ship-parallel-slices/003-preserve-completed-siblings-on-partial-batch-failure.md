# 003 - Preserve completed siblings on partial batch failure

## Goal

When one member of a parallel batch fails or is blocked, the batch members that reported "ready-to-merge" still merge into the epic branch before the drain halts, instead of discarding their finished work.

## Context

docs/specs/ship-parallel-slices.md#solution (Scope story 5), docs/adr/0001-parallel-slice-draining-in-ship.md. Replaces 002's conservative halt-before-merging-any behavior.

## Definition of done

- [x] In a batch where at least one member reports "ready-to-merge" and at least one other reports `outcome: "stopped"`, every "ready-to-merge" member still merges into the epic branch, one at a time, per 002's serialized merge. Shipped in `solve/skills/ship/SKILL.md` -> **Draining an epic**: "merge every member that reported `ready-to-merge` into the epic branch, one at a time, in the order the reports arrived".
- [x] The drain halts after those merges land, reporting which slice(s) stopped and why - matching today's single-slice halt report. Shipped in the same paragraph: "halt the batch once those ready-to-merge merges land, and report it".
- [x] The drain does not pick another startable slice to replace the stopped one, or retry it automatically - same "don't cherry-pick to keep moving" rule as today's single-slice halt. Shipped: "don't merge the stopped member, and don't pick another startable slice to replace it or retry it automatically, same as today's single-slice halt."
- [x] Resuming the drain later (the stopped slice resolved) picks up correctly: the merged siblings are already closed out and don't get re-picked, and the previously-stopped slice is evaluated fresh. Guaranteed by unchanged mechanics, not new prose: each merged member still runs *Close the loop*'s steps 4-6 (merge, close issue, delete branch) before the drain moves on, so it no longer matches the startable-set query (open, unblocked, unclaimed) on a later run; the stopped member was never claimed-and-closed, so it's evaluated fresh. `solve/skills/ship/WORKTREES.md` -> **Freeing a lane** updated to match: a halted batch now frees (parks) every merged member's lane, leaving only the stopped member's lane unparked.
- [x] Tests: no tests - per spec. Verified by a manual read-through dry run against the shipped text (no scripted batch harness exists in this repo): the paragraph, read as instructions for an unattended agent, produces merge-then-halt on a mixed batch, and a resumed drain's startable-set query (unchanged) can't re-surface an already-merged, already-closed member.

## Blocked by

[002](./002-parallel-batch-dispatch-with-per-slice-worktree-isolation-and-serialized-merge.md)
