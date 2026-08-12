# Templates setup writes

The agent-facing reference that `setup` writes, so an agent opening the user's repo knows it uses the solve skills.
Two pieces:

**Naming rule:** in prose, always write "the solve skill set" / "solve skills" - never a bare "solve", which reads as the verb "to solve".
The technical namespace (`/solve:...`, `solve:epic`) stays as is.

## Block for the repo's CLAUDE.md / AGENTS.md

Append to whichever exists (never create the other).
Keep it **minimal** - this lands in a file the model auto-loads every session, so three short labelled lines: what it is, the tracker, and the pointer.
The detail (paths, `gh` usage, tracker operations) lives in `solve.md`, not here.
Use the variant that matches the tracker; write only that one.

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

A summary (not a copy of the plugin README), filled with the repo's real values, in flowing prose (one line per paragraph, not hard-wrapped).
There is no config file - the **Tracker** section here declares the repo's mode, so write the block for the mode this repo runs in.
The template below is in **github** mode; for a **local** repo, the Tracker section instead reads:

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
> - find the next startable slice -> the lowest-numbered ticket that isn't done and
>   whose `Blocked by` slices all are
>
> ### Branching
> Same epic-branch / slice model as github, but plain git (no PRs). Names follow the
> repo's convention (`git branch -a` / CONTRIBUTING / CLAUDE.md - its `<type>`; none ->
> `feature`), each feature namespaced: epic `<type>/<feature>/epic`, slices
> `<type>/<feature>/<NNN-slug>`, siblings. Merge-only, **no fast-forward** (`git merge
> --no-ff`), never squash or rebase - history keeps every slice. Epic branch off the base
> branch (lazy, first slice); each slice off the epic branch, or off its one open
> blocker's branch (stack); merge the slice into the epic branch on done; when all slices
> are done, merge the epic branch into the destination.

```markdown
# solve skills - how this repo uses them

This repo uses the **solve** skill set to take an idea from raw to shipped. Each
step is a skill; invoke it as `/solve:<name>`.

## The flow
New work enters at `/solve:sharpen` - even when it arrives already written, as an issue
or a doc. Each step consumes what the previous one left, so they run in order.

- `/solve:sharpen` - take a raw idea, doc or issue to a brief: reality-check + capture the thinking (grill it first with `/follow:pushback` if it's raw)
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
- `/follow:pushback` - just the grilling, on anything, nothing written (sharpen recommends it for a raw idea; needs the follow skill set)
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
- find the next startable slice -> run `${CLAUDE_PLUGIN_ROOT}/bin/solve-next-startable`
  (bundled with the plugin) - prints the lowest open `solve:refined` slice that's
  unassigned with no OPEN blocker, or nothing

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
- branch a slice, **hub** (no open blocker, or several) -> `git switch <epic-branch> && git switch -c <slice-branch> && git push -u origin <slice-branch>`
- branch a slice, **stack** (exactly one open blocker) -> `git switch <blocker-branch> && git switch -c <slice-branch> && git push -u origin <slice-branch>` - its PR targets `<blocker-branch>`
- open a slice PR -> `gh pr create --base <epic-branch | blocker-branch> --head <slice-branch>` with `Closes #<n>`
- merge a slice -> `gh pr merge <pr> --merge` (merge commit; never `--squash` / `--rebase`), then `gh issue close <issue>` - the merge is into the epic branch, not default, so it won't auto-close
- retarget on a blocker's close -> for each slice stacked on it: `gh pr edit <pr> --base <epic-branch>`
- integration PR (all slices closed) -> `gh pr create --base <destination> --head <epic-branch> --draft` with `Closes #<epic>` in the body - for a human; ship never merges it (the human's merge closes the epic only if `<destination>` is the default branch)
```
