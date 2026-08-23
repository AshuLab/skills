# Standards baseline

Design prompts for the **Standards axis**. Repository conventions override this baseline. Every smell is a judgement call, not a violation by name alone; cite the changed hunk and its concrete maintenance cost.

Read “unit” as a function, section, template, rule, schema, or whatever the change is made of.

## Any change

**Speculative Generality** — abstraction, hook, option, or parameter nobody needs; often one caller or implementer → delete. Highest-value smell because it removes work.

**Dead Code** — unreachable branch, unused export, unread config, or unreferenced section → delete; version control remembers it.

**Duplicated Code** — same shape in several changed hunks → one source of truth. Three occurrences justify arguing; two often do not.

**Mysterious Name** — the name hides purpose; no honest name exposes a murky design → rename or simplify the design.

**Long Parameter List** — too many knobs, especially adjacent values of the same type → group only what belongs together.

**Divergent Change** — one file changes for unrelated reasons → split by reason.

**Shotgun Surgery** — one behaviour requires scattered edits across many files → colocate what changes together.

**Middle Man** — a layer mostly forwards without adding policy or value → address the real target.

**Global / Mutable State** — writes are broadly reachable or far from creation; in-place mutation surprises holders → encapsulate mutation. Concurrent impact belongs under Risk.

## Code with types or objects

Skip this group when it does not apply.

**Feature Envy** — a unit uses another object's data more than its own → move behaviour toward the data.

**Data Clumps** — the same fields repeatedly travel together → introduce one meaningful type.

**Primitive Obsession** — a primitive hides a domain concept and its invariants → represent the concept explicitly.

**Repeated Switches** — repeated branching on the same type → centralize it with polymorphism or a shared map. One exhaustive switch is fine.

**Message Chains** — callers navigate internals they should not know → hide the traversal behind the owning abstraction.

**Refused Bequest** — a subtype ignores or overrides most inherited behaviour → prefer composition.
