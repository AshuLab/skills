# draft-index-mentions

Status: spec
Source: AshuLab/skills#48

## Problem

A published ticket notified a real GitHub user who has nothing to do with the repo (reported in AshuLab/carrier#432, body in carrier#414). `to-tickets` tells the agent to swap each draft index for the blocker's real `#<issue>` handle at publish, but never says how to write that index while drafting, so the agent invented `@@007@@` inside the prose. GitHub reads `@007` as a mention, and the notification goes out when the issue is created: editing the body afterwards does not recall it. Diego, the plugin's sole user today, is the one who hits it, and the harm lands on a third party who never opted in. `code-post` has the same shape: it submits the review first with placeholder references to tickets it creates afterwards, then edits the body.

The root is not a missing marker syntax. It is that a published body can notify or link to something nobody meant, and that cannot be undone. The only safe guarantee is that no body leaves with an `@` or a `#` that is not a deliberate mention or link.

## Solution

Two rules, applied where the bodies are written, with no new marker syntax. Both edits are skill text in `solve/skills/to-tickets/SKILL.md` and `solve/skills/code-post/SKILL.md`.

**`to-tickets`, drafting.** A draft index lives only in a slice's `Blocked by`, as bare digits, with no `@` and no `#`. The prose of a slice never refers to another slice by index, and never names a slice that is not one of its blockers: it describes the behavior instead. The glossary entry **Draft index** (already written) pins the term.

**`to-tickets`, publish.** The swap before each slice is created touches only the `Blocked by` line, rewriting each digit to the blocker's `#<issue>` handle. That is safe because blockers exist before a slice is published, so the topological order is enough and no second pass is needed. Then, before the body is sent, any `@word` outside a code fence or inline code, and any `#digits` other than those blocker handles, is wrapped in backticks, the same rule `file-issue` already applies to what it publishes. Tickets never mention people, so nothing legitimate is lost.

**`code-post`, order.** Step 5 flips: tickets and ADR hand-offs are created first, then the review is submitted with their real handles already in the body. No placeholder exists, so the "edit the review body's references" step is deleted. If a ticket fails to create, the review still goes out without that reference and the failure is reported, because the review is the deliverable and a side artifact must not hold it hostage.

**`code-post`, scan.** A review can mention people on purpose (the author, a reviewer), so here the scan does not rewrite. A `@word` outside code in the outgoing text that does not come from the review report that was read counts as a deviation, and `code-post` stops and shows the exact text, as it does for any other deviation.

What lost. The issue's `{{001}}` marker and its second `gh issue edit` pass per slice: once prose may not name non-blockers, forward references cannot occur, and blocker references already live in `Blocked by` as digits, so there is no marker to resolve and no second pass. For `code-post`, keeping the order and inventing a safe marker for the review body would be more machinery for the same result as creating the tickets first. A single scan rule for both skills lost too: tickets never mention people and reviews sometimes do, so one rule would either block legitimate review mentions or let stray ones through.

The change ships as a patch bump of `solve` to 0.26.2, in both `.claude-plugin/plugin.json` and `.codex-plugin/plugin.json`, with `to-tickets` and `code-post` entries under a new `## solve 0.26.2` heading in `CHANGELOG.md`.

## Scope

1. As the agent running `to-tickets`, I draft with draft indexes only in `Blocked by` as bare digits, describe other slices by behavior and name only blockers in prose, rewrite only the `Blocked by` line to `#<issue>` at publish, and wrap any other `@word` or `#digits` outside code in backticks before the body is sent, so a published slice cannot notify or link to anything unintended.
2. As `code-post`, I create the tickets and ADR hand-offs before submitting the review, so the body carries real handles from the start (a failed ticket drops its reference and is reported, the review still goes out), and I stop and show the exact text when the outgoing review contains a `@word` outside code that does not come from the report I was given.
3. As an installed user, I get the fix as `solve` 0.26.2, with the manifests in sync and the change recorded in `CHANGELOG.md`.

## Decisions

No new ADR: the change is reversible text in two skills and the trade-offs are the ones the Solution names.

Testing seams. The repo has no test suite, and every story is skill text. Stories 1 and 2 ship without tests: what an agent writes and how it scans is behavior of a model, and it can only be seen over a few real publishes after the change ships. Story 3 ships without tests: version numbers, checked by reading the diff.

Acceptance, once shipped: an epic of three or more slices whose prose has to relate to each other is published, and its issues contain no unresolved draft index and no stray `@word`.

## Out of scope

Mentions already sent cannot be undone, and carrier's bodies are already fixed. Other skills that publish bodies (`to-spec`'s epic body, `code-resolve` replies) are not touched: nothing here shows the same failure, and `file-issue` already wraps `@` and `#` in backticks. No tooling or lint outside the skill text. No change to the native `--blocked-by` edge or to the topological publish order.
