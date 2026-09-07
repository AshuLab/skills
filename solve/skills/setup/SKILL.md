---
name: setup
description: Configure how the solve skill set works in this repo - where it publishes (local markdown by default, or GitHub Issues) and whether ship isolates each epic in its own git worktree so concurrent epics don't collide. Run once per repo. Detects your git remote, writes docs/agents/solve.md declaring the tracker, branching and worktrees, and (for GitHub) creates the solve labels. Skipping setup means local markdown in a single working tree, zero config. The repo needs a git remote either way.
---

# setup - pick the tracker, once

Run once per repo - if you want a remote tracker, or worktree isolation so concurrent epics don't collide.
No config file = local markdown in a single working tree, zero setup.
Either way the repo needs a **git remote**: branches are pushed, bases are read from `origin/`, and every merge is verified against the remote ref before anything is deleted.
Every choice below: the harness's choice UI when available, prose otherwise.

## 1. Detect the repo

- `git rev-parse --is-inside-work-tree`, then `git remote get-url origin` -> parse `owner/name`.
- One clear GitHub remote -> **state it and use it** ("detected `<owner/name>`, using it"). Only ask when there's a real choice: multiple remotes, or a non-GitHub remote.
- A remote that isn't GitHub -> local tracker (step 2), and say so: the branch model still works, but there are no issues and no PRs.
- **No remote, or not in a repo** -> stop. Say what's missing rather than working around it.

## 2. Pick the tracker

Ask the user to choose **local** (markdown under `docs/`) or **github**.
- local -> skip the GitHub-only steps (3, 4) and go to worktrees + the reference (steps 5-6); that's all.
- github -> continue.

## 3. GitHub prerequisites

- `gh auth status` - must be logged in, with **>= triage** permission on the repo (issue dependencies require it).
- **`gh` 2.94.0 or newer** - the release that added issue types, sub-issues and relationships (`--parent`, `--blocked-by`). Check `gh --version`; treat an older install as unsupported rather than working around it.
- **On GitHub Enterprise Server, check the server version too** - sub-issues need GHES 3.17+; *relationships* (`--blocked-by`, which the whole dependency graph rests on) need **GHES 3.19+**. Below 3.19 the failure is silent and lopsided: `--parent` works, `--blocked-by` doesn't, and slices publish carrying no blocking edges. Below 3.19 -> say so and use local mode.

## 4. Create the labels

Idempotent - re-run safe with `--force`:

```
gh label create solve:epic    --color 8957e5 --description "PRD / feature epic" --force
gh label create solve:ticket  --color 0969da --description "A vertical slice of an epic" --force
gh label create solve:refined --color 1a7f37 --description "Slice fully defined, agent-ready" --force
```

## 5. Worktrees

Applies in both tracker modes - the code lives in git either way.

Ask whether `ship` should isolate each epic in its own **git worktree**. Three answers:
- **off** (default) - one shared working tree, today's behaviour. Recommend it unless they actually run epics concurrently: a worktree costs a dependency install and a set of symlinks every time.
- **on, default location** - `~/.solve/worktrees/<repo>/<feature>/`.
- **on, custom location** - take their path. Warn when it's inside the repo (`.worktrees/`): it needs a `.gitignore` entry, and any tool that walks the tree without honouring it - a loose jest glob, a wide `tsc` include, a watcher, a Docker build context - silently finds a second copy of the codebase and runs the suite twice.

In the *on* cases only, ask about **bootstrap**: a command a fresh worktree needs before it can run the app and the test suite. Leave it empty for the ecosystem's obvious one (`npm ci`, `go mod download`, ...) - `ship` infers that from the lockfile. Capture only the genuinely non-obvious: a `make setup`, a private registry that needs auth, a database that has to be seeded. Same for any gitignored file beyond `.env` the app needs to boot.

## 6. Wire the reference

There's no config file - the repo's tracker mode is declared in the reference you write here.

- **Find the context file** - look for both `CLAUDE.md` and `AGENTS.md`; one is often a **symlink to the other** (typically `CLAUDE.md -> AGENTS.md`). Resolve any symlink to its real target (`realpath` / `ls -la`) and append the block to that real file, not the symlink - some tools replace the link with a regular file. If either already exists (or the symlink points to one), use it; never create the second. Append essentials + a pointer.
- If **neither** exists, ask which to create. Default to `AGENTS.md`, the provider-neutral convention, and create it with an H1 containing the repo name followed by the block.
- Write `docs/agents/solve.md`: a summary with this repo's real values. Its **Tracker** section declares the mode (github or local); its **Tracker operations** subsection is what the skills resolve their verbs against.
- Fill its **Branching** section with the repo's real values, not the template's defaults. Applies in both modes:
  - **base branch** - the remote's default. `git symbolic-ref refs/remotes/origin/HEAD` only works if the repo was cloned; otherwise `git remote show origin` reports it, and `gh repo view --json defaultBranchRef` works on GitHub. `git remote set-head origin -a` fixes the first for later runs
  - **branch name pattern** - the repo's branch type from `git branch -a` / CONTRIBUTING / CLAUDE.md / AGENTS.md (`feat`, `chore`, ...; none -> `feature`), namespaced per feature: epic `<type>/<feature>/epic`, slices `<type>/<feature>/<NNN-slug>` - siblings, never nested, because git won't allow both a branch `x` and a branch `x/y`
  - **destination** - default: the base branch
- Fill its **Worktrees** section from step 5: *off*, or the resolved path template plus the bootstrap command and any extra linked files. Use the same `<feature>` token the branch pattern uses - `ship` derives the path from it on every run, and a differently-slugified token breaks the reuse.

Both follow the templates in `REFERENCE.md` (next to this file). Resolve every either/or hedge ("GitHub Issues (github mode) or `docs/tickets/`") to the value this repo uses - never ship the hedge.

Then **commit them** - they're the repo's config, not anyone's feature work.
