# epic-handoff

Status: spec
Source: AshuLab/skills#34

## Problem

`sharpen`, `to-spec` and `vocab` leave the epic's design artifacts (the spec, ADRs, glossary edits) as uncommitted files in the working tree where the person happened to be. `ship` only finds them if it runs in that same tree, where its *Clean the tree* step commits them as the first commit of the epic branch. An unattended orchestrator working from its own clone, another machine or another worktree never sees them. In a real unattended run the artifacts reached the epic branch only because the agent happened to look in the maintainer's main checkout and copy them by hand. Diego, the plugin's sole user today, is the one who hurts: he sharpens and specs in one place and wants an orchestrator elsewhere to run the epic. The only channel every machine shares is the remote, so the artifacts have to reach it, and nothing in the flow puts them there.

## Solution

The **hand-off** is the last step of `to-tickets`, not a new skill. It runs in the tree and session that just ran `to-tickets`, because the artifacts are untracked files that exist only where they were written. After the slices are published, `to-tickets` does the following, in order:

1. Finds the design artifacts using the classification `ship` already applies in *Clean the tree* (new untracked files in `docs/specs/`, `docs/adr/`, `docs/agents/`, and the created-or-modified `docs/glossary.md`). It does not invent a second classification.
2. Resolves `<feature>` by slugifying the epic issue's title once, or reads it back off the epic branch if that already exists, exactly as `ship` does. It never re-slugifies.
3. Cuts the epic branch with the documented *start the epic branch* operation from `docs/agents/solve.md` -> **Branching** (the `git fetch`, the explicit `origin/<base>`, the `git push -u`), not a hand-written `git switch -c`. With no `solve.md`, it uses `setup/REFERENCE.md`'s Branching operations, as `to-tickets` already does for tracker operations.
4. Commits the artifacts on that branch as its first commit, adding only those paths, and pushes.
5. Verifies the push: `git ls-remote` sees the branch and the commit.
6. Returns to the branch the person was on. The tree ends clean, and the epic branch is not left checked out where `ship` may need to create the epic worktree (git refuses a second checkout of the same branch).
7. If step 5 passed and the epic issue is still open, sets `solve:epic:ready`. If the label does not exist, the step reports it and points at `/solve:setup`; it does not create the label. The branch is already pushed at that point.

The step is idempotent. Branch absent: create it. Branch present with the artifacts: nothing to commit, set the label if it is missing. Branch present without the artifacts, or the artifacts already on the base branch: stop, say which, and wait. It never drags changes onto an existing branch and never skips silently. The happy path runs without a confirmation gate, because there is no text to review: the files were already approved at `to-spec` and `to-tickets`.

`ship` needs no change to find the branch: it already reuses an existing epic branch. *Clean the tree*'s artifact handling stays as the fallback for people who skip the hand-off, and its wording should acknowledge that the hand-off may already have run (branch exists with the artifacts, tree clean).

`setup` creates one new label, idempotent with `--force` like the others:

```
gh label create solve:epic:ready --color 0e8a16 --description "Epic ready to run: tickets defined, artifacts pushed" --force
```

The other three epic state labels (`solve:epic:running`, `solve:epic:needs-human`, `solve:epic:ready-for-test`) belong to the external orchestrator that reads `ready` and runs the epic. It already creates them if missing, and Solve never sets them, so `setup` does not create them. The `solve` README documents all four as part of the flow's vocabulary: names, and who sets each. Its current line saying that skipping `setup` makes the labels get created lazily needs to say `ready` is the exception.

## Scope

1. After `to-tickets` publishes the slices, the epic branch exists on the remote with the design artifacts as its first commit, whichever working tree is checked out afterwards.
2. The branch name is identical to the one `ship` would have produced for the same epic.
3. A later `ship` run from a fresh clone, with none of the original files on disk, finds that branch, reuses it, and does not re-commit the artifacts.
4. The artifacts never land on the base branch.
5. Re-running the step is safe in each case: branch absent, branch present with the artifacts, branch present without them (stop and report), artifacts already on the base (stop and report).
6. `solve:epic:ready` is set only after the push is verified and only on an open issue; setting it again is harmless; a missing label is reported, not created.
7. After the step, the person's tree is on the branch they started on and is clean of the artifacts.
8. `setup` creates `solve:epic:ready` with its colour and description, and is safe to re-run.
9. The `solve` README explains the four epic state labels and who sets each, and the hand-off step in the flow; `setup`'s reference and `to-tickets`'s own docs describe the new final step.
10. `ship`'s *Clean the tree* keeps working as a fallback for people who skip the hand-off.

## Decisions

- The hand-off lives inside `to-tickets` rather than in a new skill. A separate skill would be one more step people forget, and the failure is the same as today's. No new skill means nothing to add to the plugin manifests' `skills` arrays or to the README skill table.
- Only `solve:epic:ready` is created by `setup`; the three orchestrator labels stay the orchestrator's. Colour `0e8a16` and the description above are the issue's proposal, accepted.
- Missing label is a reported condition, not a lazy create. This departs from the README's general "labels get created lazily" line on purpose: the maintainer re-runs `setup` on every repo he uses.
- Artifact classification and branch operations are referenced from `ship` and `docs/agents/solve.md`, never restated, so the three places cannot drift.
- Plugin metadata: bump the `solve` version in `.claude-plugin/plugin.json` and `.codex-plugin/plugin.json` to the same number in the same commit, and add a `CHANGELOG.md` entry, per the repo's `CLAUDE.md`.
- Testing seams: this repo ships markdown skills and has no test infrastructure, so no story ships with automated tests. Verification is a manual end-to-end run on a scratch repo: run `to-tickets` through the hand-off, then from a fresh clone confirm `git ls-remote` shows the branch with the artifacts as its first commit, `ship` reuses it without re-committing, and the base branch has none of the artifacts. Re-run the step to exercise each idempotence case. This covers stories 1-7; stories 8-9 are checked by reading the diff and running the `setup` label command twice.

## Out of scope

Any change to how an orchestrator runs `ship`, reviews or fixes. Carrying artifacts through anything other than the remote (issue bodies, gists, a side branch). Changing the epic branch naming rules, which stay in `docs/agents/solve.md`. Creating `running`, `needs-human` or `ready-for-test` in `setup`. Removing *Clean the tree*'s artifact handling from `ship`. Creating the `ready` label lazily from `to-tickets`. Running the hand-off from a tree that does not hold the artifacts.
