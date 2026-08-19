# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## solve 0.9.0

- `ship`: uncommitted work at the clean-tree gate now sorts into three cases,
  not two - a slice's own work commits in its normal flow, stray/unrelated
  work still gets stashed, and a new middle case, **epic-level design
  artifacts** (the spec/ADR/glossary/ticket output of `sharpen`/`to-spec`/
  `vocab`), goes to the **epic branch's first commit** instead of the base
  branch - so it surfaces in the integration PR's diff instead of sitting
  invisibly in every PR's base.
- `ship`: the epic branch may now already exist before the first slice ships,
  cut early by *Before you start* to carry those design artifacts - *Branching*
  just switches to it in that case instead of creating it.

## follow 0.3.0

- **`pushback` moves here from `solve`** - it no longer hard-depends on
  `solve`-only skills (`vocab`, `research`, `prototype`); it's now
  context-agnostic, usable with or without the `solve` plugin installed.
  `sharpen` (in `solve`) recommends it as an optional prior step instead of
  invoking it as a subroutine, decoupling the two plugins.
- `pushback`: **emitting a question round is now the stop itself** - don't
  answer your own questions or walk on. Skipping the `[Q]/->` format and
  self-answering are named as the same failure (treating a checkpoint as a
  thought). A blocked/denied `AskUserQuestion` still means ask in prose and
  wait, never decide alone.
- `follow/README.md`, `plugin.json`: reframed from "make something legible"
  to "work on the thinking" to fit `pushback`'s stress-testing, which isn't
  about legibility.

## solve 0.8.0

- **Breaking: `pushback` moves out to the `follow` plugin** - `/solve:pushback`
  is now `/follow:pushback` (see `follow` 0.3.0). `sharpen` recommends it as an
  optional prior step for a raw idea rather than invoking it as a subroutine,
  removing solve's hard dependency on a separate plugin.
- `guide`: rewritten around **what you already know** instead of a flat
  per-task list - problem unclear -> `sharpen`; problem clear, cause isn't ->
  `diagnose`; both clear -> `to-tickets`/`ship`. The shape diagram now groups
  skills by role (spine, feeds, support, gate, on-ramp, setup, base) instead
  of a flat pipeline.
- Formatting pass across nearly every skill: reflowed from one-sentence-per-line
  to denser paragraphs (no rendered or semantic change - markdown doesn't
  distinguish the two) plus small redundancy trims (e.g. `vocab` no longer
  states the same "domain only, not code" rule twice).
- Confirmed fixed (no regression this round): `solve-next-startable` still
  correctly referenced as `${CLAUDE_PLUGIN_ROOT}/bin/...`, not "on `PATH`".

## solve 0.7.0

- `ship`: **working tree must be clean before touching any branch** - commit or
  stash before switching, since a dirty switch fails or silently carries changes
  onto the wrong branch. Branch names get slugified (git-safe: lowercase,
  hyphens, no spaces/specials).
- `ship`: **"Close the loop" is now five explicit, ordered steps** - commit
  (matching the repo's style), push the slice branch, open the PR (repo's PR
  template if there is one), merge into the epic branch, close the issue
  (fires the retarget). Every slice now gets its own PR, not just the ones that
  earn `code-review`.
- `ship`: two new stop conditions during a drain - a slice whose definition of
  done won't pass (stop and report, don't skip or fake it), and a merge conflict
  on integration (stop and report, never auto-resolve - a wrong resolution
  silently corrupts the epic branch).
- `REFERENCE.md`: branching a slice now pushes it (`git push -u origin
  <slice-branch>`) right after creation, so it exists on the remote before a PR
  is opened against it.
- `sharpen`: "run `pushback`" now says explicitly not to summarize or shortcut
  it - invoke the skill, don't paraphrase what it would ask.
- `pre-check`, `guide`: description/pointer wording fixes (pre-check only grills
  fundamentals for an artifact that never went through `sharpen`; guide points
  from `pre-check` to `ship`).
- Fixed again: `solve-next-startable` reference in `REFERENCE.md` reverted to
  claiming it's on `PATH` - restored to `${CLAUDE_PLUGIN_ROOT}/bin/...`.

## solve 0.6.2

- `pushback`, `sharpen`: a blocked or denied `AskUserQuestion` means ask the same
  thing in prose and wait - never a cue to decide a user-owned call alone.
  `sharpen` applies this specifically to the brief: never write around a call
  that overturns the idea's framing without putting it to the user first.
- `ship`: adds a changeset/changelog step - a per-slice entry (`.changeset/` or
  similar) before merging, and a single feature-level `CHANGELOG.md` entry (not
  one per slice) once the whole epic's drain finishes, in whatever format the
  repo already uses.

## solve 0.6.1

- `REFERENCE.md`: local-mode **Branching** now generalizes branch names the same
  way github-mode already does - the repo's own `<type>` and a per-feature
  namespace (`<type>/<feature>/epic`, `<type>/<feature>/<NNN-slug>`) - instead of
  a bare "same model as github" that never said what to actually name things.

## solve 0.6.0

- **New `solve/bin/solve-next-startable`** - extracts the "find the next startable
  slice" `gh`/`jq` query (github mode) into a bundled, executable script instead of
  inline `gh` in `REFERENCE.md`. Referenced as
  `${CLAUDE_PLUGIN_ROOT}/bin/solve-next-startable`, the documented Claude Code
  convention for a plugin's own paths (an earlier draft claimed the plugin's `bin/`
  is on `PATH`, which isn't a real Claude Code mechanism - caught before commit).
- `setup`, `REFERENCE.md` (**Branching**): branch names generalize from a
  hardcoded `develop` / `solve/<feature>` example to placeholders `setup` resolves
  from the repo's own convention (`<type>/<feature>/epic`, `<type>/<feature>/<NNN-slug>`)
  - siblings under a shared namespace, since git disallows a branch `x` and a
  branch `x/y` at once.
- `to-tickets`: notes that a ticket's `Blocked by` `NNN` values are draft indexes,
  resolved to real handles only at publish time.
- Cosmetic: `->`/`[Q1]` arrows in `pushback` and `solve/README.md` switched from
  unicode `→` back to ASCII, matching the rest of the repo.

## solve 0.5.1

- `solve/README.md`: caught up with two undocumented changes - `pushback`'s
  rounds model (single question in prose vs. a numbered `[Q1]/→` round) and
  `ship`'s branching model (epic branch, stacking, merge-only, one integration
  PR at the end).

## solve 0.5.0

- **`ship` now owns a fixed branching model**, in both tracker modes. One
  **epic branch** per feature, cut lazily from the base branch on the first
  slice shipped. Each slice branches off the epic branch (**hub**, when it has
  no blocker or several) or off its one open blocker's branch (**stack**), so
  work can start before the blocker lands. Slices merge into the epic branch
  (merge commit only, never squash/rebase) and close explicitly - GitHub
  doesn't auto-close on a merge into a non-default branch - which also fires a
  **retarget**: any slice stacked on the one that just merged moves its PR base
  to the epic branch.
- When every slice is done, `ship` opens a **draft integration PR** from the
  epic branch into its destination for a human to review and merge; `ship`
  never merges it and never closes the epic itself.
- `setup`: writes the repo's real branch names/bases into `docs/agents/solve.md`
  -> **Branching** (detects the default branch and existing naming convention
  instead of assuming). `REFERENCE.md` carries the concrete `git`/`gh` commands
  for both tracker modes.

## solve 0.4.4

- `to-spec`, `to-tickets`: labels no longer inherit from the epic onto its
  slices - each slice only gets its own `solve:` tags, the epic keeps its
  labels. The milestone still carries onto every slice, and `to-tickets` now
  skips asking when the epic has none.
- `to-tickets`: explains how a slice's `Blocked by` draft index (`001`) gets
  resolved at publish time, now that slices publish in topological order - a
  real issue number (`#N`, github) or a relative file link (local), swapped in
  right before that slice is created.

## solve 0.4.3

- `pushback`: the `[Q1] <title>` / `→ <lean>` numbered format now applies only
  when a round carries several questions; a single question is asked in plain
  prose with the lean inline, no scaffolding.

## solve 0.4.2

- `pushback`: replaced "one question at a time" with an explicit **rounds** model -
  ask the whole frontier (every decision whose prerequisites are settled) in one
  round, then wait before recomputing it; early on that's usually one question,
  widening into a numbered round only when several are genuinely independent.
- `pushback`: questions now use a fixed `[Q1] <title>: ...` / `→ <lean>` format -
  same easy-to-answer structure as `AskUserQuestion`, in open prose the user can
  push back on. Also corrects a real gap: `disallowed-tools` only blocks the tool
  on the first turn and clears on the next message, so the no-`AskUserQuestion`
  rule now rests on the format itself, not on the frontmatter holding forever.
- `sharpen`, `solve/README.md`: updated to match the rounds model and the
  corrected `disallowed-tools` scope.

## follow 0.2.1

- Reframed the plugin from "text you're already looking at" to "make something
  legible rather than build it" - tighter, and it's what the four skills actually
  have in common. Updated `plugin.json` description, `follow/README.md` (intro,
  skill table, "Why they aren't the built-ins") and the root `README.md`.
- `follow/README.md`: **"Shorter or it failed"** now names `plain`, `brief` and
  `zoom-out` specifically - `recap` is judged on completeness for a cold reader,
  not brevity, so it doesn't belong under that principle.

## follow 0.2.0

- **New skill `brief`** - reads a long external doc, GitHub issue, URL or pasted
  wall of text in full, then hands back the ask underneath it: what's wanted, why,
  and how, with the padding cut and the vague parts left vague rather than
  invented. Same instinct as `plain`, pointed outward at text you're pointed at
  instead of the assistant's own last message.
- Widened the plugin's framing from "the conversation itself" to "text you're
  already looking at" to fit `brief`'s external-document scope; updated
  `plugin.json` description, `follow/README.md` (intro, skill table, principles)
  and the root `README.md` accordingly.

## follow 0.1.0

- **New plugin.** Skills that work on the conversation itself rather than the
  work: `plain` re-says the assistant's last message in plainer words, `zoom-out`
  shows the shape of the whole conversation for the person who's been deep in it,
  `recap` packages the conversation for the next agent to pick up cold (chat
  output plus a copy in the OS temp dir, secrets stripped).
- Added to the root marketplace and `README.md` alongside `solve`.

## solve 0.4.1

- `sharpen`: name the trap of a well-written source issue - its own ACs and
  subtasks read like a to-do list that's easy to mistake for grilling; interrogate
  the root before closing any of its branches. Also tightens the reality-check
  gate's scope: once past the two searches, reading code to understand *how*
  something works belongs to the grill, not the gate.
- `sharpen`, `to-spec` (`SPEC-FORMAT.md`): the **Direction** section now records
  the alternatives that lost and why, not just the chosen shape - a Direction that
  just restates the idea as it arrived is the tell that nothing got grilled.

## solve 0.4.0

- **New skill `pushback`** - the interrogation on its own, no artifact and no
  flow: relentless questioning that walks a tree of decisions outward from the
  problem, one at a time, blocking `AskUserQuestion` so a matured answer never
  gets crushed into a button.
- `sharpen`: no longer owns the grilling mechanics - delegates them to
  `pushback` and keeps the reality-check, the vocab trail and the written brief.
- `ship`: reorganized around a "Draining an epic" section at the end (lifecycle
  first, drain is the lifecycle on repeat); `code-review` called out as the
  place to reach for it before closing the loop.
- `research`, `prototype`, `tdd`, `vocab`, `diagnose`: updated to route through
  `pushback` wherever they previously assumed `sharpen` was the only source of
  questioning; `vocab` also now takes entries from `prototype` and `diagnose`.
- `solve/README.md`: added a "Getting started" quick-start section.

## solve 0.3.0

- **Breaking:** rename the `solve:ready` label to `solve:refined` - it marks a
  slice's definition as complete, not that it's unblocked/startable; those are
  separate signals (`blocked-by` edges decide startable).
- `ship`: define behavior when nothing is startable but slices remain open - stop
  and report what's blocking each, never grab a blocked or already-claimed slice.
  Also: never auto-close the epic when the drain finishes, that's a human call;
  and in local mode, a slice's done signal is now ticking every box in its
  Definition of done, not just a commit.
- `setup`: require `gh` >= 2.94.0 (issue types/sub-issues/relationships), and flag
  that GitHub Enterprise Server needs 3.19+ for `--blocked-by` specifically - below
  that it fails silently and slices publish without real blocking edges.
- `to-spec`, `pre-check`: discover the repo's actual milestones/labels via `gh`
  before offering them, instead of assuming they exist.
- `to-tickets`: read the epic's inheritable props before publishing any slice, not
  interleaved with the publish loop.
- `vocab`: glossary entries now include an `_Avoid_` line naming the synonyms a
  term replaces.

## solve 0.2.0

- **Breaking:** drop `.solve/config.yml` and `.solve/tickets/`. The tracker mode
  (local or github) is now declared in `docs/agents/solve.md`'s **Tracker**
  section, with a **Tracker operations** subsection each skill resolves its verbs
  against. Local-mode tickets move to `docs/tickets/<feature>/`.
- `setup`, `ship`, `to-spec`, `to-tickets`: updated to read/write the tracker mode
  from `docs/agents/solve.md` instead of the old config file.
- `setup/REFERENCE.md`: rewritten templates for both tracker modes, including the
  `gh` queries for tracker operations (publish, claim, close, find next slice).

## solve 0.1.1

- `ship`: `solve:ready` label persists after issue close instead of auto-clearing.
- `to-spec`: handle repos with no existing milestones (avoid single-option
  `AskUserQuestion`).
- `guide`: list `setup` and `code-review`/`tdd` in the skill map.
- `vocab`: correct ADR filename convention (kebab-case in the title, not the
  full filename).
- `to-tickets`, `tdd`: wording fixes.

## solve 0.1.0

- Initial marketplace setup: `solve` plugin with 13 skills.
