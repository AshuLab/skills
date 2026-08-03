---
name: diagnose
description: Systematically diagnose a hard bug or a performance regression - a flaky failure, a slowdown that crept in between a known-good state and now, behavior that doesn't add up. Its core move is building a reliable feedback loop before theorizing. An on-ramp - use it when you start from a bug, not from a new idea.
---

# diagnose - build the loop, then theorize

The instinct is to guess a cause and try a fix. Invert it. Almost all the effort
goes into step 1.

## 1. Build a reproduction loop

A loop that:
- reproduces the bug **on demand** (not "sometimes"),
- is **fast** (seconds, not minutes),
- has an unambiguous **red / green**,
- the agent can run on its own.

Without this you're guessing blind. If a human must click to reproduce, script
everything around the manual step. The repro script lives in `$TMPDIR`, not the
repo - if it's worth keeping, step 4 turns it into a regression test.

## 2. Localize

Binary-search the gap between the last known-good state and the broken one:
`git bisect` across commits, or bisect the input. Narrow until the cause is
cornered.

## 3. Theorize - with the loop running

Now hypotheses are cheap: each one is confirmed or killed in seconds against the loop.
One change at a time.

## 4. Fix and lock it

Turn the reproduction into a regression test via `tdd` - the red becomes green
and stays green.

## 5. Short post-mortem

Why didn't an existing test catch this? If the answer is "there was no seam to
test it" - no place in the code to isolate and exercise the behavior - that's a
design gap worth fixing, not just a bug to close.
