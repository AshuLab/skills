---
name: guide
description: The router for the solve skill set - say what you're trying to do and it points you to the right skill. Use it when you're not sure where to start or which step comes next. It orients; it doesn't do the work.
---

# guide - which skill, when

You don't have to remember the set. Say what you're trying to do; this points you
to the skill.

## Starting something new

- First time in this repo, want a GitHub tracker -> `setup` (skip it for the
  default, local markdown)
- Vague idea, needs sharpening -> `sharpen`
- Idea's been grilled, formalize it -> `to-spec`
- Have a spec, split the work -> `to-tickets`
- Have a ready ticket, take it to done -> `ship` (with `tdd` / `code-review` when
  they earn it)

## While sharpening, if talk isn't enough

- Need external facts before deciding -> `research`
- A design question only code can answer -> `prototype`

## Before advancing a spec or ticket (optional)

- It sat a while, or it didn't come from `sharpen` -> recheck it still applies and
  get it ready -> `pre-check`. Skip it when you just sharpened and are building now.

## Not starting from an idea

- A bug or a regression you don't understand -> `diagnose`

## Any time

- Pin down a term or record a hard decision -> `vocab`
- Review a diff or a PR against standards + spec -> `code-review`
- Drive a change test-first at a seam -> `tdd`

## The shape

```
setup                         <- once per repo, only for a GitHub tracker (optional)
sharpen -> to-spec -> to-tickets -> ship   (reach for tdd / code-review)
pre-check                     <- optional gate: recheck a spec/ticket still applies
research | prototype          <- feed the thinking (into sharpen)
diagnose                      <- on-ramp
vocab                         <- shared vocabulary, invoked throughout
```
