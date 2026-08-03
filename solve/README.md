# solve - skills for the app development cycle

A set of skills that take an idea from raw to shipped, through
phases with clear boundaries. It is not a bag of loose commands: it is a system
where each skill has a single responsibility and composes with the others.

The value is upstream - in thinking well. The set does not try to orchestrate the
coding itself, because the model already does that well. It gives you structure
to *think* (sharpen -> to-spec -> to-tickets) and optional discipline tools to
*execute* (tdd, code-review).

## The map

```
guide | router - tells you which skill to reach for

Setup (once per repo, optional)
  | setup - pick the tracker: local markdown (default) or a GitHub repo

Main flow | idea -> shipped
  sharpen -> to-spec -> to-tickets -> ship
    | sharpen - reality-check it doesn't already exist, then grill till it holds
    | to-spec - formalize into a PRD (file or epic issue)
    | to-tickets - vertical slices + blocking edges + a definition of done
    | ship - carry a ticket to done (claim, build, close the loop), or drain a whole epic
  -> build the middle freely, or hand it to a specialized skill; reach for
    tdd / code-review when they earn it

  | pre-check - optional gate before advancing: run it when there's distance
    (time passed, or the task isn't from sharpen) - rechecks it still applies +
    sets tags/milestone. Skip it when you just sharpened and are building now.

Cross-cutting | invoke anytime
  | vocab - domain glossary + ADRs (the shared vocabulary)
  | tdd - red -> green, seams first; optional, never mandatory
  | code-review - two axes: standards + spec

Feed the thinking | evidence for sharpen
  | research - primary sources, in the background
  | prototype - a throwaway thing (code or mockup) to settle a design question

On-ramps | you don't always start from a new idea
  | diagnose - hard bug / performance regression
```

## The main flow, in one line

You grill the idea (`sharpen`) until it survives the critique -> you formalize it
into a PRD (`to-spec`) -> you break it into vertical, agent-ready tickets
(`to-tickets`) -> you carry each ticket to done (`ship`): claim it, build the
middle freely - the model codes well, or hand it to a specialized skill - and
close the loop with a PR. Reach for `tdd` or `code-review` when they earn it.

Each boundary is a **guard**: it forces you to close the previous phase before
moving on. That is what stops you from coding a half-baked idea.

## Design principles (non-negotiable - otherwise it's a collection, not a system)

- **One responsibility per skill.** If `to-spec` starts creating tickets, the guard breaks.
- **The value is upstream.** The set structures *thinking*, not coding. There is no build orchestrator - a good ticket is the instruction, and the model takes it from there.
- **Less, on purpose.** Reuse before building, delete before adding, three lines before an abstraction. Every phase biases toward *not* writing code - `sharpen` chases the smallest fix, `code-review` asks "could this be less?" - never toward not caring: safety and correctness aren't negotiable.
- **Composition over monolith.** `sharpen` doesn't invent ADRs; it calls `vocab`. Skills compose instead of duplicating.
- **Optional by design.** `pre-check`, `tdd` and `code-review` are invoked when they earn it, never forced as pipeline steps.
- **State lives in artifacts, not in the conversation.** Glossary, ADRs, specs and tickets are files (or issues). That's why the flow survives across sessions.
- **Primary sources.** Decisions rest on official docs, source code and specs - not on memory.
- **Reality-check before sharpening.** A cheap look - at the code *and* the docs/specs - comes before the grilling; don't sharpen something already built or already written.

## Running on Claude Code

The set assumes Claude Code and uses its native tools - a deliberate coupling
(not portable to other harnesses as-is):

- **Questions, by type.** Closed, tactical choices (2-4 discrete options) use
  `AskUserQuestion`, so the person selects instead of typing "the B" - in `setup`,
  `to-spec` and `to-tickets`. **`sharpen` is the exception: it grills in prose**, one question
  at a time (and offers its own lean as a hypothesis to attack), so a matured
  answer like "I'd change the approach" isn't crushed into a button.
- **Subagents.** `research` runs as a background `Agent`; `code-review` runs its two
  axes as parallel `Agent`s so they don't contaminate each other.
- **Primary sources.** `research` reads via `WebFetch` / `WebSearch`.

## Artifacts

`setup` picks where work is published. Two modes.

**Local (default, zero setup)** - everything is markdown in the repo:

```
docs/
  agents/solve.md      <- setup: how THIS repo uses the solve skills (CLAUDE.md/AGENTS.md points here)
  glossary.md          <- vocab
  adr/NNNN-title.md    <- vocab
  specs/<feature>.md   <- sharpen (brief) -> to-spec (PRD)
  tickets/<feature>/   <- to-tickets: one markdown file per slice (local mode)
  research/<topic>.md  <- research: findings, every claim cited
```

Everything lives under `docs/`, committed and versioned - not scratch. In local
mode the tickets under `docs/tickets/` are the source of truth. The tracker mode
itself is declared in `docs/agents/solve.md` - there's no separate config file.

**GitHub** - run `setup` to pick a repo. Then:
- `to-spec` publishes the PRD as an epic issue (`solve:epic`).
- `to-tickets` publishes each slice as a sub-issue of the epic (`solve:ticket` +
  `solve:ready`), with real `blocked-by` dependencies - native GitHub Issues
  features via `gh`, no Projects v2 needed.
- `vocab` (glossary, ADRs) always stays as files - they're docs, not work items.

Either mode:
- `code-review` and `diagnose` don't persist a file - their output is feedback, not an
  artifact. A diagnosis that surfaces a design gap becomes an ADR or a ticket.
- **Agent scratch** - repro scripts, intermediate output, HTML reports, throwaway
  drafts - goes to `$TMPDIR`, never the repo. A repro script worth keeping becomes
  a regression test, not a loose file.

## Skills

| Skill       | Layer         | Invoked by              |
|-------------|---------------|-------------------------|
| setup       | infra         | you (once)              |
| vocab       | cross-cutting | sharpen / to-spec / you |
| sharpen     | main          | you                     |
| to-spec     | main          | you                     |
| to-tickets  | main          | you                     |
| ship        | main          | you                     |
| pre-check   | gate          | you                     |
| tdd         | cross-cutting | you / diagnose / ship   |
| code-review | cross-cutting | you                     |
| research    | feed          | you / sharpen           |
| prototype   | feed          | you / sharpen           |
| diagnose    | on-ramp       | you                     |
| guide       | router        | you                     |

All 13 skills drafted. The thinking chain (sharpen -> to-spec -> to-tickets) has
been dogfooded against real repos in both modes - a full local run, plus `setup`
and sharpen -> to-spec against a GitHub repo - with refinements folded back in.
Still unproven: the execution skills (ship, tdd, code-review - they only exercise
with real code), plus diagnose, prototype, pre-check and guide.
