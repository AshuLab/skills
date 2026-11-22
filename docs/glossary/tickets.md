# Tickets

**Design artifacts** - the files `sharpen`, `to-spec` and `vocab` leave for an epic: the spec in `docs/specs/`, ADRs in `docs/adr/`, glossary edits. They belong to the epic, so they live on the epic branch as its first commit, never on the base branch.
_Avoid_: "hand-off artifacts", "spec files".

**Hand-off** - the last step of `to-tickets`: cut the epic branch, commit the design artifacts as its first commit, push, verify, and set `solve:epic:ready`. It exists so the artifacts reach the remote, the only place an orchestrator on another clone or machine can read them.
_Avoid_: "publish step", "epic sync".

**Epic ready** - the `solve:epic:ready` label, set by the hand-off when tickets are defined and the design artifacts are verified on the remote. Read by whatever runs the epic; Solve itself only sets it.
_Avoid_: "epic refined", "epic startable".

**Draft index** - the `NNN` a `to-tickets` draft uses to point at a slice before it has a real issue number. It appears only in a slice's `Blocked by`, as bare digits (never with `@` or `#`), and is swapped for the blocker's `#<issue>` handle at publish. Prose never refers to a slice by index.
_Avoid_: "placeholder", "marker", "draft reference".
