# GitHub PR target

Acquisition guide for a GitHub pull request. Use any available GitHub integration, API, or CLI; the evidence matters, not the transport.

## Required evidence

Collect before the three review passes:

- PR title, body, author, base/head refs, commits, and changed files.
- Current diff, not an earlier patchset.
- Check/CI status, distinguishing failed, running, absent, and unavailable.
- Mergeability and merge-state status.
- Review threads with resolution state, plus reviews and comments. Comments alone do not prove whether a thread is resolved.
- Ahead/behind counts between base and head.

The PR description is the author's claim, not an independent spec. Follow issue/ticket references to recover the original intent.

## Interpretation

**CI first.** A failed required check is a change-level finding. Running, missing, or inaccessible checks are limitations worth stating. Continue the review so the report is still useful.

**Review the current state.** Verify whether open feedback is actually addressed; commit messages are not evidence. Feedback still applicable and unattended is a Blocker. When commits landed after a review, distinguish resolved earlier findings from new changes. If thread-resolution state cannot be retrieved, mark it unavailable rather than guessing.

**Conflicts and staleness differ.** A clean merge status does not prove the branch is current. Measure ahead/behind explicitly. `behind > 0` or a conflict is a change-level finding; then check whether the base changed files this PR also touches, where a conflict-free merge can still break logic.

For cross-fork PRs, compare the base against the qualified head owner/ref rather than assuming both refs belong to one repository.

## CLI fallback

Use these only when `gh` is available; an integration or API returning equivalent fields is equally valid.

```bash
gh pr view <n> --repo <owner>/<repo> --json title,body,author,files,commits,reviews,comments,mergeable,mergeStateStatus,baseRefName,headRefName,headRepositoryOwner
gh pr diff <n> --repo <owner>/<repo>
gh pr checks <n> --repo <owner>/<repo>
gh api repos/<owner>/<repo>/compare/<base>...<head> --jq '{ahead: .ahead_by, behind: .behind_by}'
```

`gh pr view` provides conversation context but not reliable review-thread resolution. Use an integration or GitHub GraphQL/API capability for that field, or mark it unavailable.

If the available capability cannot retrieve a required field, mark it unavailable rather than inferring it.
