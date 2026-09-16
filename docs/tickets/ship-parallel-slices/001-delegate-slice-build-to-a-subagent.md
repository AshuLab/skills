# 001 - Delegate slice build to a subagent

## Goal

Ship's per-slice build (claim through Close the loop's steps 1-3: commit, push, open PR) runs inside a subagent with its own fresh context, and the draining agent continues only from that subagent's close-out report.

## Context

docs/specs/ship-parallel-slices.md#solution (Scope story 1), docs/glossary.md - delegated build, docs/adr/0001-parallel-slice-draining-in-ship.md.

## Definition of done

- [x] Draining a single ticket or an epic launches a subagent per slice that runs claim it, build it, and close the loop steps 1-3 - unchanged in behavior from what ship does today inline. Pick the tree and Clean the tree, cut the epic branch stay the draining agent's job, run once per drain, not re-run inside each subagent.
- [x] The subagent returns a close-out report shaped as:
```
{
  slice: <ticket handle>,
  outcome: "ready-to-merge" | "stopped",
  branch: <pushed branch name>,
  pr: <PR reference (github) | ticket path (local)>,
  definitionOfDone: { <box>: boolean, ... },
  reason?: <string, present when outcome is "stopped">,
  note?: <string, present whenever something needs to surface regardless of outcome - e.g. Close the loop's "repo arrived broken, not your slice's fault" case>
}
```
- [x] The draining agent performs Close the loop's steps 4-6 (merge, close issue, delete branch) using only that report - never the subagent's own transcript or tool history.
- [x] A sequential drain (no parallel batch, today's only mode) produces the same end state as before this change - same commits, same merges, same closed tickets - for an epic of 2+ slices with no simultaneously-startable hub slices.
- [x] Tests: no tests - per spec (docs/specs/ship-parallel-slices.md#decisions). Verified by dry run: tickets 002 and 003 of this same epic are themselves built via the delegated-build model this ticket ships.

## Blocked by

nothing
