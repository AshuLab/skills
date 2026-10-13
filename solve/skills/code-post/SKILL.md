---
name: code-post
description: "Takes a code-review report and publishes its findings where each one belongs - inline comments on the pull request, a single review submission, a ticket for work too big for this PR, an ADR for a design gap - after re-verifying each finding against the current code. It posts straight away when the delivery is the review that was read, and stops to show the exact text only when something deviates or the caller asks to see it first. The counterpart to code-review, which deliberately never publishes. Use when a review has been read and its findings should reach the author, to post a review produced earlier or by someone else, or to close and reply to threads after a re-review."
---

# code-post - Deliver a Review Where It Belongs

`code-review` finds and reports; it never publishes. `code-post` runs once the caller has read that report and decided it should go out.

**Being invoked is the go-ahead to deliver the review the caller read.** `code-post` posts it straight away, as written. It stops and shows the exact package first only when the delivery would differ from that review (step 4 lists when), or when the caller asks to see it first. Post nothing that fails re-verification.

## Publishing contract

Rules that bind every finding:

1. **Re-verify before publishing.** Read the current code at each `file:line`, not the state the review saw. Already fixed -> drop it: it goes in *Dropped* when the package is shown (step 4 stops for this, since the Verdict no longer matches), never to the author. Never post a finding you have not re-confirmed.
2. **Certainty travels with the finding.** Post a `probable` finding with its assumption and what would confirm it. Never launder `probable` into a flat assertion by dropping the hedge.
3. **The stance is the caller's, not yours.** Default to a plain comment; never select approve or request-changes on your own - offer it in the stop package or in the report after posting.
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
- No pull request at all (the source is a supplied diff, or a file with no PR to resolve) -> nowhere to comment. Hand the report back as a file and say why; never invent a destination.

State both before doing anything. If the PR's head has moved since the review ran, say so here.

**If the report's Verdict is `Inconclusive`**, say so before going further: the review did not examine the code enough to conclude, and the author would read it as complete. Ask whether to deliver it as is, with the Verdict line stating it, or to re-run `code-review` first. Never deliver it silently.

**If the pull request is the caller's own**, say so and offer the alternatives: apply the fixes directly, or keep the report as notes. Deliver only if they still want it.

## 2 - Route each finding

Every finding gets exactly one destination. Decide per finding, not per axis.

- **Inline comment** - a concrete `file:line` **that appears in the diff**. GitHub anchors only to changed lines; a finding on untouched code goes to the body, however valid.
- **Review body** - change-level findings (necessity, scope, bundling), anything whose line is outside the diff, and the *Solid* lines. The report's Verdict line closes the body, verbatim.
- **A ticket** - a real blocker too large for this pull request, or one that reveals missing work. Publish it through the repository's tracker operations and reference it from the review body, never inline in full.
- **An ADR or glossary entry** - a design gap or terminology clash, not a defect in this diff. Hand it to `vocab` (this set's glossary and ADR skill) or write it where the repo keeps those; reference it from the body.
- **Not posted** - the report's Coverage block and any note about the reviewer's own run. It is evidence for whoever read the review, not for the author.
- **Dropped** - already fixed since the review ran (contract rule 1), already said by someone else (rule 5), or a nitpick the caller chose not to send.

Severity decides volume:

- **Blockers** - all of them, inline where the line allows it.
- **Suggestions** - as written; `probable` ones carry their assumption.
- **Nitpicks** - one grouped comment in the body, never one inline each. Offer dropping them entirely.

## 3 - Draft the comments

Each comment is the finding, not a retelling of it. Keep `code-review`'s shape: the defect, its consequence, the smallest concrete fix, each on its own paragraph so GitHub does not run them together.

- Address the code, never the author. "This drops the guard on X" - not "you forgot".
- No preamble, no "great work overall", no restating the diff back.
- A suggested-change block only where the fix is genuinely a one-line substitution verified against current code.
- Inherit language and tone from the session; the report and the comments should read as one voice.
- Open every Blocker comment with `**Blocker:**`. The author's `code-resolve` reads it to know the thread is the reviewer's to close.

## 4 - Post, or stop and show

Build the package below. Then **post it straight away** (step 5) when it is the review the caller read, delivered as written.

**Stop and show it instead, and wait for approval,** when any of these holds:

- A finding no longer re-verifies as written: fixed, moved, or changed since the review ran.
- The PR's head has moved since the review ran.
- A ticket or ADR would be created. Those are artifacts beyond the review itself.
- The caller asked to see it first ("show me first", "preview").

Step 1 already stops for the caller's own PR and for an `Inconclusive` Verdict. The stance is a plain comment unless the request names approve or request-changes; it is never inferred from the Verdict.

When you stop, present the whole delivery before any of it exists on the platform:

```markdown
## Review body

[The review body: change-level findings, Solid, grouped nitpicks, and the report's Verdict line verbatim]

## Inline comments (N)

- `file:line` - _(verified | probable)_

  "{exact comment text}"

## Elsewhere

- Ticket: "{title}" - {why it isn't a PR comment}
- ADR / glossary: {what, via vocab}

## Dropped (N)

- `file:line` - already fixed in {commit} | already raised by {author} | nitpick, on request

## Stance

Plain comment. The Verdict suggests: {Request changes if `Not ready` | Approve if `Ready` | nothing if `Inconclusive`}. The choice is yours - say so and it changes.
```

Say which condition stopped the delivery, and ask for approval. The caller can approve everything, cut or reword individual comments, or change the stance. Apply only what is approved - and if this run has no way to get an answer back, hand over the package rather than posting it.

## 5 - Post

Straight away, or once approved after a stop, in this order:

1. **Submit the review** - body plus every inline comment, as one submission, with the approved stance.
2. **Create the tickets and hand off the ADRs**, then edit the review body's references to point at the real handles if they were placeholders.
3. **Report exactly what landed** - the text that went out, what posted, what failed, what was dropped and why. If the Verdict suggested a stance other than the plain comment you used, say so; the caller can submit it as a follow-up review. If a comment fails to anchor because its line moved, name it; never relocate it to the body silently.

Use whatever GitHub integration, API, or CLI is available. If the submission fails partway, report what succeeded and what did not; never assume success.

Then stop. Replying to whatever the author answers is `code-resolve`'s job, from the other side.

## Delivering a re-review

When the source is a `code-review` re-review, there is no new review to submit - the delivery is thread actions. Same contract: re-verify each verdict against the current code, then post the thread actions straight away if each holds as written. If one no longer does, or the caller asked to see it first, show the exact text and wait for approval.

```markdown
## Close (N)

- `file:line` (@reviewer) - Fixed in {commit}

## Reply and keep open (N)

- `file:line` - "{exact reply text}"

## New findings

[Delivered as a normal review, following steps 2-5, or `None`]
```

The re-review's own Verdict line is not posted; the delivery is the thread actions above.

Then post the replies, resolve the threads under *Close*, then submit any new findings as one review. Report what landed. Only the reviewer who raised a thread closes a Blocker - never close another reviewer's.
