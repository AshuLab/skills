---
name: sharpen
description: Interrogate an idea, plan or design until it holds up — ruthlessly, one question at a time — leaving a paper trail (glossary and ADRs via vocab). First reality-checks that it doesn't already exist — in the code or the docs — then grills. The starting point can be a line of text, a conversation, or an existing artifact (a GitHub issue, a doc, a URL). It is the entry point of the idea→ship flow.
---

# sharpen — grill the idea until it holds up

The first step of the flow. Beyond asking questions, its job is to leave a trail
via `vocab` — glossary and ADRs — so the thinking outlives the session.

## Starting point

The idea can be a line of text, the conversation you're in, or an existing
artifact — a GitHub issue (`gh issue view <n>`), a local file (`Read`), or a URL
(`WebFetch`). If it's a GitHub issue, **claim it** so no one else starts the same one:
`gh issue edit <n> --add-assignee @me`. Read it, then **grill it**: an artifact is
raw material, usually a solution in disguise or still vague — never settled. (This isn't the `research` skill — that answers technical
questions from primary sources. Here the artifact is just the opening statement,
not settled fact.)

## Reality check first

Before grilling, a quick look: does this already exist? Check both places it
could live —
- **the code** — a grep / search: is the feature already built, whole or in part?
- **the docs** — specs, ADRs, notes (including this flow's own `docs/specs/` and
  `docs/adr/`): is the idea already written down, decided, or specced?

Already there → stop. Don't grill a solved problem; the real issue is
discoverability, or a gap in the existing thing (grill *that*). Not there → grill.

A 30-second gate, not an analysis.

## How to grill

- **One question at a time**, each coming out of the last answer — a thread, not a
  form. A good answer can bend the thread: it may reshape the next question or make
  the ones you had queued irrelevant. Follow the new direction, don't run a script.
- **Watch for contradictions.** As the grilling moves, a new answer can clash with
  an earlier one — surface it ("earlier you said X, now Y — which holds?") and
  reconcile it before it reaches the brief. The contradiction is signal: the
  thinking shifted, or the problem was never clear.
- **Chase the real problem, not the proposed solution.** People bring a solution in
  disguise; separate them: what actually hurts? for whom? how do we know?
- **Aim at the cheapest thing that solves it.** Once the real problem is clear, the
  Direction points at the smallest change that resolves it — doing nothing, or reusing what
  the repo already has, before anything new gets built.
- **Look facts up, don't ask them.** If it lives in the filesystem or tools, go find
  it; only *decisions* are the user's — put those to them and wait.
- **Don't accept vague answers** — pin the fuzzy term down (→ glossary). When a
  boundary is fuzzy, probe with a **concrete scenario**: invent an edge case that
  forces precision about where the concept starts and ends.
- **No `AskUserQuestion` in the grill** — a closed button can't hold "I'd change
  the approach" or "I don't follow". Every question in prose. (It's for the
  tactical, closed calls in `setup`/`to-spec`/`to-tickets`, not here.)
- **Say where you lean, and why.** On a design call, offer your read as a
  hypothesis to attack ("I'd derive 'liquidated' from `receipt_id` rather than a
  separate `status` field — what breaks that?"), not a verdict to nod at — honest
  and faster, as long as it opens the question rather than closing it. On
  problem/domain questions you just ask and listen; the lean is for design calls.

Worth asking: what if we do nothing? the smallest case that still delivers value?
what assumption, if false, sinks it? the obvious alternative, and why not? what's
hardest to reverse (ADR candidate)?

## Leave a trail with vocab

During the grilling, not after: every clarified term → the **glossary**; every
decision that meets `vocab`'s three-part test (hard to reverse, surprising,
a real trade-off) → an **ADR**. Don't ADR every call — most aren't.

## When you stop

When the problem is clear, the scope has an edge, risky assumptions are named and
hard decisions recorded — not when "we've talked enough". If a design question
can't be settled on paper, that's a `prototype`, not more talk.

The **Open questions** you leave should be only what couldn't be settled on
paper — the few that genuinely need `research` or a `prototype`. If one more question would settle it, settle it
now; a brief that ends in a pile of open questions means you stopped grilling
early.

## Leave the brief

Write it — as flowing prose, one line per paragraph, not hard-wrapped to a fixed
width — to `docs/specs/<feature>.md` with `Status: sharpening` and the four
sections you own: **Problem**, **Direction**, **Out of scope**, **Open questions**
(full structure in `to-spec`'s `SPEC-FORMAT.md`). If it came from a GitHub issue,
record `Source: owner/repo#NNN` under the title so `to-spec` updates that issue
instead of creating a new one. `to-spec` completes it into a PRD from there — no
new interview.
