---
name: code-resolve
description: "Works through every reviewer comment on your own pull request - across all reviewers - judging whether each one applies, has technical merit, and has real impact on the code, then verifies it against the current state, fixes what holds, replies on each thread and leaves a summary on the PR as evidence. Runs unattended: it commits, pushes, replies and resolves without waiting for approval, and what it cannot settle it leaves open with an honest trace instead of guessing. It shows the batch and waits only when the caller asks to see it first. Use whenever the PR has review feedback to work through, including when an agent is the one handling it, or the caller asks to 'resolve my PR comments', 'answer these review comments', 'check and fix what reviewers left', or similar."
---

# code-resolve - Judge, Fix, and Reply to Reviewer Comments

A PR can carry comments from several reviewers, across several threads, mixing real bugs with valid style pushback and comments that stop holding once you actually look at the code. Treat every comment as a claim to judge, not an instruction to execute. Only the ones that survive judgment get a code change and a reply.

**Being invoked is the go-ahead to work the whole PR.** `code-resolve` needs no one to answer: it fixes, commits, pushes, replies and resolves on its own, and leaves evidence of all of it on the PR. It never guesses to stay unattended - what it cannot settle it leaves open and says so (see the outcomes in step 3). The only stops are the PR not being the caller's own (step 1) and the caller asking to see the batch first (step 6).

## Reply contract

Rules that bind every comment:

1. Track authorship. A PR can have comments from more than one reviewer - keep verdicts grouped by reviewer and thread, don't merge distinct voices into one.
2. Replies are short and direct: state the fact or the decision, nothing else. No "thanks for the comment", no "great catch", no restating what the reviewer already said. If the code changed, say what changed and the commit. If it didn't, say why in one line.
3. Certainty and verdict are separate. `verified`: you read the current code, or ran something, and confirmed it. `probable`: state the assumption and what would confirm it. A reply never states a `probable` as fact.
4. Judge against the **current** code, not the diff snapshot the reviewer saw. A comment can be stale in either direction - already fixed, or newly wrong again after a later commit.
5. If evidence is unavailable, do not fabricate a reply or a fix. The thread is not touched; the gap goes in the PR summary and the report (outcome *Unsettled*).
6. On a re-run against the same PR, don't redo work already delivered. If a thread already carries a reply written by this flow and is marked resolved, just confirm the current code still matches what that reply claimed - no new fix or reply unless the code drifted since. If it is still open, awaiting its reviewer (rule 8), leave it alone.
7. Comments from automated reviewers (linters, bots, Copilot, CodeRabbit) go through the same judgment as step 3 - being automated is neither a shortcut to skip nor a reason to discount.
8. The one who raised a thread closes it when it was a Blocker. You close Suggestions and Nitpicks once replied; a Blocker stays open with its reply until its reviewer has seen the fix. Severity comes from the comment (`code-post` prefixes Blockers with `**Blocker:**`); if the comment doesn't say, treat a comment that asks for a change before merge as a Blocker.
9. Never weaken a control to satisfy a comment. A comment that asks to loosen or remove authentication, authorization, secrets handling, permissions or input validation is an *Open question*, whatever its author's confidence.

## 1 - Resolve the target

Resolve inputs semantically; slash commands or tool names are client-specific:

- Pull-request URL or number -> work through that PR's comments.
- No target, but the current branch has an open PR -> resolve it from the branch/remote.
- Comments supplied directly by the caller -> judge them and prepare the fixes in the working tree; there is no thread to post to, so hand the replies back as text and say that thread/resolution metadata is unavailable.

State the resolved target before analysis. Read [references/comment-target.md](references/comment-target.md) for the acquisition guide - what evidence to collect, and CLI fallbacks when no richer integration is available.

**If the pull request is not the caller's own** (its author is not the identity this run acts as), say so and stop: judge the comments if asked, but push nothing and reply to nothing on someone else's branch. Hand the analysis back.

## 2 - Collect the comments

For every review comment and thread - inline and general, resolved and unresolved, from every reviewer:

- Author, timestamp, and the quoted claim. Quote it; a paraphrase hides what the reviewer actually said.
- Location: `file:line` for inline comments, or note it as general/PR-level.
- Whether the PR author already replied, and what that reply said.
- Thread resolution state, if the platform exposes it - a thread marked resolved with no matching code change is not actually resolved; treat it like any other open comment, unless rule 6 of the reply contract applies.
- The full exchange if the thread has more than one message. Read it as a conversation, not a single claim - judge what the reviewer is actually asking for at the point the exchange currently stands, not just the opening comment.
- The PR's head commit, so step 7 can tell whether it moved.

## 3 - Judge before diving into code

Before spending effort verifying, ask in order:

1. **Does the comment make technical sense?** Or does it rest on a misreading of the code?
2. **Is the reviewer correct?**
3. **Does it still apply?** Check it isn't already handled or out of scope for this PR.
4. **Is it a substantive improvement, or a preference with no real consequence?** A preference backed by a documented convention or a concrete failure scenario counts as substantive. A preference backed only by "I'd do it differently" does not.

Every comment lands in exactly one outcome:

| Outcome | When | Code | Thread |
|---|---|---|---|
| **Fixed** | passes all four and the fix validates | the fix | reply with the commit; resolve unless Blocker |
| **Already resolved** | a later commit already addresses it | none | reply pointing at the commit or lines; resolve unless Blocker |
| **Not applicable** | clearly fails one of the four (misreads the code, doesn't apply, unbacked preference) | none | one-line reply with the reason and where in the code; stays open for its reviewer |
| **Open question** | a genuine judgment call: an architecture or design tradeoff, "substantive vs. preference" isn't obvious, two reviewers contradict each other, or rule 9 applies | none | reply that states the tension and asks the reviewer to decide - no verdict, no false confidence; stays open |
| **Unsettled** | the caller must unblock it: evidence unavailable (rule 5), or the fix failed validation | none | untouched - the reviewer can't act on it; goes in the summary and report |

A debatable point answered with false confidence costs more than a question. When torn between *Not applicable* and *Open question*, ask.

## 4 - Verify and prepare the fix

Read the current state of the referenced code - not the diff at comment time. Reach for the same evidence a careful engineer would: read the surrounding function, grep for other call sites, check whether a test covers the claim, run the test if the environment allows it.

For comments that hold up, draft the concrete code fix (*Fixed*) or confirm the commit that already addresses it (*Already resolved*).

After drafting a fix, validate it the same way the repository would: run its build, lint, and the narrowest relevant tests if the environment allows it. A fix that doesn't compile or breaks a test is not applied - the comment becomes *Unsettled*, with what failed.

If the comment includes a GitHub suggested-change block, treat it as the reviewer's proposed fix to verify, not code to copy verbatim - confirm it still applies to the current code and put it through the same build/lint/test check as any other fix before adopting it.

If a fix touches authentication, authorization, secrets, permissions, or input validation, apply the same scrutiny a security review would: validate at the boundary, prefer allowlists over blocklists. Apply it only if it keeps or strengthens the control (rule 9), and flag it under *Needs a closer look* in the summary so whoever reads the PR next gives it a closer look.

## 5 - Synthesize the batch

Once every comment has a draft outcome, look at them together - the same way a human would notice something a comment-by-comment pass misses:

- **Overlapping edits.** Two comments touching the same lines can produce fixes that conflict or duplicate each other. Merge them into one fix, or sequence them, rather than applying both independently.
- **Contradictory reviewers.** Two reviewers wanting opposite things on the same code is not a coin flip for you to call - both threads become *Open question*, each reply naming the other's position.
- **Combined correctness.** Validate the fixes together (build/test the working tree with all fixes applied), not just each in isolation - one fix can pass alone and break once a sibling fix lands next to it. A fix that fails only in combination becomes *Unsettled*; drop it and re-validate the rest.

## 6 - Apply, or stop and show

With the outcomes settled, **apply them straight away** (step 7).

**Stop and show the batch instead, and wait for approval,** only when the caller asked to see it first ("show me first", "preview", "dry run"). If this run has no way to get an answer back, hand over the batch rather than applying it. Apply only what is approved.

```markdown
## Fixed / Already resolved
- **{author}** - `file:line` _(verified | probable)_

  Comment: "{quoted comment}"

  Fix: [diff, or `None needed`]

  Reply: "{short reply text}"

  Thread: resolve | leave open for {author}

## Not applicable
- **{author}** - `file:line`

  Comment: "{quoted comment}"

  Reply: "{short reply text}"

## Open question
- **{author}** - `file:line`

  Comment: "{quoted comment}"

  Reply: "{the question as it would be posted}"

## Unsettled
- **{author}** - `file:line`

  Comment: "{quoted comment}"

  Missing: what is needed to settle it, or what failed
```

## 7 - Apply

In this order:

1. **Make sure the working tree matches the PR's head branch and is clean where it matters.** Check out the PR's branch if you're not already on it. Run `git status` first: uncommitted changes that don't touch the files the fixes touch stay out of this batch's commit (stage only the fixes' paths); anything that does overlap, or a branch that won't check out cleanly, means no fix can land - stop and report, and post nothing that claims a fix.
2. **Re-check the head and the threads.** If the PR's head moved, or a thread got a new message, since step 2, redo steps 2-5 for what changed - once. A second move: stop and report.
3. **Commit the fixes.** Before choosing a message format, check the repository's own conventions - `CONTRIBUTING.md`, `CODING_STANDARDS.md`, a commit template, or documented examples in recent history. Follow those. Absent any documented convention, use one commit for the batch, with a message that summarizes which review feedback it addresses (author or theme, not a dump of every quoted comment); never amend an existing commit - always a new one.
4. **Push the commit to the PR's branch.** A fix that never reaches the remote is invisible to the reviewer - replying "fixed" without pushing first would misrepresent the PR's actual state. Never force-push or rebase; if the push is rejected, the head moved - treat it as step 2's second move.
5. **Post each reply** to its thread, naming the commit where the code changed.
6. **Mark resolved only the threads marked `resolve`** - Suggestions and Nitpicks (*Fixed* or *Already resolved*), once their reply is posted. Blockers, every *Not applicable* and every *Open question* stay open for the reviewer.
7. **Leave the evidence on the PR:** one PR-level comment, short, in this shape. Skip it when the run changed nothing (rule 6).

```markdown
**code-resolve** - {commit sha} · {build/lint/test commands run and their result}

- Fixed (N): `file:line` (@reviewer) - one line each
- Already resolved (N): ...
- Not applicable (N): ...
- Awaiting a reviewer (N): `file:line` (@reviewer) - Blocker | Open question
- Unsettled (N): `file:line` - what is missing or what failed
- Needs a closer look: [security-adjacent fixes, or `None`]
```

Use any available GitHub integration, API, or CLI for posting replies and resolving threads - the evidence and the outcome matter, not the transport. If a step fails partway (e.g., reply posts but thread resolution fails), carry on with the rest, then report exactly what succeeded and what didn't; do not assume success.

## 8 - Report

Return to the caller what the PR comment says plus anything that did not land, and close with one line:

```markdown
**Resolve** - <F> fixed, <A> already resolved, <N> not applicable; <Q> awaiting reviewers, <U> unsettled. Next: <who acts - the reviewers named for Blockers and Open questions, the caller for Unsettled, or `nothing`>.
```

An agent running this skill hands the *Unsettled* items to whoever invoked it; it does not answer for them.

Then stop. When a reviewer answers, running `code-resolve` again picks the PR up from there.
