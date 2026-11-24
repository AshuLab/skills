# 0002 - Github becomes solve's only tracker mode

- Status: accepted
- Date: 2026-09-14

## Context

The `solve` skill set (sharpen, to-spec, to-tickets, ship, land, pre-check, code-post, setup) has always supported two tracker modes - local markdown under `docs/` (the zero-config default) and GitHub Issues (opt-in via `/solve:setup`). Local-mode branching logic touches 10 files, 13 mentions in `ship/SKILL.md` alone, the heaviest.
Diego, currently the plugin's sole user, confirmed local mode has never added value since it was introduced - he doesn't use it, and this very repo has been running solve in local mode this whole session purely by default (no `docs/agents/solve.md` ever existed here), not by choice.
The parallel local/github logic paths are also a real, evidenced maintenance cost: the `code-resolve` pass on PR #4 (the ship-parallel-slices epic, same repo) found multiple real bugs that were specifically local-mode text disagreeing with what actually shipped for github mode.

## Decision

We remove local tracker mode entirely from the solve skill set - github becomes the only supported tracker, in to-spec (+ SPEC-FORMAT.md), to-tickets, ship (+ WORKTREES.md), land, pre-check, code-post, and setup.
This is not "github becomes mandatory config" - the zero-config ergonomics this repo's own epic just relied on are preserved: absent `docs/agents/solve.md`, skills now assume github (infer owner/name from the git remote, infer the base branch from origin's HEAD, create the `solve:*` labels lazily the first time they're actually needed) instead of assuming local markdown.
`/solve:setup` stays a real, optional skill - it loses its "pick a tracker" question but keeps everything else: git/gh version gates, upfront label creation, and its still-genuine value, writing `docs/agents/solve.md`'s Branching/Worktrees sections with the repo's actual values instead of every skill re-inferring defaults on every run.
GitHub UI scope stays what github mode already used: issues, PRs, labels, milestones - explicitly not Projects v2, already ruled out and marked moot in this repo's own CHANGELOG history under solve 0.11.2, not reopened here.

## Alternatives considered

Keep local mode as a narrower fallback, e.g. only for sharpen/vocab's file-writing steps which don't need github at all. Rejected: there's no actual local-only usage to preserve, so the narrower version still carries complexity for zero benefit.
Make `/solve:setup` mandatory before any skill can run, now that there's only one tracker to assume. Rejected: it would have blocked this exact session's already-completed epic, which ran start-to-finish with no setup file present, trading away zero-friction defaults for a safety property nobody asked for on a single-user tool.

## Consequences

The plugin now hard-depends on a GitHub remote and an authenticated `gh` CLI for any real solve workflow beyond sharpen's own local file-writing (spec/glossary/ADR files, which never needed github) - it can no longer run its tracker-dependent steps on a repo with a non-GitHub remote or no remote at all, which local mode previously allowed.
A hypothetical future installer of this public plugin without GitHub access has no fallback path. Accepted: there are zero known current users other than Diego, and this is easy to revisit later if that changes.
Code simplifies across 10 files to one path each, removing the specific class of bug the PR #4 review caught - local and github text disagreeing with each other.
This is a breaking change for the plugin's documented behavior. Per this repo's own precedent (CHANGELOG 0.12.0 shipped two "Breaking:"-tagged changes inside a 0.x minor bump, no major-version jump), it ships the same way - a minor version bump with an explicit Breaking tag in the CHANGELOG entry, not a jump to 1.0.
