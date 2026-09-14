# 005 - land always merges the PR and closes the epic issue

## Goal

`land` always merges the integration PR (never an epic branch directly) and closes the epic issue; every local-mode branch is removed.

## Context

docs/specs/github-only-tracker.md#scope (story 5), docs/adr/0002-github-becomes-solves-only-tracker-mode.md.

## Definition of done

- [ ] "Merge it"'s gate order, the tickets-off-the-epic-branch reading step, and the merge-method step keep only the github path (`gh pr ready`, gate 5, `gh pr merge --merge`) - the local "no PR, `git merge --no-ff` the epic branch directly" branch, and the "or 1 then 4 in local mode" gate-order exception, are removed.
- [ ] "Close it out" keeps only the github path for closing the epic issue and reading tracker mode/branch names - the "absent file -> local mode" default and its branch-name fallback are replaced with inferred github.
- [ ] Tests: no tests - per spec. Verified by manual dry run: run `land` against a real ready integration PR (this repo's own PR #4 - ship-parallel-slices - is a candidate, once approved) and confirm it merges the PR and closes the epic issue, no local-mode branch taken.

## Blocked by

nothing
