---
name: sharpen
description: Take a raw idea to a written brief - reality-check that it isn't already built or specced, capture the thinking as glossary entries and ADRs, and write a brief that to-spec consumes. The entry point of the idea->shipped flow. Starts from a line of text, a conversation, or an existing artifact - a GitHub issue, a doc, a URL. A raw idea gets stress-tested first by follow:pushback, which sharpen invokes before it writes anything.
---

# sharpen - take a raw idea to a written brief

The entry point of the flow, and the step whose output is a **brief**.
The grilling is `follow:pushback`'s - a separate skill with its own frontier-walk logic. `sharpen` **invokes it** when the idea is raw, then builds the brief from what survived; it doesn't reimplement the questioning.
What `sharpen` owns is everything around that: checking the idea isn't already built, holding the trail as the thinking settles, and leaving something on disk that `to-spec` picks up.

## Starting point

**Where it comes from.**
A line of text, the conversation you're already having, or an existing artifact - a GitHub issue (`gh issue view <n>`), a local file, or a URL fetched with the harness's web access.
Read it in full before you write anything.

**An artifact is raw material, not settled fact.**
However it arrived - written down, filed by someone senior, sitting there for three months - it's an opening statement: usually a solution in disguise, often still vague.
The better it's written, the sharper the trap: a filled-out issue hands you a to-do list - ACs, subtasks, its own open questions - and working that list feels like progress while being the fullest surrender to its framing.
Those questions are branches; ask whether the root holds before you close any of them.

## Reality check first

A 30-second gate, not an analysis: does this already exist?
Two searches, one answer -
- **the code** - a grep / search: is the feature already built, whole or in part?
- **the docs** - specs, ADRs, notes (including this flow's own `docs/specs/` and `docs/adr/`): is the idea already written down, decided, or specced?

Already there -> stop.
Don't sharpen a solved problem; the real issue is discoverability, or a gap in the existing thing (sharpen *that*).
Not there -> continue, and if it's a GitHub issue, **claim it now** - `gh issue edit <n> --add-assignee @me` - so nobody picks up the same one. Note that issue as the brief's source when you write it up (see *Leave the brief*), which is what has `to-spec` mature it into the epic instead of opening a second one.

## Grill it first if it's raw, then keep the trail

**If the idea arrived raw - a fuzzy problem, or a solution in disguise - grill it before writing anything**, and don't write a brief off an ungrilled idea: a thin brief is worse than none, `to-spec` inherits every gap it leaves.

- **`follow:pushback` is available** -> invoke it. Hand it the idea and whatever context you have, let it work the frontier to empty, and take what survives as your material. This is the path - `sharpen` doesn't reimplement the questioning.
- **It isn't** (no `follow` plugin, standalone Codex skill missing) -> do the walk inline: the root first - what actually hurts, for whom, how you'd know it's fixed - then the frontier one round at a time, each question in prose with your lean, pruning before expanding. Stop when nothing answerable is left, not when it has been enough turns.

The only skip: the idea already came through a grilling - a `follow:pushback` run, or a back-and-forth in this session that genuinely settled the root, the scope and the risky assumptions. A well-written issue is **not** that (*An artifact is raw material*, above) - grill it.

Two things are `sharpen`'s throughout:

**The root is this feature's problem.**
However the idea arrived - an issue, a doc, a line of text - the root is what actually hurts and for whom, never the solution it came dressed as.
The Direction you write is whatever the pruning left: the smallest change that resolves that problem.

**The trail is part of the job, not a bonus.**
As the thinking settles: every clarified term -> the **glossary** at `docs/glossary.md`, every decision that meets `vocab`'s three-part test (hard to reverse, surprising, a real trade-off) -> an **ADR** at `docs/adr/NNNN-title.md`.
Don't ADR every call - most aren't.
Both formats are `vocab`'s, not this skill's - the entry shape, the `_Avoid_` line, the ADR's four sections - so open it rather than improvising them; a trail written to invented paths in an invented shape is one nobody finds later.
The brief is a summary; the glossary and the ADRs are the record, so letting this slide loses the part that outlives the session.

## When you stop

When the problem is clear, the scope has an edge, risky assumptions are named, hard decisions are recorded - **and it's on disk**.
The questions running out isn't the same as `sharpen` being done; the brief is.

Never settle a call that's the user's by writing the brief around it.
If your read overturns the framing they arrived with, put it to them in prose and wait. Never turn the lack of a choice UI into permission to decide alone.

The **Open questions** you leave are only what the conversation couldn't settle - the few that genuinely need `research` or a `prototype`.
If one more question would settle it, settle it now; a brief ending in a pile of open questions means the grilling stopped early.

**A call that's the user's is not an open question** - it's *Never settle a call that's the user's*, two paragraphs up, and it's the one misfile that costs the most. Open questions are for what nobody knows yet and investigation would answer; a product call is something they know and you don't, so parking it in the list looks like diligence while deferring the ask. `to-spec` hands it straight back, because it sorts them before answering - so the misfile buys a round trip, not an answer. Ask it now instead, in prose, and wait.

## Leave the brief

Write it - as flowing prose, one line per paragraph, not hard-wrapped to a fixed width - to `docs/specs/<feature>.md` with `Status: sharpening` and the four sections you own: **Problem**, **Direction**, **Out of scope**, **Open questions** (full structure in `to-spec`'s `SPEC-FORMAT.md`).
If it came from a GitHub issue, record `Source: owner/repo#NNN` under the title so `to-spec` updates that issue instead of creating a new one.

**Direction** is where the grilling shows or doesn't: it carries what the pruning left *and what it cut* - the alternatives that were on the table and why they lost.
A Direction that restates the one the idea arrived with is the tell that nothing got grilled.

## Next step

`to-spec` - turn the brief into a PRD; no new interview, just synthesis.
