# Templates setup writes

Two pieces `setup` writes into the user's repo, so an agent opening it knows this repo uses the solve skills.

**Naming rule:** in prose, always write "the solve skill set" / "solve skills" - never a bare "solve", which reads as the verb "to solve".
Claude Code invokes skills as `/solve:<name>` or `/follow:<name>`. The native Codex solve plugin uses `$solve:<name>`; follow's standalone Codex skills use `$<name>`. Tracker labels such as `solve:epic` stay as is.

## Block for the repo's CLAUDE.md / AGENTS.md

Append to whichever exists, resolving symlinks first (`setup` step 6 has the rule).
Keep it **minimal** - it auto-loads every session: three short labelled lines, what it is, the tracker, the pointer.
Detail (paths, `gh` usage, tracker operations) lives in `solve.md`, not here.
Write only the variant that matches the tracker.

**local** tracker:

```markdown
## solve skills

This repo uses the **solve** skill set - ideas ship through
`sharpen -> to-spec -> to-tickets -> ship -> land`, reaching for `tdd` /
`code-review` / `code-post` when they earn it.

**Tracker:** local markdown under `docs/tickets/`.

**How it works here** - where things live, the tracker operations, conventions:
`docs/agents/solve.md`.
```

**github** tracker:

```markdown
## solve skills

This repo uses the **solve** skill set - ideas ship through
`sharpen -> to-spec -> to-tickets -> ship -> land`, reaching for `tdd` /
`code-review` / `code-post` when they earn it.

**Tracker:** GitHub Issues via the `gh` CLI - work is labelled `solve:epic`,
`solve:ticket`, `solve:refined`.

**How it works here** - where things live, the tracker operations, conventions:
`docs/agents/solve.md`.
```

## docs/agents/solve.md

A summary (not a copy of the plugin README), filled with the repo's real values, in flowing prose (one line per paragraph, not hard-wrapped).
The **Tracker** section here declares the repo's mode - there is no config file - so write the block for the mode this repo runs in.
The template below is **github** mode; a **local** repo swaps two sections wholesale, **Tracker** (immediately below) and **Branching** (after it). Write one set or the other, never both - two Branching sections leave every `-> **Branching**` pointer in the skills ambiguous.
The rest of the template is written github-flavoured too. In local mode reword it as you go - **The flow**'s "close the loop (a PR)" and `land`'s "the integration PR", **Where things live**'s tickets line - so the file describes only what this repo actually does.

The local **Tracker** section reads:

> ## Tracker
> This repo runs in **local** mode - epics and tickets are markdown files, no board.
>
> ### Tracker operations
> - publish a slice -> write `docs/tickets/<feature>/NNN-slug.md` in the Ticket format
>   (see to-tickets); its `## Blocked by` line links each blocker's file relatively
>   (`[001](./001-slug.md)`)
> - claim -> just open the ticket file
> - close the loop -> tick every box in the ticket's **Definition of done** to
>   `- [x]`, then commit referencing the ticket
> - a slice is done -> every box in its Definition of done is `[x]`. There is no
>   board, so those boxes are the only completion signal - an unticked ticket reads
>   as not done, however finished the code is
> - find the next startable slice -> the lowest-numbered ticket **in this feature's
>   directory** (`docs/tickets/<feature>/`, never across features) that isn't done and
>   whose `Blocked by` slices all are. Read them off the **epic branch** - that's where they
>   were committed, so from the base branch the directory doesn't exist and every ticket reads
>   as done: `git ls-tree --full-tree --name-only <epic-branch> docs/tickets/<feature>/`, then
>   `git show <epic-branch>:<path>` for each. Keep `--full-tree` or the pathspec is relative to
>   the current directory and comes back empty, exit 0. On the epic's **first** slice that branch
>   doesn't exist yet (`git rev-parse --verify <epic-branch>` fails) - read the working tree
> - find a slice's epic -> the `<feature>` is its parent directory name, and the epic is the
>   spec at `docs/specs/<feature>.md`. Take the `<feature>` token from that directory, never by
>   re-slugifying the spec's title - the two can disagree, and the directory is what the drain reads
>
In local mode the `## Branching` section further down is replaced too, and reads in full:

> ## Branching
> Same epic-branch / slice model as github, in plain git. Names follow the repo's
> convention (`git branch -a` / CONTRIBUTING / AGENTS.md / CLAUDE.md - its `<type>`; none ->
> `feature`), each feature namespaced so epic and slices are siblings:
> - **base** (`<base>`) - the repo's default branch
> - **epic branch** (`<epic-branch>`) - `<type>/<feature>/epic`
> - **slice branch** (`<slice-branch>`) - `<type>/<feature>/<NNN-slug>`
> - **destination** (`<destination>`) - where the epic branch merges when done; default `<base>`
>
> Merge-only, **never** squash or rebase - the history keeps every slice.
>
> ### Branching operations
> Same commands as github minus the PRs. A compound command that fails halfway still leaves
> the branch it created, so check the exit.
> - start the epic branch (lazy, first slice) -> `git fetch && git switch -c <epic-branch> origin/<base> && git push -u origin <epic-branch>`
> - branch a slice, **hub** -> `git switch <epic-branch> && git pull && git switch -c <slice-branch> && git push -u origin <slice-branch>` - the `git pull` isn't optional: without it you cut from a base missing every slice merged so far, and git still prints "up to date" because it hasn't fetched
> - branch a slice, **stack** (exactly one open blocker) -> `git switch <blocker-branch> && git pull && git switch -c <slice-branch> && git push -u origin <slice-branch>`
> - merge a slice -> `git switch <its base> && git merge --no-ff <slice-branch> -m "<message>" && git push` -
>   switch first, or you merge a branch into itself: `Already up to date.`, exit 0, nothing done.
>   `-m` so git never opens an editor and hangs an unattended drain
> - delete a merged slice branch -> confirm remote ref against remote ref:
>   `git fetch && git merge-base --is-ancestor origin/<slice-branch> origin/<its base>`. Then
>   `git switch <its base> && git pull`, `git branch -d <slice-branch>` + `git push origin --delete <slice-branch>`; never `-D`
> - land the epic -> `git switch <destination> && git merge --no-ff <epic-branch> -m "<message>" && git push`,
>   then delete the epic branch the same way
> - sweep leftover slice branches (after the epic branch is gone) ->
>   `git branch --merged <destination> --list '<type>/<feature>/*'`, dropping any `*/epic` entry,
>   then per branch `git fetch && git merge-base --is-ancestor origin/<branch> origin/<destination>` before
>   `git branch -d <branch>` + `git push origin --delete <branch>`
> - a ticket's state lives **on the epic branch**, not the base - read it with
>   `git show <epic-branch>:docs/tickets/<feature>/<NNN-slug>.md`

```markdown
# solve skills - how this repo uses them

This repo uses the **solve** skill set to take an idea from raw to shipped. Each
step is a skill - invoke it however this agent invokes skills.

## The flow
New work enters at `sharpen` - even when it arrives already written, as an issue
or a doc. Each step consumes what the previous one left, so they run in order.

- `sharpen` - take a raw idea, doc or issue to a brief: reality-check + capture the thinking (grill it first with the follow skill `pushback` if it's raw)
- `to-spec` - turn the brief into a PRD, deciding where each story gets tested
- `to-tickets` - break the PRD into vertical, agent-ready slices
- `ship` - take a startable ticket to done: claim, build, close the loop (a PR).
  Handed the epic instead, it drains every slice in dependency order
- `land` - once you've read the integration PR and accept it: merge it, then close
  out the epic branch, its worktree and the epic issue. The step a human starts

Reach for `tdd`, `code-review`, `code-post` and `code-resolve` when they earn it, and `guide` if you're unsure which skill fits.

## Feeds and on-ramps
- `diagnose` - a bug or performance regression you don't understand
- `research`, `prototype` - gather evidence to feed `sharpen`
- `pre-check` - revalidate a spec or ticket that sat a while
- the follow skill `pushback` - just the grilling, on anything, nothing written (sharpen recommends it for a raw idea)
- `vocab` - the glossary and ADRs (shared vocabulary)

## Where things live
- PRDs / specs -> `docs/specs/`
- Glossary + ADRs -> `docs/glossary.md`, `docs/adr/` (always files)
- Tickets -> GitHub Issues (github mode) or `docs/tickets/<feature>/` (local mode)

## Tracker
This repo runs in **github** mode - epics and tickets are GitHub Issues in
`owner/name`, via the `gh` CLI. Labels: `solve:epic` (PRD) | `solve:ticket` (slice)
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
**off** - `ship` works in the shared working tree.
```

The **Worktrees** section applies in both tracker modes. Write the variant picked in step 5: *off* is the block above, one line and nothing else; *on* looks like this, path filled with this repo's real values and `<feature>` the same token the branch pattern uses:

```markdown
## Worktrees
**on** - each epic is drained in its own git worktree, so concurrent epics can't
collide in one tree. `ship` derives the path (never remembers it) and reuses the
worktree if it's already there.
- **path** - `~/.solve/worktrees/<repo>/<feature>/`, where `<feature>` is the same
  token the epic branch uses
- **bootstrap** - `<command>` (omit the line entirely when the ecosystem's obvious
  command applies - ship infers that from the lockfile)
- **linked config** - gitignored files this repo actually has that the app needs to
  boot, symlinked into the worktree; list them by name, and write "none" when there
  are none rather than naming a file that doesn't exist. Never `node_modules`, build
  output or caches - those get installed or rebuilt per worktree
- **cleanup** - `ship` names the path and the `git worktree remove` in the
  integration PR body; `land` removes it when it merges that PR
```
