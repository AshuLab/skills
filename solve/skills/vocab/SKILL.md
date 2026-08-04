---
name: vocab
description: Build and refine the project's domain vocabulary - a glossary of terms and architecture decision records (ADRs). Use it when you want to pin down vague or overloaded terminology, or record a hard-to-reverse decision. Other skills in the solve skill set invoke it as the shared vocabulary layer.
---

# vocab - shared domain vocabulary

The foundation of the set: without precise terms, every skill speaks a different
language. Maintains two artifacts, nothing else.

## The two artifacts

**`docs/glossary.md`** - domain terms, one per entry: `**Term** - what it means
here, in a line or two`, then an `_Avoid_:` line naming the synonyms this term
replaces, so the ambiguity stays settled. No implementation details (a class name
or endpoint means it's in the wrong place). The dictionary, not the documentation.

**`docs/adr/NNNN-title.md`** - architecture decision records, one per decision,
numbered, the title in kebab-case.

## Working the glossary

- **Grow it by friction, not upfront** - add a term the moment a real ambiguity
  bites: a clash surfaced in the grilling, or the code naming something the domain
  never did. Never a preemptive sweep - an empty glossary that grows on demand
  beats a full one nobody trusts.
- **Challenge vague terms** - pin down what "process" or "order" actually mean here;
  a vague entry is worse than none.
- **Resolve overloaded words** - if "user" means three things, invent three precise
  terms, keep those, and list "user" under their `_Avoid_` so it can't creep back.
- **Domain only, not code** - "idempotency" can go in; "UserRepository" can't.

## When to create an ADR

Only when **all three** hold at once:
1. **Hard-to-reverse** - undoing it later is expensive.
2. **Surprising without context** - a reader won't get why it's like this.
3. **A real trade-off** - there were legitimate alternatives.

Miss one and there's no ADR. "We use TypeScript" isn't one; "event sourcing over
CRUD, for an immutable audit trail, accepting projection complexity" is.

## ADR format

```markdown
# NNNN - <short title>

- Status: proposed | accepted | superseded by [NNNN]
- Date: YYYY-MM-DD

## Context
The problem and the forces at play.

## Decision
What we chose, present tense, active voice: "We use X".

## Alternatives considered
What we discarded and why - the part that pays off a year later.

## Consequences
The trade-offs accepted, good and bad.
```

Write ADRs as flowing prose - one line per paragraph, not hard-wrapped to a fixed
width (glossary entries are just a line or two).

Invoked by `sharpen` (terms + ADRs during grilling) and `to-spec` (reads the
glossary). Never duplicate an entry - reference it.
