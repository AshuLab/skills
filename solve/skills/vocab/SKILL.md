---
name: vocab
description: Build and refine the project's domain vocabulary - a glossary of terms and architecture decision records (ADRs). Use it when you want to pin down vague or overloaded terminology, or record a hard-to-reverse decision. Other skills in the solve skill set invoke it as the shared vocabulary layer.
---

# vocab - shared domain vocabulary

The foundation of the set: without precise terms, every skill speaks a different language.
Maintains two artifacts - the glossary and the ADRs, each with an index - nothing else.

## The artifacts

Everything is sorted by **topic** - a short kebab-case name for an area of the domain (`ship`, `tracker`, `review`), one taxonomy shared by the glossary and the ADRs. It keeps any single file small and lets a reader open only the part that matters.

```
docs/glossary.md              <- index: one line per topic, listing its terms
docs/glossary/<topic>.md      <- the entries for that topic
docs/adr/README.md            <- index: ADRs grouped by topic, one line each
docs/adr/<topic>/NNNN-title.md
```

**Glossary entry** - `**Term** - what it means here, in a line or two`, then an `_Avoid_:` line naming the synonyms this term replaces, so the ambiguity stays settled. A topic file starts with `# <Topic>`.

**ADR** - one per decision, numbered, the title in kebab-case. The number is global across topics: "ADR 0007" names one file, and `superseded by [NNNN]` never needs a topic. The next number is the highest one in the index plus one.

## Reading it

Read an index first, then open only the topic file or the ADR that bears on the question - never the whole tree. Skills that need context from the glossary or the ADRs do the same.

## Choosing the topic

1. List the topic folders that exist (`docs/glossary/` and `docs/adr/` together) and **reuse the one that fits**.
2. Create a topic only when none fits: an area of the domain, not a feature or a ticket, named once and short. It's born with its first entry - never an empty folder, never "just in case".
3. A term lives in one topic - the one that owns it. Another topic that needs it references it, never copies it.

A topic that has gone thin or overlaps a neighbor gets merged into it (`git mv`, fix the index and every reference to a moved path).

## Keeping the indexes

The index is part of the entry: an entry or ADR isn't done until its index line is.
- `docs/glossary.md` - per topic, one line: `**<topic>** ([glossary/<topic>.md](glossary/<topic>.md)): Term, Term, ...`.
- `docs/adr/README.md` - per topic a `##` heading, then one line per ADR: `- [NNNN](<topic>/NNNN-title.md) - title (status) - the decision in a phrase`.
- First time in a repo that predates topics (a glossary with its entries inline, ADRs flat in `docs/adr/`): sort the glossary into topic files and build both indexes; leave existing ADRs where they are and index them under their topic with their real path. Moving one is optional, and then every reference to its old path moves with it.

## Working the glossary

- **Look before adding** - find the term (or its `_Avoid_` words) in the index first. The same concept already there gets edited, never a second entry.
- **Grow it by friction, not upfront** - add a term the moment a real ambiguity bites: a clash surfaced in the questioning, or the code naming something the domain never did. Never a preemptive sweep - an empty glossary that grows on demand beats a full one nobody trusts.
- **Challenge vague terms** - pin down what "process" or "order" actually mean here; a vague entry is worse than none.
- **Resolve overloaded words** - if "user" means three things, invent three precise terms, keep those, and list "user" under their `_Avoid_` so it can't creep back.
- **Domain only, not code** - "idempotency" can go in; "UserRepository" can't.
- **Prune** - delete a term once its concept is gone from the code and the domain, and fix the index line.
- **Cross-check against the code** - when the user states how something works, check whether the code agrees. A contradiction is worth surfacing on the spot: "the code cancels the whole Order, but you just said partial cancellation is possible - which is it?" Let them resolve it; don't silently pick a side.

## When to create an ADR

Only when **all three** hold at once:
1. **Hard-to-reverse** - undoing it later is expensive.
2. **Surprising without context** - a reader won't get why it's like this.
3. **A real trade-off** - there were legitimate alternatives.

Miss one and there's no ADR.
"We use TypeScript" isn't one; "event sourcing over CRUD, for an immutable audit trail, accepting projection complexity" is.

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

An ADR is never deleted - the history is the point. A decision that changes gets a new ADR; the old one's status becomes `superseded by [NNNN]`, in the file and in the index, and it stays where it is.

Write ADRs as flowing prose - one line per paragraph, not hard-wrapped to a fixed width (glossary entries are just a line or two).

Never duplicate an entry - reference it.
