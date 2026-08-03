---
name: ship
description: Take a ready ticket — or a whole epic — and carry it to done — claim, build, close the loop with a PR. Hand it one slice and it runs that slice's lifecycle; hand it the epic and it drains every slice in dependency order, unattended. It does not dictate how you code — the model, or a skill you pass in, does that — ship owns the edges.
---

# ship — take a ticket to done

The value isn't in telling you how to code — the model already does that well,
and if you have a specialized skill for it, better still. `ship` owns the
**edges**: claiming the ticket and closing the loop, so nothing is left
half-tracked. You (or a skill) own the middle; this owns the borders.

## One ticket, or the whole epic

Check what you were handed:
- **a ticket (a slice)** — run the lifecycle below once, on it.
- **an epic** — *drain* it: run the lifecycle on each slice in dependency order
  until the whole thing is shipped. This is the unattended (AFK) mode.

**Next slice to drain:** the next *startable* one — in github: open, `solve:ready`,
unassigned, every `blocked-by` closed; in local: a ticket whose "Blocked by" are
all done. Topological order, blockers first. Several startable at once → lowest
number. Run the lifecycle on it, then repeat.

How the finished slices land — one PR, several, an integration branch — follows
the repo's own convention; `ship` doesn't impose a branching or merge strategy.

## Before you start (optional)

If there's distance — time passed, or the ticket isn't fresh from your own
`to-tickets` — run `pre-check` first: it rechecks the slice still applies and its
tags/milestone are in order. Skip it when you just cut the slice and are building
now.

## Claim it

Read `.solve/config.yml`:
- **github** — self-assign so no one doubles up:
  `gh issue edit <n> --add-assignee @me`. Leave `solve:ready` where it is — it
  means "well-specified, grabbable", not "untaken": the `blocked-by` edges say
  what's startable, the assignee says who has it. The label stays on after close —
  a closed issue just drops out of the default `gh issue list`.
- **local** — no board to move; just open the ticket file.

Read the ticket + its linked spec section before touching code.

## Build it

By default you just build it. If there's a specialized skill for this kind of work — one you
pass in, one the repo standardizes, or `tdd` at an agreed seam — invoke it here.
Either way the ticket's **definition of done** is the contract: every box green
before you close, and don't gold-plate — reuse before building, write the least
code that meets the done, nothing speculative.

## Close the loop

Verify the definition of done first (typecheck, full suite, tests at the agreed
seam). Then:
- **github** — open the PR so the merge closes the issue. Keep the body short and
  in flowing prose (no hard-wrap) — reference the ticket, don't restate it. Three
  parts:
  - `Closes #<n>` — links the ticket; GitHub auto-closes it when the PR merges to
    the **base branch** (a merge into an intermediate branch won't close it yet).
  - **what shipped** — the actual change in a line or two, not a copy of the goal.
  - **verified** — definition of done met: typecheck + suite green, tests at the
    agreed seam (or "no tests — per spec").

  `gh pr create --title "<title>" --body "<the three parts above>"`. The slice's
  `blocked-by` edges release the next tickets automatically on close.
- **local** — commit referencing the ticket; the slice is done when its
  definition of done is met.

## Next step

The next ready ticket — or, when every slice is closed, the epic is shipped.
