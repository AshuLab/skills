# 006 - pre-check and code-post drop their local-mode branch

## Goal

`pre-check`'s operational-prep step and `code-post`'s no-PR-destination branch both keep only the github path.

## Context

docs/specs/github-only-tracker.md#scope (story 6), docs/adr/0002-github-becomes-solves-only-tracker-mode.md.

## Definition of done

- [ ] `pre-check/SKILL.md`'s "Operational prep" step keeps only the github branch (labels + milestone); the "local - there are no labels or milestones to set; the ticket file is the whole surface" branch is removed, and "In github mode make sure `solve:refined` is on it" drops its now-unconditional "In github mode" qualifier.
- [ ] `code-post/SKILL.md`'s "No pull request at all (a local tracker has none)" branch is removed - a PR always exists to comment on in github mode; only a genuinely PR-less input (a supplied diff, a file) still falls back to handing the report back as a file.
- [ ] Tests: no tests - per spec. Verified by manual dry run: run `pre-check` and `code-post` against a real github ticket/PR in this repo and confirm only github-mode behavior surfaces.

## Blocked by

nothing
