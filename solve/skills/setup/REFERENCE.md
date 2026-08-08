# Templates setup writes

The agent-facing reference that `setup` writes, so an agent opening the user's
repo knows it uses the solve skills. Two pieces:

**Naming rule:** in prose, always write "the solve skill set" / "solve skills" -
never a bare "solve", which reads as the verb "to solve". The technical namespace
(`/solve:...`, `solve:epic`) stays as is.

## Block for the repo's CLAUDE.md / AGENTS.md

Append to whichever exists (never create the other). Keep it **minimal** - this
lands in a file the model auto-loads every session, so three short labelled lines:
what it is, the tracker, and the pointer. The detail (paths, `gh` usage, tracker
operations) lives in `solve.md`, not here. Use the variant that matches the
tracker; write only that one.

**local** tracker:

```markdown
## solve skills

This repo uses the **solve** skill set - ideas ship through
`sharpen -> to-spec -> to-tickets -> ship`, reaching for `tdd` / `code-review` when
they earn it.

**Tracker:** local markdown under `docs/tickets/`.

**How it works here** - where things live, the tracker operations, conventions:
`docs/agents/solve.md`.
```

**github** tracker:

```markdown
## solve skills

This repo uses the **solve** skill set - ideas ship through
`sharpen -> to-spec -> to-tickets -> ship`, reaching for `tdd` / `code-review` when
they earn it.

**Tracker:** GitHub Issues via the `gh` CLI - work is labelled `solve:epic`,
`solve:ticket`, `solve:refined`.

**How it works here** - where things live, the tracker operations, conventions:
`docs/agents/solve.md`.
```

## docs/agents/solve.md

A summary (not a copy of the plugin README), filled with the repo's real values,
in flowing prose (one line per paragraph, not hard-wrapped). There is no config
file - the **Tracker** section here declares the repo's mode, so write the block
for the mode this repo runs in. The template below is in **github** mode; for a
**local** repo, the Tracker section instead reads:

> ## Tracker
> This repo runs in **local** mode - epics and tickets are markdown files, no board.
>
> ### Tracker operations
> - publish a slice -> write `docs/tickets/<feature>/NNN-slug.md`; blockers as a
>   textual `Blocked by: NNN` line
> - claim -> just open the ticket file
> - close the loop -> tick every box in the ticket's **Definition of done** to
>   `- [x]`, then commit referencing the ticket
> - a slice is done -> every box in its Definition of done is `[x]`. There is no
>   board, so those boxes are the only completion signal - an unticked ticket reads
>   as not done, however finished the code is
> - find the next startable slice -> the lowest-numbered ticket that isn't done and
>   whose `Blocked by` slices all are
>
> ### Branching
> Same epic-branch / slice model as github, in plain git (no PRs). Merge-only, **no
> fast-forward** (`git merge --no-ff`), never squash or rebase - history keeps every
> slice. Epic branch off the base branch (lazy, first slice); each slice off the epic
> branch, or off its one open blocker's branch (stack); merge the slice into the epic
> branch on done; when all slices are done, merge the epic branch into the destination.

```markdown
# solve skills - how this repo uses them

This repo uses the **solve** skill set to take an idea from raw to shipped. Each
step is a skill; invoke it as `/solve:<name>`.

## The flow
New work enters at `/solve:sharpen` - even when it arrives already written, as an issue
or a doc. Each step consumes what the previous one left, so they run in order.

- `/solve:sharpen` - grill a raw idea, doc or issue until the problem holds; leaves a brief
- `/solve:to-spec` - turn the brief into a PRD, deciding where each story gets tested
- `/solve:to-tickets` - break the PRD into vertical, agent-ready slices
- `/solve:ship` - take a startable ticket to done: claim, build, close the loop (a PR).
  Handed the epic instead, it drains every slice in dependency order

Reach for `/solve:tdd` and `/solve:code-review` when they earn it, and
`/solve:guide` if you're unsure which skill fits.

## Feeds and on-ramps
- `/solve:diagnose` - a bug or performance regression you don't understand
- `/solve:research`, `/solve:prototype` - gather evidence to feed `sharpen`
- `/solve:pre-check` - revalidate a spec or ticket that sat a while
- `/solve:pushback` - just the grilling, on anything, with nothing written afterwards
- `/solve:vocab` - the glossary and ADRs (shared vocabulary)

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
- find the next startable slice -> open, `solve:refined`, unassigned, no open blocker,
  lowest number:
  `gh issue list --label solve:refined --state open --json number,assignees,blockedBy --jq '[.[] | select((.assignees|length)==0) | select(([.blockedBy.nodes[]|select(.state=="OPEN")]|length)==0)] | sort_by(.number) | .[0].number'`
  (`blockedBy` is a `{nodes, totalCount}` connection; a slice is unblocked when it
  has no `OPEN` node - closed blockers don't count)

## Branching
Merge-only - **never squash or rebase**; every slice's commits and PR stay in history.
- **base branch** -> `develop` - the epic branch is cut from here
- **epic branch** -> `solve/<feature>` - one per feature; every slice integrates here
- **slice branch** -> `solve/<feature>/<NNN-slug>`
- **destination** -> `develop` - where the epic branch merges once the feature is done

### Branching operations
- start the epic branch (lazy, first slice of the epic only) -> `git fetch && git switch -c solve/<feature> origin/develop && git push -u origin solve/<feature>`
- branch a slice, **hub** (no open blocker, or several) -> `git switch solve/<feature> && git switch -c solve/<feature>/<NNN-slug>`
- branch a slice, **stack** (exactly one open blocker) -> `git switch <blocker-branch> && git switch -c solve/<feature>/<NNN-slug>` - its PR targets `<blocker-branch>`
- open a slice PR -> `gh pr create --base <epic-branch | blocker-branch> --head <slice-branch>` with `Closes #<n>`
- merge a slice -> `gh pr merge <n> --merge` (merge commit; never `--squash` / `--rebase`), then `gh issue close <n>` - the merge is into the epic branch, not default, so it won't auto-close
- retarget on a blocker's close -> for each slice stacked on it: `gh pr edit <n> --base solve/<feature>`
- integration PR (all slices closed) -> `gh pr create --base develop --head solve/<feature> --draft` with `Closes #<epic>` in the body - for a human; ship never merges it (the human's merge closes the epic only if `develop` is the default branch)
```
