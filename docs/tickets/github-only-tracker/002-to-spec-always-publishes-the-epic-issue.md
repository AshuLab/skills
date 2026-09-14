# 002 - to-spec always publishes the epic issue

## Goal

`to-spec` always turns the brief into a GitHub epic issue; the local-file-as-final-spec path is removed.

## Context

docs/specs/github-only-tracker.md#scope (story 2), docs/adr/0002-github-becomes-solves-only-tracker-mode.md.

## Definition of done

- [ ] `to-spec/SKILL.md`'s "Where the spec lives" section keeps only the github path (create or update the epic issue); the "local -> the completed file... is the spec" branch is removed.
- [ ] Absent `docs/agents/solve.md`, `to-spec` infers github (repo owner/name from the git remote) instead of defaulting to a local file-as-spec.
- [ ] `SPEC-FORMAT.md`'s local-mode references are removed: the `Status: landed` local-mode counterpart note, and the "the `# <feature>` H1 and Status header serve the standalone local file" line - the on-disk file is no longer ever the terminal spec, only scaffolding `to-spec` reads before publishing to the issue.
- [ ] Running `to-spec` on a fresh brief in this repo creates or updates a github epic issue, never leaves the local file as the spec-of-record.
- [ ] Tests: no tests - per spec. Verified by manual dry run: run `to-spec` on a real brief in this repo and confirm it publishes a github epic issue.

## Blocked by

nothing
