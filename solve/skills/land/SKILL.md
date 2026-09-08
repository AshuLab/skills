---
name: land
description: Merge a finished epic once a human has reviewed it - its integration PR in github mode, its epic branch with a local tracker - then close out everything the drain left open: the epic branch, its worktree, the epic issue, any slice branches still around. The counterpart to ship - ship carries the work to one reviewable thing, land puts it in. Invoked by a person who has read it and accepts the feature; it never decides that on its own.
---

# land - put the epic in

`ship` stops at one draft PR - the epic branch into its destination - because no agent gets to judge the feature delivered. `land` runs after a person does. **Invoking it is not that judgement** - it means someone wants the epic landed, not that the PR is good. Every gate in *Check first* runs anyway, and a failure there stops the run.

## The shape

```
<epic-branch>  --draft PR-->  <destination>
     |
     |   land, once a person has read it and accepts the feature:
     |
  Check first    1  still applies to destination   git merge-tree  (exit 0/1)
                 2  merge commits allowed           gh repo view  (stop if not - no squash)
                 3  it IS the integration PR        head=epic, base=destination
                 4  every slice closed              sub-issues empty / DoD boxes + suite
                 5  mergeable                       runs in Merge it - PR must be un-drafted first
     |
  -> show the plan, wait for a yes ->
     |
  Merge it       git switch+pull  ->  gh pr ready  ->  gate 5  ->  gh pr merge --merge
     |
  Close it out   worktree  ->  epic branch  ->  slice branches  ->  epic issue
                 prove each merged (origin vs origin) before removing it; no --force
```

**Local tracker:** no PR - the epic branch is the target. Only gates 1 and 4 apply; 2, 3 and 5 are `gh`-only, so say that rather than pretending to run them. *Merge it* is `git merge --no-ff` in place of `gh pr merge`.

**Run every command from the repo's main working tree, never from the epic's worktree** - it holds the epic branch, so switching to the destination and deleting that branch both fail from inside it. Can't leave it -> stop and say so rather than working around it. Gate 4's suite run is the sole exception: it needs the epic branch, read-only in that worktree or from a scratch export - gate 4 says how.

Read the tracker mode from `docs/agents/solve.md` -> **Tracker**, and branch names from its **Branching**. No such file: local mode, the repo's default branch as destination, and branch names `feature/<feature>/epic` + `feature/<feature>/<NNN-slug>` - *Close it out*'s slice sweep needs that pattern.

## What you were handed

An epic as a number, a branch, a PR URL, or just a feature name. Resolve it to the **integration PR**: `gh pr list --head <epic-branch> --state all --json number,state`.

- **Exactly one open PR** -> that's the target.
- **More than one** -> stop and ask which. Don't pick.
- **None open, one MERGED** -> the merge already happened. Skip *Merge it*, go to *Close it out* - the resume path for a run that died partway.
- **None open, one CLOSED unmerged** -> someone rejected it. Stop and say so - landing it is not your call.
- **None at all** -> nothing to land. Say so rather than guessing, and re-check the epic branch name you resolved.

**With a local tracker there is no PR** - the epic branch is the target. Already merged? `git fetch && git merge-base --is-ancestor origin/<epic-branch> origin/<destination>` succeeding means skip *Merge it*, go to *Close it out* - the resume path, and your local destination is exactly what's stale.

## Check first

Every one blocks the merge: report which failed and stop, never work around one. **In order 1 to 4** (or 1 then 4 in local mode) - they're cheapest-first, and each can make the rest pointless: 1 to 3 are a `merge-tree` and two `gh` calls, gate 4 reads every ticket and runs the suite twice. Gate 5 is the exception and runs later - it says why.

1. **It still applies to the destination.** Epics cut from the same base and never rebase, so a sibling that landed first collides here - not during either drain, both of which reported success. `git fetch`, then `git merge-tree --name-only origin/<destination> origin/<epic-branch>`: **exit 0 is clean, exit 1 is a conflict**, and the names it prints are the files - don't read stdout for the verdict, it prints a tree OID either way.
   **exit 1 with empty stdout and `not something we can merge` on stderr is neither** - a ref didn't resolve (a wrong `<destination>` or `<epic-branch>` from **Branching**, or a name the `git fetch` never created): re-check the names, don't report it as a conflict with no files.
   Conflict -> **stop, report those files**, and name the sibling that put them there: `git log --oneline origin/<epic-branch>..origin/<destination> -- <file>` (the range matters - the file's whole history names the shared base as culprit). Resolving another epic's overlap on the way in is a human's call; once they have, re-running `land` is cheap.
   **This gate's answer depends on when you ask** - it's a function of who landed first, not of this epic's quality; the same epic merges clean an hour earlier. Landing several at once: probe them all first, show the human the whole collision set, land the conflict-free ones before the rest.
2. **Merge commits are allowed.** `gh repo view --json mergeCommitAllowed`. Allowed -> proceed. Disallowed on the destination -> **stop**: this model keeps every slice's commits and merge history, and a squash or rebase merge discards it. That's a repo-config conflict for a human to fix, never something to work around by squashing. (`ship` gates on the same thing.)
3. **It's the integration PR** - head is the epic branch, base is the destination in **Branching**. A slice PR here would merge a fragment into the destination.
4. **Every slice is closed.** `gh issue view <epic> --json subIssues --jq '[.subIssues[] | select(.state == "OPEN")]'` must come back empty. Not `ship`'s `solve-next-startable` - it returns the next *startable* slice, so it prints nothing when the rest are blocked or assigned, exactly the halted drain this catches.
   **Local mode:** read the tickets **off the remote epic branch** - gate 1 already ran `git fetch`, so use `origin/<epic-branch>`: `git ls-tree --full-tree --name-only origin/<epic-branch> docs/tickets/<feature>/`, then `git show origin/<epic-branch>:<path>` each - and every Definition-of-done box must be `[x]`. The bare local ref is wrong here: `land` can be started from a clone that never checked the epic branch out, so it's missing or stale - the rest of `land` reads `origin/` for exactly this reason. Keep `--full-tree`: without it the pathspec is cwd-relative, and from a subdirectory you get an empty listing at exit 0 that reads as "all done". (Reading the branch is also what lets this run from the main tree - the tickets aren't on disk there.)
   Those boxes are the drain's claim about itself, and locally nothing else checks it. So **run the repo's test command against the epic branch yourself** - read-only in its worktree (no switch, no writes), or from `git archive origin/<epic-branch> | tar -x` into a scratch dir you delete after. Three outcomes:
   - **Green** -> proceed.
   - **Ran and failed** -> the boxes claim something untrue: stop. Unless the same tests fail on the destination too - then it predates the epic and belongs to the base's owner.
   - **Never ran** - broken script, missing runner, `MODULE_NOT_FOUND` - is not the second case even when it fails identically on both sides: it leaves the gate with no signal, worse than a red one. Invoke the suite directly, say which invocation you used, and report the broken script.
5. **Mergeable.** Doesn't run here - it needs a PR that isn't a draft, and `ship` left one that is; checking a draft always reports `mergeStateStatus: BLOCKED`, which would fail every healthy epic. It runs inside *Merge it*, right after `gh pr ready`.
   `gh pr view <pr> --json state,isDraft,mergeable,mergeStateStatus,statusCheckRollup,reviewDecision`. Require all of: `state` `OPEN`, `mergeable` `MERGEABLE`, `mergeStateStatus` `CLEAN`, `reviewDecision` not `CHANGES_REQUESTED`, every `statusCheckRollup` conclusion `SUCCESS` / `NEUTRAL` / `SKIPPED`. A red check is a stop, not a warning.

Then **show what you're about to do and wait for a yes**: the PR (or, local, the epic branch and its destination), the merge method, and every branch and worktree *Close it out* will delete - the merge is irreversible and public, and the invocation isn't consent for the specifics. No way to get an answer back -> stop and hand over the plan; never take silence as approval.

## Merge it

Nothing here runs before the yes.

**`git switch <destination> && git pull`** first, both modes: two people landing near-simultaneously get a non-fast-forward push rejection, and the fix is pull-and-retry, never force.

- **github:** `gh pr ready <pr>`, then **gate 5** against the now-ready PR, then `gh pr merge <pr> --merge` - a merge commit, never `--squash` or `--rebase`.
  Gate 5 failing here is the one stop after a public change - the PR is no longer a draft. Put it back with `gh pr ready --undo <pr>` before reporting, so the next run finds the state `ship` left.
- **local:** no PR, no gate 5 - `git merge --no-ff <epic-branch> -m "<message>" && git push`.

Into the repo's default branch, GitHub closes the epic issue on merge (`Closes #<epic>` is in the body); into a non-default branch it doesn't - *Close it out* step 4 handles that.

## Close it out

The drain's leftovers, **in this order** - each step unblocks the next. Three rules over all of it:

- **Prove it landed before removing anything.** `git fetch origin`, then `git merge-base --is-ancestor origin/<branch> origin/<destination>` - remote ref against remote ref, because either side can sit behind and the remote copy is the one you're deleting. Once for the epic branch before step 1, again per branch in steps 2 and 3. Everything here is irreversible, and the resume path walks straight in without having merged anything itself.
- **Never a flag that skips a refusal** - not `git branch -D`, not `git worktree remove --force`. Those refusals are the last thing between you and work that never landed. Note `git worktree remove` only refuses on a *dirty* tree - a clean worktree holding unmerged work goes without a murmur, which is why the check above comes first.
- **`<type>/<feature>/`** is the branch namespace from **Branching** (`feature/<feature>/` when there's no config).

**1. The worktree**, if the epic ran in one. First - it holds the epic branch checked out, and deleting that branch under it fails.
Act only on `git worktree list` - the sole authority for what exists on *this* machine. A path in the PR body or epic issue comment that it doesn't list is on another machine - report it, never remove it.
`git worktree remove <path>`. Refuses because the tree is dirty -> **leave it** and report what's uncommitted: something in there never reached the epic branch.

**2. The epic branch.**
On the resume path you may not be on the destination yet - `git switch <destination> && git pull` if so. Then `git branch -d <epic-branch>` + `git push origin --delete <epic-branch>`. A remote branch already gone (auto-delete-on-merge repos) is success, not failure.
Don't lean on `-d` as the check: with an upstream set it validates against that upstream, not the destination - it'll delete an unmerged branch with a warning but exit 0.

**3. Slice branches still around.** A halted drain, or a slice merged before `ship`'s *Close the loop* step 6 ran, leaves these.
**Scope to this epic's namespace and exclude the epic branch** - `git branch --merged <destination> --list '<type>/<feature>/*'` matches `<type>/<feature>/epic` too, and on a resumed run that's still there to be swept as a slice. Unscoped is worse: bare `git branch --merged <destination>` lists other epics' branches and **the destination itself**, which git lets you delete locally (the remote refuses, the local one doesn't).
Same ancestor check per branch, then delete local and remote. Anything not provably merged stays and gets reported.

**4. The epic issue**, if the merge didn't close it - the non-default-destination case.
Close it now, referencing the merged PR - the human invoking `land` plus the merge going through *is* the acceptance signal.
Local mode has no issue: set the spec's `Status` to `landed`, **and commit that on `<destination>`** - left uncommitted, the next `ship` reads that spec and commits this epic's status onto the *next* epic's branch. No spec at all (the epic came from tickets alone)? Nothing to mark - say so in the report rather than inventing a file.

## Report

What was merged, what was deleted, and - separately - **what you found and left alone**: worktrees on other machines or belonging to other epics, branches not provably merged, slices someone reopened.
**If gate 1 stopped you, this epic is what you left mid-air** - say so plainly: it still holds its worktree and both branches, nothing was deleted, and it lands unchanged once someone merges the new destination in or resolves the overlap. Name the conflicting files. Nothing on disk records the attempt.
Never clean up something outside this epic - another epic's worktree looks abandoned and is someone's drain in progress.
