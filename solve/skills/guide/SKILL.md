---
name: guide
description: The router for the solve skill set - say what you're trying to do and it points you to the right skill. Use it when you're not sure where to start or which step comes next. It orients; it doesn't do the work.
---

# guide - which skill, when

Say what you're trying to do; this points you to the skill.
You don't have to remember the set.

## Where to enter

The entry point is set by what you already know, not by whether it's a feature or a bug:

- **The problem isn't clear** - you can't yet name what hurts, for whom, or how you'd know it's fixed -> `sharpen`. It grills the raw idea into a brief; a fuzzy bug ("it feels slow", no definition yet) enters here too.
- **The problem is clear, the cause isn't** - it misbehaves and you don't know why -> `diagnose`. It builds a reliable repro before theorizing.
- **Both are clear** - it's no longer an idea or a mystery, just work to cut -> `to-tickets` to split it, or straight to `ship` if it's already one startable slice. Came from outside (someone else's issue, a handed-down ticket)? `pre-check` first.
- **First time in this repo and you want a GitHub tracker** -> `setup`. Skip it for the default: local markdown, zero config.

## Moving it forward

Each step consumes what the last one left, so they run in order:

- A brief, formalize it into a PRD -> `to-spec`. Decides where each story gets tested; in github mode it publishes the epic.
- A spec, split the work -> `to-tickets`. Vertical, agent-ready slices with their blocking edges.
- A startable ticket, take it to done -> `ship`. Claim, build, close the loop; reach for `tdd` / `code-review` when they earn it.
- A whole epic, drained slice by slice, unattended -> `ship`, handed the epic instead of one ticket.
- Something that sat a while, or didn't come from `sharpen` -> `pre-check` before advancing. Skip it when you just sharpened and are building now.

## Reach for these any time

- Stress-test an idea, plan or decision, with nothing written -> `follow:pushback`. `sharpen` recommends it for a raw idea.
- External facts before you can decide -> `research`. Primary sources, in the background.
- A design question only code can answer -> `prototype`. Throwaway; the output is a decision, not the thing.
- Pin down a term or record a hard decision -> `vocab`. The glossary and the ADRs.
- Drive a change test-first at a seam -> `tdd`.
- Review a diff or a PR against standards + the spec -> `code-review`.

## The shape

The same set seen as roles instead of goals - what each skill is in the machine:

```
spine     sharpen -> to-spec -> to-tickets -> ship
feeds     research, prototype, follow:pushback  (into the thinking, upstream)
support   tdd, code-review  (on the code, when they earn it)
gate      pre-check  (revalidate a stale or handed-down artifact before ship)
on-ramp   diagnose  (enter from a bug, not an idea)
setup     once per repo, only for a GitHub tracker (optional)
base      vocab  (glossary + ADRs, drawn on throughout)
```
