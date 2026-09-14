# 003 - to-tickets always publishes GitHub sub-issues

## Goal

`to-tickets` always publishes slices as GitHub sub-issues with real `--blocked-by` edges; the local ticket-file format is removed.

## Context

docs/specs/github-only-tracker.md#scope (story 3), docs/adr/0002-github-becomes-solves-only-tracker-mode.md.

## Definition of done

- [ ] `to-tickets/SKILL.md`'s "Publish the slices" section keeps only the github path; the local `docs/tickets/<feature>/NNN-slug.md` format and its relative-link `Blocked by` convention are removed.
- [ ] Absent `docs/agents/solve.md`, `to-tickets` infers github instead of defaulting to local ticket files.
- [ ] Running `to-tickets` on a spec in this repo publishes GitHub sub-issues under the epic, each with a real `--blocked-by` edge to its dependency, never local ticket files.
- [ ] Tests: no tests - per spec. Verified by manual dry run: run `to-tickets` on a real spec in this repo and confirm it publishes github sub-issues with dependency edges.

## Blocked by

nothing
