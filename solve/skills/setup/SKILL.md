---
name: setup
description: Configure where the solve skill set publishes work - local markdown (default) or a GitHub repo. Run once per repo. Detects your git remote, writes docs/agents/solve.md declaring the tracker mode, and (for GitHub) creates the solve labels. Skipping setup means local markdown, zero config.
---

# setup - pick the tracker, once

Run once per repo, and only if you want a remote tracker. No config file = local
markdown, zero setup.

## 1. Detect the repo

- `git rev-parse --is-inside-work-tree` - are we even in a repo?
- `git remote get-url origin` -> parse `owner/name`.
- One clear GitHub remote -> **state it and use it** ("detected `<owner/name>`,
  using it"); don't `AskUserQuestion`. A single detected repo is a one-option
  question - the tool rejects those, and it's no real choice anyway. Only ask when
  there's a real choice: multiple remotes, or a non-GitHub remote, offered via
  `AskUserQuestion`.
- Not in a repo -> ask for `owner/name` by hand, or bail.

## 2. Pick the tracker

Ask via `AskUserQuestion`: **local** (markdown under `docs/`) or **github**?
- local -> wire the reference (step 5); that's all.
- github -> continue.

## 3. GitHub prerequisites

- `gh auth status` - must be logged in, with **>= triage** permission on the repo
  (issue dependencies require it).
- **`gh` 2.94.0 or newer** - the release that added issue types, sub-issues and
  relationships (`--parent`, `--blocked-by`). Check `gh --version`; treat an older
  install as unsupported rather than working around it.
- **On GitHub Enterprise Server, check the server version too** - sub-issues need
  GHES 3.17+, but *relationships* (`--blocked-by`, which the whole dependency graph
  rests on) need **GHES 3.19+**. Under 3.19 the failure is quiet and lopsided:
  `--parent` works, `--blocked-by` doesn't, and you end up with slices that look
  published but carry no blocking edges. On a GHES host below 3.19, say so and use
  local mode instead of publishing a graph that isn't there.

## 4. Create the labels

Idempotent - re-run safe with `--force`:

```
gh label create solve:epic    --color 8957e5 --description "PRD / feature epic" --force
gh label create solve:ticket  --color 0969da --description "A vertical slice of an epic" --force
gh label create solve:refined --color 1a7f37 --description "Slice fully defined, agent-ready" --force
```

## 5. Wire the reference

There's no config file - the repo's tracker mode is declared in the reference you
write here. Plugin READMEs never reach the model, only skill descriptions do, so an
agent opening this repo won't know it uses the solve skills unless it's written
where Claude auto-loads it: the repo's context file.

- **Find the context file** - look for both `CLAUDE.md` and `AGENTS.md`. One is
  often a **symlink to the other** (a frequent setup is `CLAUDE.md -> AGENTS.md`,
  so they're one file under two names). Resolve any symlink to its real target
  (`realpath` / `ls -la`) and append the block to that real file, not the symlink
  - the harness can't write *through* a symlink. If a file already exists (or the
  symlink points to one), use it; never create the second. Append essentials + a
  pointer.
- If **neither** exists, ask via `AskUserQuestion` which to create - default
  `CLAUDE.md` (the Claude Code convention) - and create it: an H1 with the repo
  name, then the block.
- Write `docs/agents/solve.md`: a summary with this repo's real values. Its
  **Tracker** section declares the mode (github or local) - what the skills read
  instead of a config file - and its **Tracker operations** subsection is what they
  resolve their verbs against.
- Fill its **Branching** section with the repo's real values, not the template's
  defaults: the **base branch** (detect the remote's default - `git symbolic-ref
  refs/remotes/origin/HEAD`, or `gh repo view --json defaultBranchRef`), the **branch
  name pattern** (take the repo's branch type from `git branch -a` / CONTRIBUTING /
  CLAUDE.md / AGENTS.md - `feat`, `chore`, ...; none -> `feature` - and namespace each
  feature: epic `<type>/<feature>/epic`, slices `<type>/<feature>/<NNN-slug>`, siblings so
  neither nests under the other), and the **destination** (default: the base branch). This applies in both modes - the code
  lives in git either way. One git constraint on the pattern: the slice branch must be a
  **sibling** of the epic branch, never nested under it - git won't allow both a branch
  `x` and a branch `x/y`.

Both follow the templates in `REFERENCE.md` (next to this file).

## Projects v2 - not now

Sub-issues (`--parent`) and cross-ticket blocking (`--blocked-by`) are native `gh`
features; Projects v2 isn't needed and nothing in the flow depends on it.
