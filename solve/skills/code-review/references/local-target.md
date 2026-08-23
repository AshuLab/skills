# Local Git target

Acquisition guide for a local branch, optionally restricted to a file or directory.

## Required evidence

1. Confirm the working directory is a Git repository and capture staged, unstaged, and untracked state. Read every in-scope untracked file as a full addition; a filename from status is not reviewable evidence.
2. Resolve the actual base from repository configuration, remote default branch, branch history, or an existing PR. Do not silently assume `main` when the branch may come from a release branch.
3. Verify the base ref before analysis.
4. Collect commits since the merge base, the committed three-dot diff, staged diff, unstaged diff, and behind/ahead counts.
5. If a path was supplied, scope each diff to it without hiding change-level facts that affect that path.
6. Run the repository's documented validation when feasible and record the real result.

Bad ref or empty combined diff means stop and report it. An implausible base means ask instead of reviewing the wrong change.

## CLI fallback

These commands illustrate the evidence when Git is available; adapt them to the resolved base and scope.

```bash
git status --short
git rev-parse --verify <base>
git log --oneline <base>..HEAD
git diff <base>...HEAD [-- <path>]
git diff [-- <path>]
git diff --staged [-- <path>]
git ls-files --others --exclude-standard [-- <path>]
git rev-list --left-right --count <base>...HEAD
```

Open each listed untracked file or render it as a diff against an empty file. If that content is inaccessible, declare the local review incomplete.

Without a PR, intent evidence is weaker. Use referenced tickets, commit messages, or a discoverable PR body; if none independently states the request, follow the main skill's missing-spec rule.
