# ship-parallel-slices

Status: spec

## Problem

Diego runs `ship` to drain epics in other repos, and a single drain has run up to 800k tokens in one session because `ship` today builds every slice sequentially inside one shared session, reusing one worktree per epic across the whole epic.
Every slice after the first carries the full transcript of every slice before it, and more tokens in a single agent's context correlates with worse output - so later slices in a long epic get built with a degraded context, not just a slower one.
Separately, when an epic's dependency graph is wide - several [[hub-slice]]s startable at the same time, no blocker between them - `ship` still drains them one after another even though nothing requires it, losing wall-clock time on top of the context problem.

## Solution

`ship` gains [[delegated-build]]: every slice's build (claim through Close the loop's steps 1-3 - commit, push, open PR) runs inside a subagent with its own fresh context, unconditionally, sequential or parallel, github or local. The draining agent's context holds only each slice's close-out summary, never a full build transcript. This is the fix for the actual observed pain, and it changes nothing about the lifecycle itself - the subagent runs the exact same per-slice steps `ship` already defines (claim it, pick the tree, clean the tree, build it, close the loop 1-3), just one level removed from the draining agent's own session.
On top of that, `ship` gains [[parallel-batch]] dispatch: when a drain finds more than one simultaneously-startable hub slice, it dispatches up to 3 of them at once as concurrent delegated builds, github tracker mode only. Local mode is excluded - claiming a ticket there is just opening its file, not atomic, so two concurrent claims on the same local epic aren't safe; local epics still get delegated build (the context fix), just not concurrent dispatch. The draining agent still serializes the actual merge of each finished slice into the epic branch one at a time, never in parallel - a parallel batch changes when slices *build*, not the order they *land*.
Worktree isolation follows the same split: today's one-worktree-per-epic model holds for sequential draining and for local mode; a parallel batch instead isolates one worktree per slice-in-flight, torn down once that slice's merge lands.
A partial failure inside a parallel batch doesn't discard sibling work: slices that finished cleanly still merge into the epic branch, and the drain halts to surface the one that failed - same as today's single-failure-halts-the-drain rule, but the successful siblings' work stands rather than being rolled back.
Full reasoning and the alternatives weighed are in [[0001-parallel-slice-draining-in-ship]].

## Scope

1. Delegated build - a slice's build (claim through Close the loop steps 1-3) runs inside a subagent with fresh context, for every drain, sequential or parallel, github or local.
2. Parallel batch dispatch - when 2 or more hub slices are simultaneously startable in github mode, dispatch up to 3 of them together as concurrent delegated builds instead of draining them one at a time.
3. Per-slice worktree isolation - during a parallel batch, each in-flight slice gets its own worktree, created on dispatch and removed once that slice merges; sequential draining and local mode keep the existing one-worktree-per-epic model.
4. Serialized merge - the draining agent merges each parallel batch member's finished build into the epic branch one at a time, in the order builds finish, preserving the existing "stop and report, never auto-resolve" conflict policy.
5. Partial-failure handling - when one member of a parallel batch fails, the members that finished cleanly still merge; the drain then halts to surface the failed one, without rolling back the merged siblings.

## Decisions

Design and alternatives: [[0001-parallel-slice-draining-in-ship]].

**Claim ordering in a batch** - each dispatched subagent claims its own slice as the first step of its delegated lifecycle (the existing "Claim it" step, unmodified), rather than the draining agent claiming all batch members upfront before dispatch. Reusing the existing per-slice lifecycle as-is, inside the subagent, is the smaller and more consistent change than adding a new batch-claim step to the orchestrator.

**Batch progress reporting** - the draining agent tracks each in-flight batch member's status (dispatched / merged / failed) and reports one consolidated line per batch on close-out, e.g. "batch of 3: #12 merged, #13 merged, #14 blocked - <reason>" - not a running per-subagent stream.

**Testing seams (stories 1-5)** - no tests. This repo has no eval or test harness for skill behavior (checked: no `*.test.*`, no `test_*`, no eval tooling under this repo). Verification is a manual dry run per story against a real or scripted multi-slice local epic: story 1 by inspecting the draining agent's own transcript for the absence of full build content; story 2 by confirming subagents dispatch concurrently and the cap holds at 3 when more slices are eligible; story 3 by inspecting `git worktree list` mid-batch for one worktree per in-flight slice, removed after merge; story 4 by confirming merges into the epic branch don't interleave, and that a scripted same-file collision between two batch members still stops and reports rather than auto-resolving; story 5 by scripting one batch member to fail and confirming its siblings still merge while the drain halts on the failure.

## Out of scope

Parallel dispatch in local mode - local epics get delegated build (the context fix) but keep today's sequential wall-clock cost.
Concurrency above 3 simultaneous slices in a batch - capped so a wide fan-out doesn't turn into an unreviewable pile of subagents running at once.
Any change to how merge conflicts at integration are handled - the existing "stop and report, never auto-resolve" policy carries over unchanged; it will simply fire more often, since a parallel batch's slices aren't sequenced against each other's changes during build.
Per-slice human review - a parallel batch still merges each finished slice on its own, same trust level `ship` already has today; only the final integration PR is a human review surface.

## Open questions

How often epics in this and other repos actually reach 2+ simultaneously-startable hub slices - worth a quick `research` pass over existing ticket/dependency history before committing to a cap of 3, in case the real distribution never gets that wide, or regularly goes wider.
