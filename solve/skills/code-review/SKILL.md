---
name: code-review
description: Review a diff against a fixed point (commit, branch, tag) on two independent axes — standards (does it follow the repo's conventions and avoid code smells?) and spec (does it do what the ticket/PRD asked?). Use it to review a branch, a PR, or work in progress before shipping.
---

# code-review — two axes: standards + spec

Review a diff against a fixed point. Two questions, kept apart so they don't
contaminate each other.

## Axis 1 — Standards

Does the change follow the repo's documented conventions? Read them first. If the
repo documents nothing, still apply a baseline of code smells: duplication, long
functions, feature envy, primitive obsession, shotgun surgery, leaky
abstractions, dead code.

Before the smells, the question they miss — **could this have been less code?**
Check the cheapest reuse first: did it rebuild what the repo already has, then what
the stdlib or platform gives for free, then what an installed dependency already
solves? If a reuse would replace the code, that's a finding. Cut needless code,
never necessary safeguards — security, validation, data-loss and boundary checks
stay, however much code they cost.

## Axis 2 — Spec

Does the change do what the ticket / PRD asked — no less, no more? Scope creep is
a finding. So is a user story left unmet.

## Report them separately

Don't merge the two into one ranked list. A change can pass Standards and fail
Spec, or the reverse — the reader needs to see both. Run each axis as a parallel
`Agent` so one doesn't colour the other.

## What code-review does not do

It doesn't hunt for bugs — that's `diagnose`. It doesn't refactor for you; it
points, you decide.
