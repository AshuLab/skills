# 001 - setup assumes github, drops the tracker question

## Goal

`/solve:setup` no longer asks which tracker to use; it always configures github, and the zero-config default (no `docs/agents/solve.md`) infers github instead of falling back to local markdown.

## Context

docs/specs/github-only-tracker.md#scope (story 1), docs/adr/0002-github-becomes-solves-only-tracker-mode.md.

## Definition of done

- [ ] `setup/SKILL.md`'s "Pick the tracker" step is removed; "Detect the repo" no longer offers a local-mode fallback for a non-GitHub remote - a non-GitHub remote, or no remote, is a stop condition (say what's missing), matching the existing "No remote, or not in a repo -> stop" pattern already used in that same step.
- [ ] `setup/REFERENCE.md`'s local-mode Tracker/Branching template sections, and the "a local repo swaps two sections wholesale" caveat, are removed - only the github-flavored template remains.
- [ ] Running `/solve:setup` on a repo with a GitHub remote no longer asks which tracker to use - it goes straight to GitHub prerequisites (today's step 3).
- [ ] Running `/solve:setup` on a repo with a non-GitHub remote, or no remote, stops with a clear message instead of silently falling back to local mode.
- [ ] Tests: no tests - per spec (docs/specs/github-only-tracker.md#decisions). Verified by manual dry run: run `/solve:setup` on this repo (a real GitHub remote, `gh` already authenticated) and confirm no tracker question appears.

## Blocked by

nothing
