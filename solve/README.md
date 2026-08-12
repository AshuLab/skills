# solve - skills for the app development cycle

A set of skills that take an idea from raw to shipped, through phases with clear boundaries.
It is not a bag of loose commands: it is a system where each skill has a single responsibility and composes with the others.

The value is upstream - in thinking well.
The set does not try to orchestrate the coding itself, because the model already does that well.
It gives you structure to *think* (sharpen -> to-spec -> to-tickets) and optional discipline tools to *execute* (tdd, code-review).

## Getting started

```
/plugin marketplace add AshuLab/skills
/plugin install solve@ashulab
```

Restart the session so the skills load, then:

1. **`/solve:setup`** - only if you want a GitHub tracker. Skip it and everything stays as markdown under `docs/`, no config, nothing to maintain.
2. **`/solve:sharpen <your idea>`** - it checks the thing isn't already built, captures the thinking as it settles, and leaves a brief at `docs/specs/<feature>.md` (grill it first with `/follow:pushback` if it's raw).
3. **`/solve:to-spec`** - turns that brief into a PRD, deciding where each story gets tested. In GitHub mode this is what publishes the epic issue.
4. **`/solve:to-tickets`** - cuts the PRD into vertical slices, each with a definition of done and its blocking edges.
5. **`/solve:ship <ticket>`** - claims it, builds it, closes the loop. Hand it the **epic** instead and it drains every slice in dependency order, unattended.

Not sure which step you're on?
**`/solve:guide`**.
Just want to be grilled about something, with nothing written down afterwards?
**`/follow:pushback`**.

## The map

```
guide | router - tells you which skill to reach for

Setup (once per repo, optional)
  | setup - pick the tracker: local markdown (default) or a GitHub repo

Main flow | idea -> shipped
  sharpen -> to-spec -> to-tickets -> ship
    | sharpen - reality-check it doesn't already exist, capture the trail, leave a brief
      (grill it first with `follow:pushback` if it's raw)
    | to-spec - formalize into a PRD, a product requirements document (file or epic
      issue) - no new interview; its real call is where each story gets tested
    | to-tickets - vertical slices + blocking edges + a definition of done
    | ship - carry a ticket to done (claim, build, close the loop), or drain a whole epic
  -> build the middle freely, or hand it to a specialized skill; reach for
    tdd / code-review when they earn it

  | pre-check - optional gate before advancing: run it when there's distance
    (time passed, or the task isn't from sharpen) - rechecks it still applies +
    sets tags/milestone. Skip it when you just sharpened and are building now.

Cross-cutting | invoke anytime
  | vocab - domain glossary + architecture decision records (ADRs)
  | tdd - red -> green, seams first; optional, never mandatory
  | code-review - two axes: standards + spec

Feed the thinking | evidence for sharpen
  | research - primary sources, in the background
  | prototype - a throwaway thing (code or mockup) to settle a design question

On-ramps | you don't always start from a new idea
  | diagnose - hard bug / performance regression
```

## The main flow, in one line

You take the idea to a brief that holds up (`sharpen` - grilling it first with `follow:pushback` if it's raw) -> you formalize it into a PRD and pin down where each story gets tested (`to-spec`, which never re-interviews you) -> you break it into vertical, agent-ready tickets (`to-tickets`) -> you carry each ticket to done (`ship`): claim it, build the middle freely - the model codes well, or hand it to a specialized skill - and close the loop with a PR.
Reach for `tdd` or `code-review` when they earn it.

Each boundary is a **guard**: it forces you to close the previous phase before moving on.
That is what stops you from coding a half-baked idea.

The `sharpen` / `to-spec` boundary is the one that earns its keep twice over.
`to-spec` is forbidden from interviewing you - so if a question comes up while it writes, the hole is in the brief and it shows instead of getting patched over mid-draft.
And it's the last stop before the work becomes **visible to other people**: `to-spec` is what publishes the epic issue, so the brief gets a human read before anything lands in your team's repo.
One skill doing both would have created that issue on the way out of sharpening.

## Design principles (non-negotiable - otherwise it's a collection, not a system)

- **One responsibility per skill.** If `to-spec` starts creating tickets, the guard breaks.
- **The value is upstream.** The set structures *thinking*, not coding. There is no build orchestrator - a good ticket is the instruction, and the model takes it from there.
- **Less, on purpose.** Reuse before building, delete before adding, three lines before an abstraction. Every phase biases toward *not* writing code - `sharpen` chases the smallest fix, `code-review` asks "could this be less?" - never toward not caring: safety and correctness aren't negotiable.
- **Composition over monolith.** `sharpen` doesn't invent ADRs; it calls `vocab`. It doesn't own the grill either - that's `follow:pushback`, an optional prior step; `sharpen` frames whatever it settled with the reality-check, the trail and the brief. Skills compose instead of duplicating.
- **Optional by design.** `pre-check`, `tdd` and `code-review` are invoked when they earn it, never forced as pipeline steps.
- **State lives in artifacts, not in the conversation.** Glossary, ADRs, specs and tickets are files (or issues). That's why the flow survives across sessions.
- **Primary sources.** Decisions rest on official docs, source code and specs - not on memory.
- **Reality-check before sharpening.** A cheap look - at the code *and* the docs/specs - comes first; don't sharpen something already built or already written.

## Running on Claude Code

The set assumes Claude Code and uses its native tools - a deliberate coupling (not portable to other harnesses as-is):

- **Questions, by type.** Closed, tactical choices (2-4 discrete options) use `AskUserQuestion`, so the person selects instead of typing "the B" - in `setup`, `to-spec` and `to-tickets`. `sharpen` is the exception: when its read overturns your framing it asks in prose, not a button, so a matured "I'd change the approach" isn't crushed into a closed list. (The open-ended grilling proper is `follow:pushback`.)
- **Subagents.** `research` runs as a background `Agent`; `code-review` runs its two axes as parallel `Agent`s so they don't contaminate each other.
- **Primary sources.** `research` reads via `WebFetch` / `WebSearch`.

## Artifacts

`setup` picks where work is published.
Two modes.

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

Everything lives under `docs/`, committed and versioned - not scratch.
In local mode the tickets under `docs/tickets/` are the source of truth.
The tracker mode itself is declared in `docs/agents/solve.md` - there's no separate config file.

**GitHub** - run `setup` to pick a repo.
Then:
- `to-spec` publishes the PRD as an epic issue (`solve:epic`).
- `to-tickets` publishes each slice as a sub-issue of the epic (`solve:ticket` + `solve:refined`), with real `blocked-by` dependencies - native GitHub Issues features via `gh`, no Projects v2 needed.
- `ship` integrates each slice into the feature's **epic branch** - off that branch, or off its blocker when it has one (a stack) - **merge-only** (never squash or rebase). Each slice gets its own PR with `Closes #<n>`; once every slice is done, one integration PR (epic -> destination) with `Closes #<epic>` for a human to review. Bases and names follow the repo's convention, captured by `setup`.
- `vocab` (glossary, ADRs) always stays as files - they're docs, not work items.

Either mode:
- `code-review` and `diagnose` don't persist a file - their output is thinking or feedback, not an artifact. A diagnosis that surfaces a design gap becomes an ADR or a ticket via `vocab`.
- **Agent scratch** - repro scripts, intermediate output, HTML reports, throwaway drafts - goes to `$TMPDIR`, never the repo. A repro script worth keeping becomes a regression test, not a loose file.

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

All 13 skills drafted (the grill, `pushback`, moved out to the `follow` set).
The thinking chain (sharpen -> to-spec -> to-tickets) was dogfooded against real repos in both modes - a full local run, plus `setup` and sharpen -> to-spec against a GitHub repo - with the refinements folded back in.
One caveat on that: `sharpen` has been restructured since, with the grilling moved out to `follow:pushback`, so it's newer than the run that validated it.
Still unproven: the execution skills (ship, tdd, code-review - they only exercise with real code), plus diagnose, prototype, pre-check and guide.
