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
- A recent `gh` - the `--parent` / `--blocked-by` flags are newer; if they fail,
  check `gh --version` and treat old installs as unsupported.

## 4. Create the labels

Idempotent - re-run safe with `--force`:

```
gh label create solve:epic   --color 8957e5 --description "PRD / feature epic" --force
gh label create solve:ticket --color 0969da --description "A vertical slice of an epic" --force
gh label create solve:ready  --color 1a7f37 --description "Ready to implement" --force
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

Both follow the templates in `REFERENCE.md` (next to this file).

## Projects v2 - not now

Sub-issues (`--parent`) and cross-ticket blocking (`--blocked-by`) are native `gh`
features; Projects v2 isn't needed and nothing in the flow depends on it.
