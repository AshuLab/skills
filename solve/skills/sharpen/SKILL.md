---
name: sharpen
disallowed-tools: AskUserQuestion
description: Take a raw idea to a written brief - reality-check that it isn't already built or specced, capture the thinking as glossary entries and ADRs, and write a brief that to-spec consumes. The entry point of the idea->ship flow. Starts from a line of text, a conversation, or an existing artifact - a GitHub issue, a doc, a URL. When a raw idea needs stress-testing first, that's the optional prior step follow:pushback.
---

# sharpen - take a raw idea to a written brief

The entry point of the flow, and the step whose output is a **brief**.
The grilling itself isn't here - that's `follow:pushback`, an optional prior step the human runs when a raw idea needs stress-testing.
What `sharpen` owns is everything around it: checking the idea isn't already built, holding the trail as the thinking settles, and leaving something on disk that `to-spec` picks up.

## Starting point

**Where it comes from.**
A line of text, the conversation you're already having, or an existing artifact - a GitHub issue (`gh issue view <n>`), a local file (`Read`), a URL (`WebFetch`).
Read it in full before you write anything.

**A GitHub issue gets claimed first** - `gh issue edit <n> --add-assignee @me` - so nobody picks up the same one.
Note that issue as the brief's source when you write it up (see *Leave the brief*), which is what has `to-spec` mature it into the epic instead of opening a second one.

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
Not there -> continue.

## Grill it first if it's raw, then keep the trail

If the idea arrived raw - a fuzzy problem, or a solution in disguise - the sharpest move is to stress-test it before writing anything: `follow:pushback`, on its own.
It's the human's call, not a step `sharpen` forces - recommend it when it earns it, and take whatever the grilling settled as your material.
`sharpen` doesn't re-run the questioning; it turns a settled conversation into artifacts.
Two things are `sharpen`'s throughout:

**The root is this feature's problem.**
However the idea arrived - an issue, a doc, a line of text - the root is what actually hurts and for whom, never the solution it came dressed as.
The Direction you write is whatever the pruning left: the smallest change that resolves that problem.

**The trail is part of the job, not a bonus.**
As the thinking settles: every clarified term -> the **glossary**, every decision that meets `vocab`'s three-part test (hard to reverse, surprising, a real trade-off) -> an **ADR**.
Don't ADR every call - most aren't.
The brief is a summary; the glossary and the ADRs are the record, so letting this slide loses the part that outlives the session.

## When you stop

When the problem is clear, the scope has an edge, risky assumptions are named, hard decisions are recorded - **and it's on disk**.
The questions running out isn't the same as `sharpen` being done; the brief is.

Never settle a call that's the user's by writing the brief around it.
If your read overturns the framing they arrived with, put it to them in prose and wait - a blocked `AskUserQuestion` is a cue to ask in prose, not a reason to decide alone.

The **Open questions** you leave are only what the conversation couldn't settle - the few that genuinely need `research` or a `prototype`.
If one more question would settle it, settle it now; a brief ending in a pile of open questions means the grilling stopped early.

## Leave the brief

Write it - as flowing prose, one line per paragraph, not hard-wrapped to a fixed width - to `docs/specs/<feature>.md` with `Status: sharpening` and the four sections you own: **Problem**, **Direction**, **Out of scope**, **Open questions** (full structure in `to-spec`'s `SPEC-FORMAT.md`).
If it came from a GitHub issue, record `Source: owner/repo#NNN` under the title so `to-spec` updates that issue instead of creating a new one.
`to-spec` completes it into a PRD from there - no new interview.

**Direction** is where the grilling shows or doesn't: it carries what the pruning left *and what it cut* - the alternatives that were on the table and why they lost.
A Direction that restates the one the idea arrived with is the tell that nothing got grilled.
