# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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
