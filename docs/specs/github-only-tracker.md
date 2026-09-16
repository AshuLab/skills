# github-only-tracker

Status: spec

## Problem

The `solve` skill set (sharpen, to-spec, to-tickets, ship, land, pre-check, code-post, setup) has always supported two tracker modes - local markdown under `docs/`, and GitHub Issues opt-in via `/solve:setup`. Local-mode branching logic touches 10 files, 13 mentions in `ship/SKILL.md` alone.
Diego, currently the plugin's sole user, confirmed local mode has never added value since it was introduced - he doesn't use it, and this very repo has been running solve in local mode this whole session purely by default (no `docs/agents/solve.md` ever existed here), not by choice.
The parallel local/github logic paths are also a real, evidenced maintenance cost: the `code-resolve` pass on PR #4 (the ship-parallel-slices epic, same repo) found multiple real bugs that were specifically local-mode text disagreeing with what actually shipped for github mode.

## Solution

Remove local tracker mode entirely across the solve skill set - github becomes the only supported tracker, in setup, to-spec (+ SPEC-FORMAT.md), to-tickets, ship (+ WORKTREES.md), land, pre-check, and code-post. `sharpen` and `vocab` are unaffected - neither branches on tracker mode today; both only ever write local files (`docs/specs/`, `docs/glossary.md`, `docs/adr/`), tracker-independent.
This is not "github becomes mandatory config": absent `docs/agents/solve.md`, skills now assume github by default instead of local markdown - infer the repo's owner/name from the git remote, infer the base branch from origin's HEAD, create the `solve:*` labels lazily the first time they're actually needed. This preserves the zero-config ergonomics this repo's own already-completed epic just relied on.
`/solve:setup` stays a real, optional skill. It loses its "pick a tracker" question (today's step 2), but keeps everything else: git/gh version gates, upfront label creation, and its still-genuine value - writing `docs/agents/solve.md`'s Branching/Worktrees sections with the repo's actual values instead of every skill re-inferring defaults fresh on every run.
GitHub UI scope stays what github mode already used: issues, PRs, labels, milestones - explicitly not Projects v2, already ruled out and marked moot in this repo's own CHANGELOG under solve 0.11.2, not reopened here.
The worktree on/off axis is orthogonal to tracker mode and is untouched by this change.
Full reasoning and the alternatives weighed are in [0002-github-becomes-solves-only-tracker-mode.md](../adr/0002-github-becomes-solves-only-tracker-mode.md).

## Scope

1. `setup` drops its "pick a tracker" question; the zero-config default (no `docs/agents/solve.md`) flips from local markdown to inferred github (remote owner/name, base branch from origin's HEAD, labels created lazily on first real need) instead of requiring `/solve:setup` to run first.
2. `to-spec` (+ SPEC-FORMAT.md) always publishes the PRD as the github epic issue - the local-file-as-final-spec path is removed.
3. `to-tickets` always publishes slices as GitHub sub-issues with real `--blocked-by` dependency edges - the local ticket-file format and its relative-link `Blocked by` convention are removed.
4. `ship` (+ WORKTREES.md) drops every local-mode branch - claiming, the next-startable-slice query, drain-completion checks, `Blocked by` resolution - github is the only path through claim/build/close-the-loop/draining.
5. `land` always merges the integration PR and closes the epic issue - the local-mode "merge the epic branch directly, no PR" path is removed.
6. `pre-check` and `code-post` drop their local-mode branches (label/milestone checks, ticket-file-vs-issue handling) - github is the only path.

## Decisions

Design and alternatives: [0002-github-becomes-solves-only-tracker-mode.md](../adr/0002-github-becomes-solves-only-tracker-mode.md).

**Versioning** - ship as a minor version bump with an explicit "Breaking:" tag in the CHANGELOG entry, not a jump to 1.0 - matches this repo's own precedent (CHANGELOG 0.12.0 shipped two Breaking-tagged changes inside a 0.x minor bump).

**Testing seams (stories 1-6)** - no tests, same as the ship-parallel-slices epic: this repo has no eval or test harness for skill behavior. Verification is a manual dry run per story against this repo itself (a real github-mode repo, `gh` already authenticated): story 1 by deleting/confirming the absence of `docs/agents/solve.md` and running any solve skill, confirming it infers github instead of falling back to local; story 2 by running `to-spec` on a brief and confirming it creates/updates a github epic issue, never a local-file-as-final-spec; story 3 by running `to-tickets` and confirming github sub-issues with `--blocked-by` edges, never local ticket files; story 4 by running `ship` end-to-end on a real github ticket, then a small multi-slice epic drain, confirming no local-mode branch is ever taken; story 5 by running `land` on a ready integration PR and confirming it merges the PR and closes the epic issue; story 6 by running `pre-check` and `code-post` against a real github ticket/PR and confirming only github-mode behavior surfaces.

## Out of scope

GitHub Projects v2 support - already a past decision, stays out.
Cross-git-host support (GitLab, Bitbucket, no forge at all) - never a stated goal; this plugin's "provider-neutral" positioning refers to AI agent/model providers (Claude Code, Codex, others), not git hosting providers.
Any change to the worktree on/off axis.
Migration guidance for existing external installers of this public plugin - none are known to exist; a CHANGELOG "Breaking:" entry is enough, matching this repo's own precedent for past breaking changes shipped inside a 0.x minor bump (CHANGELOG 0.12.0), not a jump to 1.0.
