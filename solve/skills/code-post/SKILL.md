---
name: code-post
description: "Takes a code-review report and publishes its findings where each one belongs - inline comments on the pull request, a single review submission, a ticket for work too big for this PR, an ADR for a design gap - after re-verifying each finding against the current code and getting approval on the exact text. The counterpart to code-review, which deliberately never publishes. Use when a review has been read and its findings should reach the author, or to post a review produced earlier or by someone else."
---

# code-post - Deliver a Review Where It Belongs

`code-review` finds and reports; it never publishes. `code-post` runs once a person has read that report and decided it should go out.

**Being invoked is not that decision applied blindly.** The caller wants the review delivered; they have not agreed to every comment's wording, destination, or stance. Post nothing before the approval step, and nothing that fails re-verification.

## Publishing contract

Rules that bind every finding:

1. **Re-verify before publishing.** Read the current code at each `file:line`, not the state the review saw. Already fixed -> drop it, silently. Never post a finding you have not re-confirmed.
2. **Certainty travels with the finding.** Post a `probable` finding with its assumption and what would confirm it. Never launder `probable` into a flat assertion by dropping the hedge.
3. **The stance is the human's, not yours.** Default to a plain comment; never select approve or request-changes on your own - offer it at the approval step.
4. **One submission, not many.** Inline comments go out as a single review.
5. **Never post the same thing twice.** Check existing comments first - yours from a previous run, or another reviewer who already said it.
6. **Carry the positives.** `code-review`'s *Solid* section goes in the review body.

## 1 - Resolve the source and the target

Resolve inputs semantically; slash commands or tool names are client-specific.

**Source** - the review being delivered:

- A report produced by `code-review` earlier in this session -> use it.
- A file, paste, or link containing one -> use it, and state what's unavailable. A foreign review may carry no certainty labels, no severities and no *Solid* section; map what it has onto the rules below and name the ones you can't apply - never invent the missing parts.
- No report anywhere -> stop and say so; run `code-review` first. This skill delivers a review, it never performs one.

**Target** - where it goes:

- Pull-request URL or number -> that PR.
- No target, but the source names one or the current branch has an open PR -> resolve it and state what you resolved.
- No pull request at all (a local tracker has none) -> nowhere to comment. Hand the report back as a file and say why; never invent a destination.

State both before doing anything. If the PR's head has moved since the review ran, say so here.

**If the pull request is the caller's own**, say so and offer the alternatives: apply the fixes directly, or keep the report as notes. Deliver only if they still want it.

## 2 - Route each finding

Every finding gets exactly one destination. Decide per finding, not per axis.

- **Inline comment** - a concrete `file:line` **that appears in the diff**. GitHub anchors only to changed lines; a finding on untouched code goes to the body, however valid.
- **Review body** - change-level findings (necessity, scope, bundling), anything whose line is outside the diff, and the *Solid* lines. This is also where the verdict's reasoning goes.
- **A ticket** - a real blocker too large for this pull request, or one that reveals missing work. Publish it through the repository's tracker operations and reference it from the review body, never inline in full.
- **An ADR or glossary entry** - a design gap or terminology clash, not a defect in this diff. Hand it to `vocab` (this set's glossary and ADR skill) or write it where the repo keeps those; reference it from the body.
- **Dropped** - already fixed since the review ran (contract rule 1), already said by someone else (rule 5), or a nitpick the caller chose not to send.

Severity decides volume:

- **Blockers** - all of them, inline where the line allows it.
- **Suggestions** - as written; `probable` ones carry their assumption.
- **Nitpicks** - one grouped comment in the body, never one inline each. Offer dropping them entirely.

## 3 - Draft the comments

Each comment is the finding, not a retelling of it. Keep `code-review`'s shape: the defect, its consequence, the smallest concrete fix.

- Address the code, never the author. "This drops the guard on X" - not "you forgot".
- No preamble, no "great work overall", no restating the diff back.
- A suggested-change block only where the fix is genuinely a one-line substitution verified against current code.
- Inherit language and tone from the session; the report and the comments should read as one voice.

## 4 - Show the delivery and wait

Present the whole delivery before any of it exists on the platform:

```markdown
## Review body
[The text that will open the review: verdict reasoning, change-level findings, Solid, grouped nitpicks]

## Inline comments (N)
- `file:line` - _(verified | probable)_
  "{exact comment text}"

## Elsewhere
- Ticket: "{title}" - {why it isn't a PR comment}
- ADR / glossary: {what, via vocab}

## Dropped (N)
- `file:line` - already fixed in {commit} | already raised by {author} | nitpick, on request

## Stance
Plain comment. [Approve | Request changes] is yours to choose - say so and it changes.
```

Ask for approval. The caller can approve everything, cut or reword individual comments, or change the stance. Apply only what is approved - and if this run has no way to get an answer back, hand over the package rather than posting it.

## 5 - After approval

Only once approved, and in this order:

1. **Submit the review** - body plus every inline comment, as one submission, with the approved stance.
2. **Create the tickets and hand off the ADRs**, then edit the review body's references to point at the real handles if they were placeholders.
3. **Report exactly what landed** - what posted, what failed, what was dropped and why. If a comment fails to anchor because its line moved, name it; never relocate it to the body silently.

Use whatever GitHub integration, API, or CLI is available. If the submission fails partway, report what succeeded and what did not; never assume success.

Then stop. Replying to whatever the author answers is `code-resolve`'s job, from the other side.
