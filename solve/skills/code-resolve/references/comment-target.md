# Comment acquisition target

Acquisition guide for pulling reviewer comments off a pull/merge request. Use any available GitHub (or equivalent) integration, API, or CLI; the evidence matters, not the transport.

## Required evidence

Collect before verifying comments:

- PR title, author, base/head refs - enough to identify what "current code" means.
- Every review comment and thread: inline (file, line, diff side) and general/conversation-level.
- Thread resolution state, where the platform exposes it. Comments alone do not prove a thread is resolved.
- Any existing reply from the PR author on each thread.
- The current head commit - verify against this, not the commit the comment was originally left on.

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
