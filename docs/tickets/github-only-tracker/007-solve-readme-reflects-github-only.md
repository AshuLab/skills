# 007 - solve/README.md reflects github-only

## Goal

`solve/README.md` describes a github-only skill set - the "Getting started" step, the docs-tree diagram, and the paragraph explaining local mode are all updated or removed to match what 001-006 actually ship.

## Context

docs/specs/github-only-tracker.md#scope, docs/adr/0002-github-becomes-solves-only-tracker-mode.md. Depends on 001 for `setup`'s actual new behavior.

## Definition of done

- [ ] "Getting started" step 1 no longer frames `/solve:setup` as "only if you want a GitHub tracker" with a "skip it, everything stays as markdown" fallback - it describes setup's actual github-only scope (worktree isolation, git/gh prerequisites, label creation), matching what ticket 001 shipped.
- [ ] The docs-tree diagram's `tickets/<feature>/ <- to-tickets: one markdown file per slice (local mode)` line is removed or replaced with the github sub-issues equivalent.
- [ ] The paragraph explaining "what local mode drops... a git remote is required in both modes" is removed - there's only one mode, the git-remote requirement is stated once, plainly.
- [ ] Tests: no tests - per spec. Verified by manual read-through: the README no longer mentions local mode as a live option anywhere.

## Blocked by

[001](./001-setup-assumes-github-drops-the-tracker-question.md)
