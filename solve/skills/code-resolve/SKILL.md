---
name: code-resolve
description: "Works through every reviewer comment on your own pull request - across all reviewers - judging whether each one applies, has technical merit, and has real impact on the code, then verifies it against the current state, drafts a short no-fluff reply, and prepares the code fix. Presents the full batch (fixes + replies) for approval before committing anything, posting replies, or marking threads as resolved on GitHub. Use whenever the user has PR review feedback to work through, wants short direct replies to reviewers, wants to know which comments are worth acting on, or asks to 'resolve my PR comments', 'answer these review comments', 'check and fix what reviewers left', or similar."
---

# code-resolve - Judge, Fix, and Reply to Reviewer Comments

A PR can carry comments from several reviewers, across several threads, mixing real bugs with valid style pushback and comments that stop holding once you actually look at the code. Treat every comment as a claim to judge, not an instruction to execute. Only the ones that survive judgment get a code change and a reply.

**Never commit, push, post a reply, or resolve a thread without explicit approval on the full batch first.** Prepare everything, then stop and show the package. The caller approves before anything touches GitHub or the working tree. A wrong technical verdict is a bug; a wrong tone or an unearned "not applicable" posted to a real reviewer is a social cost that outlasts the PR - when in doubt, hand the call back instead of guessing.

## Reply contract

Rules that bind every comment:

1. Track authorship. A PR can have comments from more than one reviewer - keep verdicts grouped by reviewer and thread, don't merge distinct voices into one.
2. Replies are short and direct: state the fact or the decision, nothing else. No "thanks for the comment", no "great catch", no restating what the reviewer already said. If the code changed, say what changed. If it didn't, say why in one line.
3. Certainty and verdict are separate. `verified`: you read the current code, or ran something, and confirmed it. `probable`: state the assumption and what would confirm it.
4. Judge against the **current** code, not the diff snapshot the reviewer saw. A comment can be stale in either direction - already fixed, or newly wrong again after a later commit.
5. If evidence is unavailable, do not fabricate a reply or a fix. Say what's missing and leave that thread untouched.
6. On a re-run against the same PR, don't redo work already delivered. If a thread already carries a reply written by this flow and is marked resolved, just confirm the current code still matches what that reply claimed - no new fix or reply unless the code drifted since.
7. Comments from automated reviewers (linters, bots, Copilot, CodeRabbit) go through the same judgment as step 3 - being automated is neither a shortcut to skip nor a reason to discount.

## 1 - Resolve the target

Resolve inputs semantically; slash commands or tool names are client-specific:

- Pull-request URL or number -> work through that PR's comments.
- No target, but the current branch has an open PR -> resolve it from the branch/remote.
- Comments supplied directly by the caller -> work through those, and state that thread/resolution metadata is unavailable.

State the resolved target before analysis. Read [references/comment-target.md](references/comment-target.md) for the acquisition guide - what evidence to collect, and CLI fallbacks when no richer integration is available.

## 2 - Collect the comments

For every review comment and thread - inline and general, resolved and unresolved, from every reviewer:

- Author, timestamp, and the quoted claim. Quote it; a paraphrase hides what the reviewer actually said.
- Location: `file:line` for inline comments, or note it as general/PR-level.
- Whether the PR author already replied, and what that reply said.
- Thread resolution state, if the platform exposes it - a thread marked resolved with no matching code change is not actually resolved; treat it like any other open comment, unless rule 6 of the reply contract applies.
- The full exchange if the thread has more than one message. Read it as a conversation, not a single claim - judge what the reviewer is actually asking for at the point the exchange currently stands, not just the opening comment.

## 3 - Judge before diving into code

Before spending effort verifying, ask in order:

1. **Does the comment make technical sense?** Or does it rest on a misreading of the code?
2. **Is the reviewer correct?**
3. **Does it still apply?** Check it isn't already handled or out of scope for this PR.
4. **Is it a substantive improvement, or a preference with no real consequence?** A preference backed by a documented convention or a concrete failure scenario counts as substantive. A preference backed only by "I'd do it differently" does not.

Three ways this can land:

- **Clearly fails one of the four** (doesn't apply, misreads the code, unbacked preference) -> stop here. Verdict: **Not applicable**, with a one-line reply explaining why nothing changes.
- **Clearly passes all four** -> move to step 4.
- **Genuinely a judgment call** - an architecture or design tradeoff, a case where "substantive vs. preference" isn't obvious, or friction with how confident the comment sounds - -> do not decide alone. Verdict: **Needs your input**, with the tension stated plainly (what the reviewer wants vs. why it's debatable) and no drafted reply. Getting this one wrong by answering a debatable point with false confidence costs more than asking.

## 4 - Verify and prepare the fix

Read the current state of the referenced code - not the diff at comment time. Reach for the same evidence a careful engineer would: read the surrounding function, grep for other call sites, check whether a test covers the claim, run the test if the environment allows it.

Then, for comments that hold up:

- **Valid** - draft the concrete code fix that resolves it, and a short reply stating what changed.
- **Already resolved** - a later commit already addresses it; no fix needed, draft a short reply pointing to the commit or the current lines that fix it.

After drafting a fix, validate it the same way the repository would: run its build, lint, and the narrowest relevant tests if the environment allows it. A fix that doesn't compile or breaks a test isn't ready for the batch - downgrade it to **Needs your input** and state what failed instead of presenting a broken diff for approval.

If the comment includes a GitHub suggested-change block, treat it as the reviewer's proposed fix to verify, not code to copy verbatim - confirm it still applies to the current code and put it through the same build/lint/test check as any other fix before adopting it.

If the comment or its fix touches authentication, authorization, secrets, permissions, or input validation, apply the same scrutiny a security review would: validate at the boundary, prefer allowlists over blocklists, and never weaken an existing control just to satisfy a comment. Flag these in the batch so the caller gives them a closer look before approving.

For comments that can't be settled from available evidence - **Needs more context** - do not draft a fix or a reply. State exactly what's missing (access, a linked doc, a test run) and leave the thread for the caller to handle directly.

## 5 - Synthesize the batch

Once every comment has a draft verdict, look at them together before assembling the report - the same way a human would notice something a comment-by-comment pass misses:

- **Overlapping edits.** Two comments touching the same lines can produce fixes that conflict or duplicate each other. Merge them into one fix, or sequence them, rather than presenting both independently.
- **Contradictory reviewers.** Two reviewers wanting opposite things on the same code is not a coin flip for you to call - treat it as a judgment-call case (see step 3) and surface the contradiction explicitly instead of silently picking a side.
- **Combined correctness.** Validate the fixes together (build/test the working tree with all approved-so-far fixes applied), not just each in isolation - one fix can pass alone and break once a sibling fix lands next to it.

Demote anything that fails this pass to **Needs your input** with the reason, rather than letting it ride into the batch as if it were still clean.

## 6 - Assemble the batch and stop

Present one consolidated package, never act before this is approved:

```markdown
## Ready to apply
- **{author}** - `file:line` _(verified | probable)_
  Comment: "{quoted comment}"
  Verdict: Valid | Already resolved
  Fix: [diff, or `None needed`]
  Reply: "{short reply text}"

## Not applicable
- **{author}** - `file:line`
  Comment: "{quoted comment}"
  Reply: "{short reply text}"

## Needs your input
- **{author}** - `file:line`
  Comment: "{quoted comment}"
  Why it's a judgment call, or what's missing to settle it
```

Ask for approval on the batch. The caller may approve all of it, reject specific items, or ask for changes to a fix or reply - apply only what's approved.

## 7 - After approval

Only once approved:

1. **Make sure the working tree matches the PR's head branch and is clean before touching anything.** Check out the PR's branch if you're not already on it. Run `git status` first - stash or ask about anything sitting there uncommitted rather than folding it into this batch's commit.
2. **Commit the approved fixes.** Before choosing a message format, check the repository's own conventions - `CONTRIBUTING.md`, `CODING_STANDARDS.md`, a commit template, or documented examples in recent history. Follow those. Absent any documented convention, use one commit for the approved batch, with a message that summarizes which review feedback it addresses (author or theme, not a dump of every quoted comment); never amend an existing commit - always a new one.
3. **Push the commit to the PR's branch.** A fix that never reaches the remote is invisible to the reviewer - resolving a thread without pushing first would misrepresent the PR's actual state.
4. **Post each approved reply** to its thread.
5. **Mark each addressed thread** (Valid or Already resolved, once its reply is posted) as resolved on GitHub.

Use any available GitHub integration, API, or CLI for posting replies and resolving threads - the evidence and the outcome matter, not the transport. If a step fails partway (e.g., reply posts but thread resolution fails), report exactly what succeeded and what didn't; do not assume success.
