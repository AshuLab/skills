---
name: sharpen
disallowed-tools: AskUserQuestion
description: Take a raw idea to a written brief - first reality-check that it isn't already built or already specced, then push back on it until the problem holds (the questioning itself is pushback), leaving the thinking behind as glossary entries, ADRs and a brief that to-spec consumes. The entry point of the idea->ship flow. Starts from a line of text, a conversation, or an existing artifact - a GitHub issue, a doc, a URL. For the grilling on its own, with nothing written afterwards, reach for pushback instead.
---

# sharpen - take a raw idea to a written brief

The entry point of the flow, and the step whose output is a **brief**. The questioning
itself belongs to `pushback`; what `sharpen` owns is everything around it - checking
the idea isn't already built, holding the trail as the thinking moves, and leaving
something on disk that `to-spec` can pick up.

## Starting point

**Where it comes from.** A line of text, the conversation you're already having, or
an existing artifact - a GitHub issue (`gh issue view <n>`), a local file (`Read`), a
URL (`WebFetch`). Read it in full before you ask anything.

**A GitHub issue gets claimed first** - `gh issue edit <n> --add-assignee @me` - so
nobody picks up the same one while you're still grilling it. Note that issue as the
brief's source when you write it up (see *Leave the brief*), which is what has
`to-spec` mature it into the epic instead of opening a second one.

**An artifact is raw material, not settled fact.** However it arrived - written down,
filed by someone senior, sitting there for three months - it's an opening statement:
usually a solution in disguise, often still vague. Grill it exactly as you'd grill a
line the user typed a second ago; being written earns it no authority. That's also
what separates this from `research`, which answers technical questions from primary
sources - here you aren't verifying the artifact, you're interrogating it.

## Reality check first

Before grilling, a quick look: does this already exist? Check both places it
could live -
- **the code** - a grep / search: is the feature already built, whole or in part?
- **the docs** - specs, ADRs, notes (including this flow's own `docs/specs/` and
  `docs/adr/`): is the idea already written down, decided, or specced?

Already there -> stop. Don't grill a solved problem; the real issue is
discoverability, or a gap in the existing thing (grill *that*). Not there -> grill.

A 30-second gate, not an analysis.

## Grill it, and keep the trail

Invoke `pushback`. The mechanics are all there - the tree of decisions walked outward
from the problem, the frontier, one question at a time, the facts looked up instead of
asked. Two things are `sharpen`'s to enforce on top of it.

**The root is this feature's problem.** However the idea arrived - an issue, a doc, a
line of text - the root of the tree is what actually hurts and for whom, never the
solution it came dressed as. The Direction you end up writing is whatever the pruning
left: the smallest change that resolves that problem.

**The trail is part of the job, not a bonus.** During the questioning, not after: every
clarified term -> the **glossary**; every decision that meets `vocab`'s three-part test
(hard to reverse, surprising, a real trade-off) -> an **ADR**. Don't ADR every call -
most aren't. The brief is a summary; the glossary and the ADRs are the record, so
letting this slide loses the part that outlives the session.

## When you stop

When the problem is clear, the scope has an edge, risky assumptions are named, hard
decisions are recorded - **and it's on disk**. The questions running out isn't the same
as `sharpen` being done; the brief is.

The **Open questions** you leave are only what the conversation couldn't settle - the
few that genuinely need `research` or a `prototype`. If one more question would settle
it, settle it now; a brief ending in a pile of open questions means you stopped
grilling early.

## Leave the brief

Write it - as flowing prose, one line per paragraph, not hard-wrapped to a fixed
width - to `docs/specs/<feature>.md` with `Status: sharpening` and the four
sections you own: **Problem**, **Direction**, **Out of scope**, **Open questions**
(full structure in `to-spec`'s `SPEC-FORMAT.md`). If it came from a GitHub issue,
record `Source: owner/repo#NNN` under the title so `to-spec` updates that issue
instead of creating a new one. `to-spec` completes it into a PRD from there - no
new interview.
