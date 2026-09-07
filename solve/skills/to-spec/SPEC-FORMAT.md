# Spec format

The spec file at `docs/specs/<feature>.md` matures in stages - one file:

- `sharpen` creates it as a **brief** (`Status: sharpening`) - scaffolding to hold the thinking so it survives the session.
- `to-spec` **consumes** the brief into a final **PRD** (`Status: spec`) - it folds the scaffolding into the real sections and drops what's now redundant.
- In local mode, `land` marks it **`Status: landed`** once the epic is merged and closed out - the terminal value, the counterpart of closing the epic issue in github mode. Nothing consumes the file after that; the status is there so a reader can tell a live spec from a delivered one.

The final PRD carries no scaffolding: git history holds the evolution, the document holds only the result.

**Prose style** - write the spec as flowing prose: one line per paragraph, never hard-wrapped to a fixed column width - the same way these skill files are written.

## Brief (`Status: sharpening`) - written by `sharpen`

Front matter under the title: `Status: sharpening`, plus `Source: owner/repo#NNN` if it came from an existing issue - so `to-spec` updates that issue instead of creating a new epic.

- **Problem** - who hurts and how we know.
- **Direction** - the chosen shape of the solution, not the detail; with the alternatives that lost, and why.
- **Out of scope** - what we are explicitly NOT doing.
- **Open questions** - what's unresolved (candidates for `research` / prototype).

## PRD (`Status: spec`) - `to-spec` transforms the brief into this

- **Problem** - kept as-is.
- **Solution** - the detailed fix. **Absorbs Direction**: Direction disappears as a section, Solution supersedes it.
- **Scope** - numbered user stories, small and verifiable.
- **Decisions** - implementation calls (link ADRs, don't restate) + testing seams per story (or "no tests - <why>"). When a decision is clearest **as code** - a type shape, schema, signature or state machine - inline that snippet, trimmed to the decision (not a working demo); the ticket inherits it.
- **Out of scope** - kept as-is.
- **Open questions** - only if *still genuinely open*. A final spec carries no stale questions, but resolving them is `to-spec`'s own step and not all of them are yours to answer - see the skill, not this file.

`to-spec` does not stack brief sections next to PRD sections - it consumes them.

## Template (final PRD)

```
# <feature>

Status: spec

## Problem
## Solution
## Scope
## Decisions
## Out of scope
## Open questions   (only if genuinely still open - otherwise omit)
```

The `# <feature>` H1 and the `Status:` header serve the standalone local file.
When `to-spec` publishes to a GitHub issue, they're dropped from the body - the issue has its own title and the `solve:epic` label instead.
