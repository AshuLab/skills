---
name: to-tickets
description: Break a spec (or a plan) into vertical, agent-ready slices - small tickets an agent can pick up one at a time, each with a definition of done. Use it once you have a spec and want to split the work. Writes local markdown files, or GitHub sub-issues with real dependencies when the tracker is GitHub.
---

# to-tickets - break a spec into vertical, agent-ready slices

Draft first, quiz on granularity and blocking, then publish.

## What a slice is (fixed)

The smallest cut that still ships - **minimal but functional**:

- **Vertical** - cuts through every layer it touches (schema -> logic -> UI -> test), never one horizontal layer.
- **Demoable on its own** - shipping it alone leaves the app working and shows something. Keep splitting until it's the smallest cut that *still holds this*; if a smaller split would leave the system broken, you went one too far.
- **Agent-ready** - one agent finishes it in a sitting without coming back to ask: no open design decisions (those were settled in the spec), a bounded seam (not "touch 15 files"), a verifiable definition of done.

The test: **could an agent pick this up and finish it without asking you anything?**
If not, it's too big or under-specified - split it, or send it back to `to-spec`.

One trap the test misses: a slice can look vertical and demoable yet quietly rest on new infrastructure - a first external process, a protocol client, a heavy new dependency.
That scaffolding is a sub-project hiding inside the slice; pull it out as its own enabling-chore first, or the "finishes it in a sitting" promise breaks.

Wide refactors are the exception: sequence them expand-contract - add the new path, migrate callers onto it, then remove the old, so the build never breaks mid-refactor.
Spikes and enabling chores are the other exception - a spike answers an open question, a chore unblocks later slices; neither demos on its own, and that's fine.
Give each a verifiable done (findings recorded, the enablement in place) and keep them rare.

## Ticket format (fixed)

```markdown
# NNN - <title>

## Goal
One sentence: what this slice delivers.

## Context
Links to the spec section + relevant ADRs / glossary terms - reference, don't restate.

## Definition of done
- [ ] <observable outcome the slice must show>
- [ ] the repo's static checks pass (omit this box entirely if it has none)
- [ ] full test suite passes
- [ ] tests at the agreed seam (or: no tests - per spec)

## Blocked by
NNN, NNN  (or: nothing)
```

The `NNN` in **Blocked by** are draft indexes; at publish they resolve to each blocker's real handle - `#<issue>` in github (auto-linked), a relative file link in local (see *Publish the slices*).

The definition of done is where the execution discipline lives - keep it observable, not a to-do list.
**Every box has to be tickable by someone who didn't write it.** The test is yours while drafting, not a field in the ticket: for each box name to yourself the command that proves it or the thing you'd look at, and if you can't name one, the box is prose and doesn't belong.
Two shapes pass that test at a glance and fail it in the hand, and they don't have the same fix.
A box pinned to a state the code can't reach - rows from before this change, in a store that resets on restart - has nothing to run against, so the agent either invents a way or ticks it on faith. Rewrite it around a state that exists, or drop it; there's nothing upstream to send.
A box smuggling an unmade decision is worse, because it reads as settled: "the new path stays compatible with the old" names no behaviour, so two agents build opposite things and both tick it honestly, and the disagreement surfaces after the merge. That one isn't a wording problem - the decision belongs in the spec, and the box waits for it.

Write the ticket's prose as flowing lines - one line per paragraph, not hard-wrapped to a fixed width.

Write the ticket **behavioral, not procedural**: name the contracts (types, signatures, config shapes) and the observable outcome, never file paths or line numbers - a ticket pinned to "line 42 of x.ts" is dead on arrival; one pinned to a contract survives the code moving under it.

A contract is often clearest **as code**: when a type shape, schema, signature or state machine encodes the decision better than prose, inline that snippet - trimmed to the decision, not a working demo.
That's still the *what* (the contract, durable), not the *how* (implementation the agent writes itself).
It's what a from-scratch, unattended agent leans on hardest - but if the spec already carries the contract, reference it; inline only what this slice adds.

**A snippet reads as authoritative, so trimming it is where it turns into a lie.** Prose that's roughly right gets checked against the code; the same claim as an expression gets implemented verbatim. Before you inline one, run it against the cases the slice will actually see, especially the wrong-typed and empty ones - an expression that's right for the happy path and silently wrong for everything else is worse than the sentence it replaced. Then read it against the definition of done: if the two say different things about the same input, the agent has to pick, and it may not pick the way you'd have. Reconcile them before you publish - correct the snippet where the slice owns the call, and send it back to the spec where it doesn't.

## Before publishing

Draft the slice list and show it - granularity and blocking edges laid out - then adjust from the reply; never publish off a first guess.
Only use a closed-choice UI when you're genuinely torn between two concrete cuts (e.g. 3 slices vs 5), each a real option; otherwise show the draft in prose and wait.

## Publish the slices

In github, read the epic's milestone **before creating anything** (`gh issue view <epic> --json milestone`), if it has one, and carry it onto every slice in the batch.
Labels don't inherit - each slice gets only its own `solve:` labels (below).
No milestone on the epic -> nothing to carry, nothing to ask.

Then publish each slice as a ticket, in **topological order** (blocker before blocked) - which is what makes the cross-references resolvable: a slice's blockers already exist by the time it's created, so before creating it, swap each draft index (`001`) in the body for the blocker's real handle.
In github that's `#<real issue number>`, which GitHub auto-links, alongside the native `--blocked-by` edge; in local, a relative link to the blocker's file, in the form below.
The concrete operation is in `docs/agents/solve.md` -> **Tracker operations** (*publish a slice*); run it per slice for the repo's tracker.
**No such file** means the repo never ran `setup`: that's local mode, and the operation is the one below. Say so once and carry on - don't stop, and don't write a config file.
In local that's one file per slice at `docs/tickets/<feature>/NNN-slug.md`, its `## Blocked by` line linking each blocker's file relatively (`[001](./001-slug.md)`), or the word `nothing`.
That link format is a contract, not a rendering choice - `ship` resolves it to find each blocker and read whether its boxes are ticked, and a blocker it can't resolve is one it can't check, so the slice reads as blocked and the drain halts on a dependency that may well have landed.
Throttle the github loop - creating issues too fast trips rate limiting.

Every slice gets `solve:ticket` + `solve:refined` at publish - **blocked or not**.
`refined` means the definition is complete, not that the slice is unblocked; blocking lives in the `blocked-by` edges, a separate signal.

## Next step

`ship` - take each startable ticket to done: claim it, build it, close the loop.
