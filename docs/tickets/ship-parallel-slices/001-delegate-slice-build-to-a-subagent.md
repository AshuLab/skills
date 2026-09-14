# 001 - Delegate slice build to a subagent

## Goal

Ship's per-slice build (claim through Close the loop's steps 1-3: commit, push, open PR) runs inside a subagent with its own fresh context, and the draining agent continues only from that subagent's close-out report.

## Context

docs/specs/ship-parallel-slices.md#solution (Scope story 1), docs/glossary.md - delegated build, docs/adr/0001-parallel-slice-draining-in-ship.md.

## Definition of done

- [ ] Draining a single ticket or an epic launches a subagent per slice that runs the existing per-slice lifecycle - claim it, pick the tree, clean the tree, build it, close the loop steps 1-3 - unchanged in behavior from what ship does today inline.
- [ ] The subagent returns a close-out report shaped as:
```
{
  slice: <ticket handle>,
  outcome: "ready-to-merge" | "blocked" | "failed",
  branch: <pushed branch name>,
  pr: <PR reference (github) | ticket path (local)>,
  definitionOfDone: { <box>: boolean, ... },
  reason?: <string, present when outcome isn't "ready-to-merge">
}
```
- [ ] The draining agent performs Close the loop's steps 4-6 (merge, close issue, delete branch) using only that report - never the subagent's own transcript or tool history.
- [ ] A sequential drain (no parallel batch, today's only mode) produces the same end state as before this change - same commits, same merges, same closed tickets - for an epic of 2+ slices with no simultaneously-startable hub slices.
- [ ] Tests: no tests - per spec (docs/specs/ship-parallel-slices.md#decisions). Verify with a manual dry run: drain a real local epic of 2+ sequential slices and confirm the draining agent's own transcript holds only each slice's close-out report, not the subagent's build steps.

## Blocked by

nothing
