# 0004 - Epics drain in the shared tree; worktrees are lanes only

- Status: accepted
- Date: 2026-11-25

## Context

`ship` could give each epic its own git worktree: an `off` (default) / `on` mode in `docs/agents/solve.md`, a per-run "worktree this epic" request, a `worktree` exit on the pre-flight halt, a four-row table in *Pick the tree*, stash-by-path to carry loose work across, and an epic-worktree record comment that `land` later used to find and remove it. Its one purpose was two epics draining in one clone without colliding.

It costs a dependency install and a set of symlinks per epic, and it makes every later step ask where the epic branch is checked out - the epic worktree or the shared tree. ADR 0003's local slice delivery has to merge into the epic branch in a tree that has it checked out, and with two candidate trees that step is a decision the draining agent must make every time. Lane worktrees are a different thing: a parallel batch needs them whatever the mode, because concurrent subagents cannot share one working tree (ADR 0001).

## Decision

An epic always drains in the **shared tree**. The per-epic worktree is removed, with its mode, its path-for-the-epic, its per-run request, its pre-flight exit, its stash carry-over, its record comment and its removal in `land`. **Lane worktrees are unchanged**: up to 3 per batch, created once, parked between occupants, removed by `land`.

`setup` no longer asks whether to isolate epics; the **Worktrees** section of `solve.md` keeps the path, bootstrap and linked config, because lanes need all three. An older `solve.md` with a leftover `off`/`on` line is read without it - nothing is migrated.

Two epics can no longer drain in one clone. *Pick the tree* stops the run when it finds another epic's branch checked out, another epic's lanes, or a dirty tree that isn't its own, and the report says so; the second epic drains in another clone or after the first.

## Alternatives considered

- **Keep the mode, drop only the `setup` question.** Rejected: `ship` would keep the whole table, the stash carry-over and the record comment for an option nobody can switch on except per run.
- **Always an epic worktree, no `off`.** Rejected: it makes the common one-epic-at-a-time case pay the install on every epic, against the goal of a faster drain.

## Consequences

Epics that were isolated in one clone now need a second clone. This is a deliberate loss, accepted because the owner works one epic per clone.

The merge into the epic branch always happens in the shared tree, which keeps the epic branch checked out for the whole drain. A lane therefore always detaches rather than switching to the epic branch, and `land` must switch the shared tree to the destination before it deletes the epic branch.

This amends [0001](0001-parallel-slice-draining-in-ship.md)'s *Worktree isolation* paragraph - the epic-worktree half; its lane half and the parallel batch stand.
