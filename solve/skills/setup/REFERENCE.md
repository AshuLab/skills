# Templates setup writes

Three pieces `setup` writes into the user's repo, so an agent opening it knows this repo uses the solve skills:

| Piece | Goes to | Loaded | Filled with |
|---|---|---|---|
| Block | the repo's `CLAUDE.md` / `AGENTS.md` (added or replaced per `setup` step 5) | every session | verbatim |
| Flow | `docs/agents/solve-flow.md` | on demand, by whoever needs the whole picture; no skill reads it | the template, adapted to what the user said is particular |
| Operations | `docs/agents/solve.md` | by the skills, every run | this repo's real values and particulars (step 5 of `setup`) |

The flow and the operations are separate files on purpose: skills read `solve.md` on every run for the tracker and branching commands, and shouldn't load the orientation they don't use.

**Naming rule:** in prose, always write "the solve skill set" / "solve skills" - never a bare "solve", which reads as the verb "to solve".
Claude Code invokes skills as `/solve:<name>` or `/follow:<name>`. The native Codex solve plugin uses `$solve:<name>`; follow's standalone Codex skills use `$<name>`. Tracker labels such as `solve:epic` stay as is.

## Block for the repo's CLAUDE.md / AGENTS.md

Add it to whichever exists, resolving symlinks first (`setup` step 5 has the rule).
Keep it **minimal** - it auto-loads every session: a few short labelled lines (what it is, the tracker, one pointer per file), one line per paragraph so it matches the prose around it.
Detail lives in `solve-flow.md` (the flow) and `solve.md` (tracker, branching, lane worktrees), not here.

```markdown
## solve skills

This repo uses the **solve** skill set - ideas ship through `sharpen -> to-spec -> to-tickets -> ship -> land`, reaching for `tdd` / `code-review` / `code-post` / `code-resolve` when they earn it.

**Tracker:** GitHub Issues via the `gh` CLI - work is labelled `solve:epic`, `solve:ticket`, `solve:refined`, `solve:raw`, `solve:epic:ready`.

**The flow** - how work moves, who does what, when to use each skill: `docs/agents/solve-flow.md`.

**Operations** - tracker, branching and lane-worktree commands: `docs/agents/solve.md`.
```

## docs/agents/solve-flow.md

A summary (not a copy of the plugin README) of how work moves through the solve skills in this repo, in flowing prose (one line per paragraph, not hard-wrapped).
Written from this template, adapted only to what the user said is particular about the repo; the rest is the same in every repo. No skill reads it - it's for the human or agent who needs the whole picture. It ages with the plugin; running `setup` again rewrites it.

````markdown
# solve skills - the flow

This repo uses the **solve** skill set to take an idea from raw to shipped. Each step is a skill - invoke it however this agent invokes skills. The commands each step runs (tracker, branching, lane worktrees) are in `solve.md`.

## Where to enter
The entry point is what you already know, not whether it's a feature or a bug:
- the problem isn't clear (can't yet say what hurts, for whom, how you'd know it's fixed) -> `sharpen`; a fuzzy bug enters here too
- the problem is clear, the cause isn't (it misbehaves and you don't know why) -> `diagnose`
- both are clear, it's just work to cut -> `to-tickets`, or straight to `ship` if it's already one startable slice; if it came from outside (someone else's issue, a handed-down ticket) run `pre-check` first
- first time in this repo and you want the labels up front, or a custom lane-worktree path or bootstrap -> `setup` (optional: without it github is inferred and the lane defaults apply; the repo needs a GitHub remote either way)

## The flow
Each step consumes what the previous one left, so they run in order.

- `sharpen` - take a raw idea, doc or issue to a brief: reality-check + capture the thinking (grill it first with the follow skill `pushback` if it's raw)
- `to-spec` - turn the brief into a PRD, deciding where each story gets tested
- `to-tickets` - break the PRD into vertical, agent-ready slices
- `ship` - take a startable ticket to done: claim, build, close the loop (a PR per slice, or a local merge commit when `solve.md` -> Slice delivery says `local`). Handed the epic instead, it drains every slice in dependency order. It works in the shared tree; a parallel batch builds its slices in up to 3 lane worktrees (`solve.md` -> Worktrees) that `ship` leaves standing and `land` removes. Two epics don't drain in one clone - use another clone for the second
- `land` - once you've read the integration PR and accept it: merge it, then close out the lane worktrees, the epic branch and the epic issue. The step a human starts

## Reviewing
`ship` ends at a draft integration PR; a review pass sits between it and `land`. Nothing starts the review of the integration PR automatically: whoever is driving, a person or an agent, runs `code-review` on that PR.
Two sides, which may be different people or agents:
- reviewer - `code-review` reads the PR and returns findings (it never publishes); `code-post` delivers them as PR comments once approved
- author - `code-resolve` judges each comment on your own PR, fixes what applies, pushes, replies on each thread and leaves a summary on the PR - unattended

Suggested loop: repeat until a review pass has no blockers, then the PR is ready for `land` (`land` has its own gates - no conflicts, every slice closed, a green suite, a clean mergeable PR and a human yes - so a repo that requires reviews stops at BLOCKED until they are in; on your own PR GitHub won't let you approve, so a solo review is comments only). No round limit is enforced - if it isn't converging, bring a person in.

## Where a person is needed
- `sharpen` - a conversation; the product calls are the user's
- `to-spec` - the open questions that are about what the product should do, and the milestone
- `to-tickets`, `code-post`, `file-issue` - the text is approved before it's published (`file-issue` publishes without waiting when `code-resolve` invokes it)
- `diagnose` - the diagnosis is shown and a person picks a fix before any code changes
- `land` - a person read the integration PR and accepts it
- `ship` - an epic drain runs unattended and stops at the draft integration PR; it also stops on a dirty tree, a failed slice, or a merge conflict that can't be resolved cleanly on the slice branch
- `setup` - a few questions, optional

When nobody can answer: `code-post`, `file-issue`, `land` and `diagnose` stop and hand over (or show) what they prepared instead of acting; `sharpen`, `to-spec` and `to-tickets` wait for the answer. An agent running unattended stops at those points - it doesn't answer for the person.

## Reach for these any time
- the follow skill `pushback` - stress-test an idea, plan or decision, nothing written (`sharpen` invokes it for a raw idea)
- `research` - external facts before you can decide; primary sources, findings saved in the repo
- `prototype` - a design question only code can answer; throwaway, the output is a decision
- `vocab` - pin down a term or record a hard-to-reverse decision (glossary + ADRs)
- `tdd` - the behavior is clear and a seam exists; also turns a `diagnose`-reproduced bug into a regression test
- `pre-check` - revalidate a spec or ticket that sat a while or came from outside, before it advances
- `file-issue` - you ran into something that isn't this task's job; write it up as one GitHub issue (labelled `solve:raw`) and keep working
- `guide` - not sure which skill fits; it points, it doesn't do the work

## Where things live
- PRDs / specs -> `docs/specs/`
- Glossary -> `docs/glossary.md` (index) and `docs/glossary/<topic>.md`; ADRs -> `docs/adr/README.md` (index) and `docs/adr/<topic>/` - topics are chosen by `vocab`, always files
- Tickets -> GitHub Issues

What each step leaves for the next: `sharpen` a brief in `docs/specs/` -> `to-spec` the PRD, published as the epic issue -> `to-tickets` one sub-issue per slice -> `ship` a PR per slice, then one draft integration PR -> `land` the merge.

````

## docs/agents/solve.md

The operations the skills resolve their verbs against, filled with the repo's real values, in flowing prose (one line per paragraph, not hard-wrapped).
How to fill it: replace the tokens `setup` resolves - `<base>`, `<destination>`, `<branch-type>`, `<epic-branch>` (`<branch-type>/<feature>/epic`), `<slice-branch>` (`<branch-type>/<feature>/<NNN-slug>`) and `<bootstrap>` (the Worktrees bootstrap) - with real values, and the placeholder `owner/name` (the tracker repo; if the user says the tracker follows `origin`, say that instead of naming a repo), never emitting them literally. Every other angle-bracket token stays exactly as written (`<feature>`, `<repo>`, `<NNN-slug>`, `<NNN>`, `<slug>`, `<n>`, `<pr>`, `<epic>`, `<path>`, `<blocker-branch>`, `<dir>`, ...): the skills fill them at run time (`<repo>` is the repository directory's name, so the Worktrees path survives a merge into another repo). Bootstrap and linked config follow `setup` step 4: drop the bootstrap bullet when there is none to write, and replace `none` with the files it names.
The section names below (**Tracker**, **Tracker operations**, **Slice delivery**, **Branching**, **Worktrees**) are load-bearing: skills cite them by name (`solve.md` -> **Branching**). Keep these names as they are.

````markdown
# solve skills - operations

The commands the solve skills run in this repo: tracker, branching, lane worktrees.
The flow and who does what are in `solve-flow.md`.

## Tracker
Epics and tickets are GitHub Issues in `owner/name`, via the `gh` CLI. Labels: `solve:epic` (PRD and integration PR) | `solve:ticket` (slice) | `solve:refined` (fully defined, agent-ready) | `solve:raw` (found along the way, not yet sharpened) | `solve:epic:ready` (on the epic: tickets defined, design artifacts pushed, ready to run). `refined` means the ticket's definition is complete, not that it's unblocked - blocking is tracked separately via `blocked-by` edges. List them: `gh issue list --label solve:refined`.

### Tracker operations
- publish a slice -> `gh issue create --title "<title>" --body-file <ticket> --label solve:ticket,solve:refined --parent <epic> --blocked-by <n,n> --milestone <epic's, if any>`
  - `--parent` is the sub-issue link, `--blocked-by` the real dependency
- file a raw issue (found along the way, not yet sharpened) -> `gh issue create --title "$(cat "<dir>/title")" --body-file "<dir>/body" --label solve:raw`
  - `<dir>` is the run's scratch dir (`mktemp -d`, owned by the skill). Write `title` and `body` into it with a file-write tool, never through the shell - no `echo`, `printf` or heredoc: a line equal to a heredoc's delimiter ends it and the rest runs - and reuse its literal path, quoted, in every call (shell variables don't persist between calls). `gh` reads the text from the files, so it's never typed into the command
  - if it fails because `solve:raw` doesn't exist (the repo never ran `setup`): create it with the `solve:raw` line from `SKILL.md` step 3, minus `--force`, then retry
- find a similar issue -> `gh issue list --state all --search "$(cat "<dir>/query")"` - `query` is 2-3 plain keywords written the same way, no `key:value` qualifiers like `is:` or `repo:`
- comment on an existing issue -> `gh issue comment <n> --body-file "<dir>/body"` - `<n>` digits only, from the match you were shown; `body` is written the same way
- claim -> `gh issue edit <n> --add-assignee @me` (leave `solve:refined` as is)
- close the loop -> `gh pr create` with `Closes #<n>`; merging the slice + closing the issue is under **Branching** (the merge into the epic branch won't auto-close it)
- find a slice's epic -> `gh issue view <n> --json parent --jq .parent.number` (and `.parent.title` for the `<feature>` token)
- find the next startable slice of epic `<epic>` -> the lowest-numbered open `solve:refined` slice of that epic that's unassigned and has no OPEN blocker:
  ```
  gh issue list --label solve:refined --state open --limit 500 \
    --json number,assignees,blockedBy,parent \
    --jq "[.[] | select(.parent?.number == <epic>)
           | select((.assignees | length) == 0)
           | select(([(.blockedBy.nodes // [])[] | select(.state == \"OPEN\")] | length) == 0)]
          | sort_by(.number) | .[0].number // empty"
  ```
  Scoping to the epic isn't optional: unscoped, this spans every epic in the repo and a drain starts shipping another epic's slices into this one's branch. `--limit` matters for the same reason - the label query is server-side and defaults to 30, the epic filter runs after it.

## Slice delivery
**github** - each slice travels as its own PR into its base, merged server-side with `gh pr merge`; every slice's PR stays in history.

## Branching
Merge-only - never squash or rebase; every slice's commits stay in history.
The branch type is `<branch-type>`. Each feature gets its own namespace under it: the epic and its slices are siblings inside `<branch-type>/<feature>/`, so no branch is one the others nest under (git forbids a branch `x` and one under `x/`).
- **base branch** (`<base>`) - the epic branch is cut from here
- **epic branch** (`<epic-branch>`) - one per feature; every slice integrates here
- **slice branch** (`<slice-branch>`) - a sibling of the epic in the same namespace (`<NNN>` the ticket number, `<slug>` from its title)
- **destination** (`<destination>`) - where the epic branch merges when done

### Branching operations
- start the epic branch (lazy, first slice of the epic only) -> `git fetch && git switch -c <epic-branch> origin/<base> && git push -u origin <epic-branch>`
- branch a slice, **hub** (no open blocker, or several) -> `git switch <epic-branch> && git pull && git switch -c <slice-branch> && git push -u origin <slice-branch>` - the `git pull` isn't optional: slices merge server-side, so without it you cut from an epic branch missing every slice merged so far
- branch a slice, **stack** (exactly one open blocker) -> `git switch <blocker-branch> && git pull && git switch -c <slice-branch> && git push -u origin <slice-branch>` - its PR targets `<blocker-branch>`
- open a slice PR -> `gh pr create --base <epic-branch> --head <slice-branch>` with `Closes #<n>`; a stacked slice targets `<blocker-branch>` instead
- merge a slice -> `gh pr merge <pr> --merge` (merge commit; never `--squash` / `--rebase`), then `gh issue close <issue>` - the merge is into the epic branch, not default, so it won't auto-close
- retarget on a blocker's close -> list them with `gh pr list --base <blocker-branch> --json number --jq '.[].number'`, then for each: `gh pr edit <pr> --base <epic-branch>`
- delete a merged slice branch (**after** the retarget, never with `gh pr merge --delete-branch` - that fires on merge, before the retarget runs) -> confirm the merge landed first, remote ref against remote ref: `git fetch && git merge-base --is-ancestor origin/<slice-branch> origin/<the base it was merged into>` must succeed. That base is the epic branch for a hub slice, the blocker's branch for a stacked one - and both sides remote, because `gh pr merge` merges server-side and your local copy of the base doesn't have it yet. Then `git branch -d <slice-branch>` + `git push origin --delete <slice-branch>`. Don't rely on `-d` alone as the check: once the branch has an upstream, `-d` compares against that upstream rather than the base and will delete a branch whose merge never landed, warning but exiting 0
- integration PR (all slices closed) -> `gh pr create --base <destination> --head <epic-branch> --draft --label solve:epic` with `Closes #<epic>` in the body - for a human; ship never merges it (the human's merge closes the epic only if `<destination>` is the default branch)
- land the epic (a human accepted the integration PR) -> `gh pr ready <pr>`, then `gh pr merge <pr> --merge`, then clean up in this order: `git worktree remove <path>` for each lane still standing, `git switch <destination> && git pull` (the drain may have left the epic branch checked out in the shared tree), delete `<epic-branch>`, delete any leftover slice branch under `<branch-type>/<feature>/*`, close `#<epic>` if the merge didn't. Every delete after `git fetch origin` + `git merge-base --is-ancestor origin/<branch> origin/<destination>` - run the `land` skill rather than these by hand

## Worktrees
An epic drains in the shared working tree. A parallel batch builds its slices in up to 3 **lane** worktrees, each at the path below with `<feature>` replaced by `<feature>--lane-<N>`.
- **path** - `~/.solve/worktrees/<repo>/<feature>/`
- **bootstrap** - `<bootstrap>`
- **linked config** - none
- **cleanup** - `ship` names each lane still standing, with its `git worktree remove`, in the integration PR body; `land` removes them when it merges that PR
````

The **Slice delivery** section carries one of two values, and **Branching operations** and the close-the-loop line in **Tracker operations** go with it. When the user chose `local`, the section reads:

```markdown
## Slice delivery
**local** - no slice PR exists and a slice branch is never pushed: each slice is merged into its base with a merge commit in the shared tree, and the epic branch is pushed after every merge. Issues, the epic branch and the integration PR stay on GitHub.
```

and **Branching operations** become the list below (**Tracker operations** swaps its close-the-loop line for: close the loop -> the slice's merge commit, then `gh issue close <issue>`; there is no slice PR):

```markdown
### Branching operations
- start the epic branch (lazy, first slice of the epic only) -> `git fetch && git switch -c <epic-branch> origin/<base> && git push -u origin <epic-branch>`
- branch a slice, **hub** (no open blocker, or several) -> `git switch <epic-branch> && git pull --ff-only && git switch -c <slice-branch>` - no push, the slice branch stays local; the `pull` keeps the epic branch current with what other clones pushed
- branch a slice, **stack** (exactly one open blocker) -> `git switch <blocker-branch> && git switch -c <slice-branch>` - the blocker's branch was never published, so there is nothing to pull
- merge a slice -> in the shared tree, clean: `git switch <base>` (for the epic branch also `git fetch && git pull --ff-only`), then `git merge --no-ff <slice-branch> -F <msg-file>` (never squash or rebase) - the message carries `Closes #<n>`, what shipped and verified; then `git push origin <epic-branch>` when `<base>` is the epic branch (refused as non-fast-forward -> stop, never force), then `gh issue close <issue>`
- delete a merged slice branch -> confirm the merge landed first: `git fetch && git merge-base --is-ancestor <slice-branch> origin/<epic-branch>` (the blocker's branch itself for a stacked slice merged into it), then `git branch -d <slice-branch>` - never `-D`, and there is no remote branch to delete
- integration PR (all slices closed) -> the same `gh pr create` as above
- land the epic -> the same as above
```


