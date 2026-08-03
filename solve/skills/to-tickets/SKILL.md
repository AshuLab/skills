---
name: to-tickets
description: Break a spec (or a plan) into vertical, agent-ready slices - small tickets an agent can pick up one at a time, each with a definition of done. Use it once you have a spec and want to split the work. Writes local markdown files, or GitHub sub-issues with real dependencies when the tracker is GitHub.
---

# to-tickets - break a spec into vertical, agent-ready slices

Turn a PRD into small tickets an agent can pick up one at a time. Draft first,
quiz on granularity and blocking, then publish.

## What a slice is (fixed)

The smallest cut that still ships - **minimal but functional**:

- **Vertical** - cuts through every layer it touches (schema -> logic -> UI -> test),
  never one horizontal layer.
- **Demoable on its own** - shipping it alone leaves the app working and shows
  something. Keep splitting until it's the smallest cut that *still holds this*; if
  a smaller split would leave the system broken, you went one too far.
- **Agent-ready** - one agent finishes it in a sitting without coming back to ask:
  no open design decisions (those were settled in the spec), a bounded seam (not
  "touch 15 files"), a verifiable definition of done.

The test: **could an agent pick this up and finish it without asking you
anything?** If not, it's too big or under-specified - split it, or send it back to
`to-spec`.

One trap the test misses: a slice can look vertical and demoable yet quietly rest
on new infrastructure - a first external process, a protocol client, a heavy new
dependency. That scaffolding is a sub-project hiding inside the slice; pull it out
as its own enabling-chore first, or the "finishes it in a sitting" promise breaks.

Wide refactors are the exception: sequence them expand-contract - add the new
path, migrate callers onto it, then remove the old, so the build never breaks
mid-refactor. Spikes and
enabling chores are the other exception - a spike answers an open question, a
chore unblocks later slices; neither demos on its own, and that's fine. Give each a
verifiable done (findings recorded, the enablement in place) and keep them rare.

## Ticket format (fixed)

```markdown
# NNN - <title>

## Goal
One sentence: what this slice delivers.

## Context
Links to the spec section + relevant ADRs / glossary terms - reference, don't restate.

## Definition of done
- [ ] <observable outcome the slice must show>
- [ ] typecheck passes
- [ ] full test suite passes
- [ ] tests at the agreed seam (or: no tests - per spec)

## Blocked by
NNN, NNN  (or: nothing)
```

The definition of done is where the execution discipline lives - keep it
observable, not a to-do list.

Write the ticket's prose as flowing lines - one line per paragraph, not
hard-wrapped to a fixed width.

Write the ticket **behavioral, not procedural**: name the contracts (types,
signatures, config shapes) and the observable outcome, never file paths or line
numbers - a ticket pinned to "line 42 of x.ts" is dead on arrival; one pinned to
a contract survives the code moving under it.

A contract is often clearest **as code**: when a type shape, schema, signature or
state machine encodes the decision better than prose, inline that snippet -
trimmed to the decision, not a working demo. That's still the *what* (the
contract, durable), not the *how* (implementation the agent writes itself). It's
what a from-scratch, unattended agent leans on hardest - but if the spec already carries
the contract, reference it; inline only what this slice adds.

## Before publishing

Draft the slice list and show it - granularity and blocking edges laid out - then
adjust from the reply; never publish off a first guess. Only reach for
`AskUserQuestion` when you're genuinely torn between two concrete cuts (e.g. 3
slices vs 5), each a real option - a lone "looks good?" isn't a question the tool
accepts.

## Publish the slices

Publish each slice as a ticket, in **topological order** (blocker before blocked).
The concrete operation is in `docs/agents/solve.md` -> **Tracker operations**
(*publish a slice*); run it per slice for the repo's tracker. In local that's one
file per slice at `docs/tickets/<feature>/NNN-slug.md` with a textual `Blocked by`
line.

In github, first read the epic's inheritable props once
(`gh issue view <epic> --json milestone,labels`) and carry them onto every slice -
the epic's milestone and its non-`solve:` labels - so each slice inherits the
feature's properties. Throttle the loop: creating issues too fast trips rate
limiting.

## Next step

`ship` - take each ready ticket to done: claim it, build it, close the loop.
