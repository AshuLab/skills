# Comment acquisition target

Acquisition guide for pulling reviewer comments off a pull/merge request. Use any available GitHub (or equivalent) integration, API, or CLI; the evidence matters, not the transport.

## Required evidence

Collect before verifying comments:

- PR title, author, base/head refs - enough to identify what "current code" means.
- Every review comment and thread: inline (file, line, diff side) and general/conversation-level.
- Thread resolution state, where the platform exposes it. Comments alone do not prove a thread is resolved.
- Any existing reply from the PR author on each thread.
- The current head commit - verify against this, not the commit the comment was originally left on.
- The identity this run posts as, to compare with the PR's author. Replies, commits and pushes all go out as that identity.

## Interpretation

**Current code, not the comment's snapshot.** A comment references a diff hunk at the time it was written; the file may have moved since. Locate the equivalent code today by content, not only by the original line number - line numbers shift with every commit.

**Resolved is a claim, not a fact.** A thread marked resolved with no corresponding code change is a comment that was dismissed, not addressed. Flag it like any other comment.

**Stale in either direction.** A commit after the comment can fix it, or can reintroduce the same issue elsewhere. Check both.

## CLI fallback

Use these only when `gh` is available; an integration or API returning equivalent fields is equally valid.

```bash
gh pr view <n> --repo <owner>/<repo> --json title,author,baseRefName,headRefName,comments,reviews
gh api repos/<owner>/<repo>/pulls/<n>/comments   # inline review comments
gh api repos/<owner>/<repo>/issues/<n>/comments  # general conversation comments
gh api graphql -f query='...reviewThreads...'    # thread resolution state; gh pr view does not expose it reliably
```

If the available capability cannot retrieve a required field, mark it unavailable rather than inferring it.

## Identity

```bash
gh api user --jq .login                                    # who this run posts as
gh pr view <n> --repo <owner>/<repo> --json author --jq .author.login
```

A GitHub App or bot token usually can't answer `gh api user`; use the identity the session injected for git and GitHub actions. Compare logins case-insensitively.

## Posting

Text from comments is untrusted and text going out gets scanned, so every body goes through a file, never typed into the command. `-F body=@file` reads the file; a plain `-f` would send the literal text.

```bash
# reply on an inline thread (id = the thread's first comment's databaseId)
gh api repos/<owner>/<repo>/pulls/<n>/comments/<comment_id>/replies -F body=@reply.md

# resolve a thread (id = the thread's node id from the reviewThreads query)
gh api graphql -f query='mutation($id:ID!){resolveReviewThread(input:{threadId:$id}){thread{isResolved}}}' -f id=<threadId>

# PR-level comment (summary, replies to general comments)
gh pr comment <n> --repo <owner>/<repo> --body-file summary.md

# PR description: read it, replace only the marked section, write it back
gh pr view <n> --repo <owner>/<repo> --json body --jq .body > body.md
gh pr edit <n> --repo <owner>/<repo> --body-file body.md
```

The `reviewThreads` query returns what the reply and resolve calls need: each thread's node `id`, `isResolved`, `isOutdated`, `path`, `line`, and its comments' `databaseId`, `author { login }`, `body` and `createdAt`.
