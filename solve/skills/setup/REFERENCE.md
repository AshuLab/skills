# Templates setup writes

Three pieces `setup` writes into the user's repo, so an agent opening it knows this repo uses the solve skills:

| Piece | Goes to | Loaded | Filled with |
|---|---|---|---|
| Block | the repo's `CLAUDE.md` / `AGENTS.md` (appended) | every session | verbatim |
| Flow | `docs/agents/solve-flow.md` | on demand, by whoever needs the whole picture; no skill reads it | verbatim - refresh it by re-running `setup` |
| Operations | `docs/agents/solve.md` | by the skills, every run | this repo's real values (step 5 of `setup`) |

The flow and the operations are separate files on purpose: skills read `solve.md` on every run for the tracker and branching commands, and shouldn't load the orientation they don't use.

**Naming rule:** in prose, always write "the solve skill set" / "solve skills" - never a bare "solve", which reads as the verb "to solve".
Claude Code invokes skills as `/solve:<name>` or `/follow:<name>`. The native Codex solve plugin uses `$solve:<name>`; follow's standalone Codex skills use `$<name>`. Tracker labels such as `solve:epic` stay as is.

## Block for the repo's CLAUDE.md / AGENTS.md

Append to whichever exists, resolving symlinks first (`setup` step 5 has the rule).
Keep it **minimal** - it auto-loads every session: three short labelled lines, what it is, the tracker, the pointer.
Detail lives in `solve-flow.md` (the flow) and `solve.md` (tracker, branching, worktrees), not here.

```markdown
## solve skills

This repo uses the **solve** skill set - ideas ship through
`sharpen -> to-spec -> to-tickets -> ship -> land`, reaching for `tdd` /
`code-review` / `code-post` / `code-resolve` when they earn it.

**Tracker:** GitHub Issues via the `gh` CLI - work is labelled `solve:epic`,
`solve:ticket`, `solve:refined`.

**How it works here** - the flow, who does what, when to use each skill:
`docs/agents/solve-flow.md`. Tracker, branching and worktree operations:
`docs/agents/solve.md`.
```

## docs/agents/solve-flow.md

A summary (not a copy of the plugin README) of how work moves through the solve skills in this repo, in flowing prose (one line per paragraph, not hard-wrapped).
Nothing here is repo-specific: write it as is. No skill reads it - it's for the human or agent who needs the whole picture. It's a copy, so it ages with the plugin; re-running `setup` refreshes it.

````markdown
# solve skills - the flow

This repo uses the **solve** skill set to take an idea from raw to shipped. Each step is a skill - invoke it however this agent invokes skills. The commands each step runs (tracker, branching, worktrees) are in `solve.md`.

## Where to enter
The entry point is what you already know, not whether it's a feature or a bug:
- the problem isn't clear (can't yet say what hurts, for whom, how you'd know it's fixed) -> `sharpen`; a fuzzy bug enters here too
- the problem is clear, the cause isn't (it misbehaves and you don't know why) -> `diagnose`
- both are clear, it's just work to cut -> `to-tickets`, or straight to `ship` if it's already one startable slice; if it came from outside (someone else's issue, a handed-down ticket) run `pre-check` first
- first time in this repo and you want worktree isolation -> `setup` (optional: without it github is inferred and there's one working tree)

## The flow
Each step consumes what the previous one left, so they run in order.

- `sharpen` - take a raw idea, doc or issue to a brief: reality-check + capture the thinking (grill it first with the follow skill `pushback` if it's raw)
- `to-spec` - turn the brief into a PRD, deciding where each story gets tested
- `to-tickets` - break the PRD into vertical, agent-ready slices
- `ship` - take a startable ticket to done: claim, build, close the loop (a PR).
  Handed the epic instead, it drains every slice in dependency order
- `land` - once you've read the integration PR and accept it: merge it, then close
  out the epic branch, its worktree and the epic issue. The step a human starts

## Reviewing
`ship` ends at a draft integration PR; a review pass sits between it and `land`. Nothing starts the review of the integration PR automatically: whoever is driving, a person or an agent, runs `code-review` on that PR.
Two sides, which may be different people or agents:
- reviewer - `code-review` reads the PR and returns findings (it never publishes); `code-post` delivers them as PR comments once approved
- author - `code-resolve` judges each comment on your own PR, fixes what applies, replies

Repeat until a review pass has no blockers; then the PR is ready for `land`. No round limit is enforced - if it isn't converging, bring a person in.

## Where a person is needed
- `sharpen` - a conversation; the product calls are the user's
- `to-spec` - the open questions that are about what the product should do, and the milestone
- `to-tickets`, `code-post`, `code-resolve` - the text is approved before it's published
- `land` - a person read the integration PR and accepts it
- `ship` - an epic drain runs unattended and stops at the draft integration PR; it also stops on a dirty tree, a failed slice or a merge conflict
- `setup` - a few questions, optional

When nobody can answer: `code-post`, `code-resolve` and `land` stop and hand over what they prepared instead of acting; `sharpen`, `to-spec` and `to-tickets` wait for the answer. An agent running unattended stops at those points - it doesn't answer for the person.

## Reach for these any time
- the follow skill `pushback` - stress-test an idea, plan or decision, nothing written (`sharpen` invokes it for a raw idea)
- `research` - external facts before you can decide; primary sources, findings saved in the repo
- `prototype` - a design question only code can answer; throwaway, the output is a decision
- `vocab` - pin down a term or record a hard-to-reverse decision (glossary + ADRs)
- `tdd` - the behavior is clear and a seam exists; also turns a `diagnose`-reproduced bug into a regression test
- `pre-check` - revalidate a spec or ticket that sat a while or came from outside, before it advances
- `guide` - not sure which skill fits; it points, it doesn't do the work

## Where things live
- PRDs / specs -> `docs/specs/`
- Glossary + ADRs -> `docs/glossary.md`, `docs/adr/` (always files)
- Tickets -> GitHub Issues

What each step leaves for the next: `sharpen` a brief in `docs/specs/` -> `to-spec` the PRD, published as the epic issue -> `to-tickets` one sub-issue per slice -> `ship` a PR per slice, then one draft integration PR -> `land` the merge.

````

## docs/agents/solve.md

The operations the skills resolve their verbs against, filled with the repo's real values, in flowing prose (one line per paragraph, not hard-wrapped).
The section names below (**Tracker operations**, **Branching**, **Worktrees**) are load-bearing: skills cite them by name (`solve.md` -> **Branching**). Rename none.

````markdown
# solve skills - operations

The commands the solve skills run in this repo: tracker, branching, worktrees.
The flow and who does what are in `solve-flow.md`.

## Tracker
Epics and tickets are GitHub Issues in `owner/name`, via the `gh` CLI. Labels: `solve:epic` (PRD) | `solve:ticket` (slice)
| `solve:refined` (fully defined, agent-ready). List them: `gh issue list --label solve:refined`.

### Tracker operations
- publish a slice -> `gh issue create --title "<title>" --body-file <ticket> --label solve:ticket,solve:refined --parent <epic> --blocked-by <n,n> --milestone <epic's, if any>`
  - `--parent` is the sub-issue link, `--blocked-by` the real dependency
- claim -> `gh issue edit <n> --add-assignee @me` (leave `solve:refined` as is)
- close the loop -> `gh pr create` with `Closes #<n>`; merging the slice + closing the issue is under **Branching** (the merge into the epic branch won't auto-close it)
- find a slice's epic -> `gh issue view <n> --json parent --jq .parent.number` (and
  `.parent.title` for the `<feature>` token)
- find the next startable slice of epic `<epic>` -> the lowest-numbered open `solve:refined`
  slice of that epic that's unassigned and has no OPEN blocker:
  ```
  gh issue list --label solve:refined --state open --limit 500 \
    --json number,assignees,blockedBy,parent \
    --jq "[.[] | select(.parent?.number == <epic>)
           | select((.assignees | length) == 0)
           | select(([(.blockedBy.nodes // [])[] | select(.state == \"OPEN\")] | length) == 0)]
          | sort_by(.number) | .[0].number // empty"
  ```
  Scoping to the epic isn't optional: unscoped, this spans every epic in the repo and a drain
  starts shipping another epic's slices into this one's branch. `--limit` matters for the same
  reason - the label query is server-side and defaults to 30, the epic filter runs after it.
  (If this install shipped the `ship` skill's `scripts/` directory, `solve-next-startable <epic>`
  runs exactly the above.)

## Branching
Merge-only - never squash or rebase; every slice's commits and PR stay in history.
First learn how THIS repo names branches - `git branch -a`, and any convention in
CONTRIBUTING / CLAUDE.md / AGENTS.md. Take the repo's branch **type** (`feat`, `fix`,
`chore`, ...; none at all -> `feature`, git's common default) and give each feature its
own **namespace** under it: the epic and its slices are siblings inside `<type>/<feature>/`,
so no branch is one the others nest under (git forbids a branch `x` and one under `x/`).
The tokens below are placeholders `setup` resolves, never literals to emit.
- **base branch** (`<base>`) - the epic branch is cut from here; the repo default
- **epic branch** (`<epic-branch>`) - one per feature: `<type>/<feature>/epic`; every slice integrates here
- **slice branch** (`<slice-branch>`) - `<type>/<feature>/<NNN-slug>`, a sibling of the epic in the same namespace
- **destination** (`<destination>`) - where the epic branch merges when done (default: `<base>`)

### Branching operations (substitute the names above - don't emit them literally)
- start the epic branch (lazy, first slice of the epic only) -> `git fetch && git switch -c <epic-branch> origin/<base> && git push -u origin <epic-branch>`
- branch a slice, **hub** (no open blocker, or several) -> `git switch <epic-branch> && git pull && git switch -c <slice-branch> && git push -u origin <slice-branch>` - the `git pull` isn't optional: slices merge server-side, so without it you cut from an epic branch missing every slice merged so far
- branch a slice, **stack** (exactly one open blocker) -> `git switch <blocker-branch> && git pull && git switch -c <slice-branch> && git push -u origin <slice-branch>` - its PR targets `<blocker-branch>`
- open a slice PR -> `gh pr create --base <epic-branch | blocker-branch> --head <slice-branch>` with `Closes #<n>`
- merge a slice -> `gh pr merge <pr> --merge` (merge commit; never `--squash` / `--rebase`), then `gh issue close <issue>` - the merge is into the epic branch, not default, so it won't auto-close
- retarget on a blocker's close -> list them with `gh pr list --base <blocker-branch> --json number --jq '.[].number'`, then for each: `gh pr edit <pr> --base <epic-branch>`
- delete a merged slice branch (**after** the retarget, never with `gh pr merge --delete-branch` - that fires on merge, before the retarget runs) -> confirm the merge landed first, remote ref against remote ref: `git fetch && git merge-base --is-ancestor origin/<slice-branch> origin/<the base it was merged into>` must succeed. That base is the epic branch for a hub slice, the blocker's branch for a stacked one - and both sides remote, because `gh pr merge` merges server-side and your local copy of the base doesn't have it yet. Then `git branch -d <slice-branch>` + `git push origin --delete <slice-branch>`. Don't rely on `-d` alone as the check: once the branch has an upstream, `-d` compares against that upstream rather than the base and will delete a branch whose merge never landed, warning but exiting 0
- integration PR (all slices closed) -> `gh pr create --base <destination> --head <epic-branch> --draft` with `Closes #<epic>` in the body - for a human; ship never merges it (the human's merge closes the epic only if `<destination>` is the default branch)
- land the epic (a human accepted the integration PR) -> `gh pr ready <pr>`, then `gh pr merge <pr> --merge`, then clean up in this order: `git worktree remove <path>` (it holds the epic branch, so it goes first), delete `<epic-branch>`, delete any leftover slice branch under `<type>/<feature>/*`, close `#<epic>` if the merge didn't. Every delete after `git fetch origin` + `git merge-base --is-ancestor origin/<branch> origin/<destination>` - run the `land` skill rather than these by hand

## Worktrees
**off** - `ship` works in the shared working tree by default. An explicit per-run
request ("worktree this epic"), or the pre-flight halt's `worktree` exit, still
isolates a single epic at the path below.
- **path** - `~/.solve/worktrees/<repo>/<feature>/`, `<feature>` the same token the
  epic branch uses
- **bootstrap** - `<command>` (omit when the ecosystem's obvious command applies -
  ship infers it from the lockfile)
- **linked config** - gitignored files the app needs to boot, symlinked into the
  worktree; name them, or "none". Never `node_modules`, build output or caches
- **cleanup** - `ship` names the path and the `git worktree remove` in the
  integration PR body; `land` removes it when it merges that PR
````

The **Worktrees** section **always carries a path** - `ship` needs a known home whether it makes the worktree automatically (*on*) or only when a run asks (*off*). Write the mode picked in step 4 with this repo's real values, `<feature>` the same token the branch pattern uses. The *on* variant is identical bar the first line:

```markdown
## Worktrees
**on** - each epic is drained in its own git worktree, so concurrent epics can't
collide in one tree. `ship` derives the path (never remembers it) and reuses the
worktree if it's already there.
- **path** - `~/.solve/worktrees/<repo>/<feature>/`, `<feature>` the same token the
  epic branch uses
- **bootstrap** - `<command>` (omit when the ecosystem's obvious command applies)
- **linked config** - gitignored files the app needs to boot, symlinked in; name
  them, or "none". Never `node_modules`, build output or caches
- **cleanup** - `ship` names the path and the `git worktree remove` in the
  integration PR body; `land` removes it when it merges that PR
```
