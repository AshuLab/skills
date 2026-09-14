# 0001 - Parallel slice draining in ship

- Status: accepted
- Date: 2026-09-14

## Context

`ship` drains an epic's slices strictly one at a time, in a single shared session, reusing one worktree per epic across every slice. In practice this has run sessions up to 800k tokens on a single drain, and every slice after the first carries the full transcript of every slice before it - the draining agent's context degrades as the epic gets longer, which shows up as lower-quality work on later slices, not just a slower one.
A parallel dependency graph - several hub slices startable at once, no blocker between them - compounds this: today they're still drained one after another even though nothing requires it, so time is lost on top of the context problem.

## Decision

`ship` gains two related but separable capabilities.
Delegated build is unconditional: every slice's build (claim through Close the loop's steps 1-3) runs inside a subagent with its own fresh context. The draining agent never holds more than each slice's close-out summary, whether the drain is sequential or parallel, github or local.
Parallel batch dispatch is additive and scoped: each round takes up to 3 of the currently-startable hub slices as concurrent delegated builds, github tracker mode only - even a lone startable slice goes through this path, so a freed lane can be reused. Local mode is excluded - claiming a ticket there is just opening its file, not atomic, so two concurrent claims on the same epic aren't safe. The draining agent still serializes the actual merge of each finished slice into the epic branch one at a time, never in parallel.
Worktree isolation follows the same split: local mode keeps today's one-worktree-per-epic model; every github-mode drain, batch of one or more, keeps that epic worktree and adds up to 3 **lane** worktrees alongside it - slots, not per-slice throwaways, that persist across the whole drain instead of being torn down per occupant. Mechanics (creating, freeing, reusing a lane) are in `solve/skills/ship/WORKTREES.md` -> **Lane worktrees, for a parallel batch**.
Partial failure inside a parallel batch doesn't discard sibling work: slices that finished cleanly still merge into the epic branch. The drain then halts to surface the one that failed, same as today's single-failure-halts-the-drain rule, but the successful siblings' work stands.

## Alternatives considered

Pure wall-clock parallelism without delegated build - dispatching hub slices concurrently but still inside the draining agent's own session context. Rejected: it would speed up the drain but leave the actual observed pain untouched, since the draining agent's context would keep accumulating across slices regardless of whether they ran one after another or side by side.
Token-cost savings as the motivation for parallel batches. Rejected: N concurrent subagents cost more aggregate tokens than one sequential agent, not fewer - each rebuilds its own context and runs a full lifecycle. The win parallel batches buy is bounded context per agent and wall-clock time, not total spend.
Parallelizing in local mode too, treating "no board" as license to run a local parallel batch. Rejected: local claiming has no atomicity to lean on, so two subagents could both pick the same unclaimed slice - the existing single-local-drain limitation isn't solved by this change, so parallel batches don't extend into it.
A worktree created fresh per slice and torn down the moment its merge lands - the first version of this decision, shipped and reviewed before this revision. Rejected in favor of persistent lanes: tearing down and recreating pays the install/symlink cost every round even when the next round's work could have reused what's already there, and it left no natural home for a slice that only becomes startable because the one just freed its blocker.

## Consequences

Every slice's build now runs one level removed from the draining agent, which bounds context growth per slice but also means the draining agent only sees what the subagent's close-out reports - any diagnosis of a slice's build has to go through that report or the subagent's own transcript, not the draining agent's live context.
`ship`'s worktree model is no longer a flat "one per epic" invariant - it branches on whether a parallel batch is in flight, which is more state for `Pick the tree` to track and more cleanup surface if a batch is interrupted mid-flight. Lanes also persist for the whole drain rather than being torn down after each merge, so up to 3 worktrees sit installed at once until `land` removes them - more standing disk/install footprint than the per-slice-teardown model it replaced.
A lane path collides on `<feature>` alone, the same assumption the epic worktree's own path already carries - but lanes widen the exposure from one shared path to up to 3, held open for the whole drain instead of one merge window.
A parallel batch can still hit a merge conflict at integration even though its slices built independently and conflict-free, if two of them touched the same file - the existing "stop and report, never auto-resolve" policy carries over unchanged, but fires more often than it did under strict sequencing.
Github-only scope means local-mode epics keep today's wall-clock cost, even after delegated build removes their context problem - local mode gets the quality fix, not the speed one.
