---
name: diagnose
description: Systematically diagnose a hard bug or a performance regression - a flaky failure, a slowdown that crept in between a known-good state and now, behavior that doesn't add up. Its core move is building a reliable feedback loop before theorizing. An on-ramp - use it when you start from a bug, not from a new idea.
---

# diagnose - build the loop, then theorize

The instinct is to guess a cause and try a fix.
Invert it.
Almost all the effort goes into step 1.

Diagnose finds and explains; it does not fix on its own.
The code stays untouched until the diagnosis is shown and the caller approves a fix (step 4).
The caller is whoever runs the skill - a person or an agent driving it.

## 1. Build a reproduction loop

A loop that:
- reproduces the bug **on demand** (not "sometimes"),
- is **fast** (seconds, not minutes),
- has an unambiguous **red / green**,
- the agent can run on its own.

Without this you're guessing blind.
If a human must click to reproduce, script everything around the manual step.
The repro script lives in `$TMPDIR`, not the repo - if it's worth keeping, step 5 turns it into a regression test.

## 2. Localize

Binary-search the gap between the last known-good state and the broken one: `git bisect` across commits, or bisect the input.
Narrow until the cause is cornered.

## 3. Theorize - with the loop running

Now hypotheses are cheap: each one is confirmed or killed in seconds against the loop.
One change at a time.
Probes (logging, a temporary tweak to test a hypothesis) are fine - revert each one before moving on.
Nothing that stays in the code is a fix yet.

## 4. Report, then stop

Before reporting, check `git status` - no probe should be left behind.

Show what you found, in this order:
- the **cause** - one or two sentences, and the evidence that confirms it (what the loop showed),
- what you **ruled out**, briefly,
- the **fix** - what to change and where; if there are real alternatives, give them with a lean,
- the **risk** - what else the fix touches.

Then wait.
Don't edit, commit or push until the caller picks a fix.
If nobody can answer (an unattended run), the report is the result: hand it over and stop - don't pick a fix for the caller.
If the cause isn't confirmed, say so and name what would confirm it - don't dress a guess up as a diagnosis.

## 5. Fix and lock it

Once approved, turn the reproduction into a regression test via `tdd` - the red becomes green and stays green.

## 6. Short post-mortem

Why didn't an existing test catch this?
If the answer is "there was no seam to test it" - no place in the code to isolate and exercise the behavior - that's a design gap worth fixing, not just a bug to close.

A gap doesn't survive as a note in a chat: give it a home.
Hard-to-reverse and worth explaining later -> an ADR via `vocab`.
Work someone has to do -> a ticket.
Neither -> say so and drop it, rather than leaving it half-recorded.
