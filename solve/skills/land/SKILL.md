---
name: land
description: Merge a finished epic once a human has reviewed it - its integration PR in github mode, its epic branch with a local tracker - then close out everything the drain left open: the epic branch, its worktree, the epic issue, any slice branches still around. The counterpart to ship - ship carries the work to one reviewable thing, land puts it in. Invoked by a person who has read it and accepts the feature; it never decides that on its own.
---

# land - put the epic in

`ship` stops at one draft PR - the epic branch into its destination - because no agent gets to judge the feature delivered. `land` runs after a person does.

**Invoking this skill is not that judgement** - it means someone wants the epic landed, not that the PR is good. Every gate in *Check first* runs anyway, and a failure there stops the run.

**Run every command from the repo's main working tree, never from the epic's worktree** - it holds the epic branch, so switching to the destination and deleting that branch both fail from inside it. Can't leave it -> stop and say so rather than working around it.
Gate 4's suite run is the sole exception: it needs the epic branch, which lives in that worktree. Read-only there, or from a scratch export - gate 4 says how.

Read the tracker mode from `docs/agents/solve.md` -> **Tracker**, and branch names from its **Branching**. No such file: local mode, the repo's default branch as destination, and branch names `feature/<feature>/epic` + `feature/<feature>/<NNN-slug>` - *Close it out*'s slice sweep needs that pattern.

## What you were handed

An epic as a number, a branch, a PR URL, or just a feature name. Resolve it to the **integration PR**: `gh pr list --head <epic-branch> --state all --json number,state`.

- **Exactly one open PR** -> that's the target.
- **More than one** -> stop and ask which. Don't pick.
- **None open, one MERGED** -> the merge already happened. Skip *Merge it*, go to *Close it out* - the resume path for a run that died partway.
- **None open, one CLOSED unmerged** -> someone rejected it. Stop and say so - landing it is not your call.
- **None at all** -> nothing to land. Say so rather than guessing, and re-check the epic branch name you resolved.

**With a local tracker there is no PR** - the epic branch is the target.
- Already merged? `git fetch && git merge-base --is-ancestor origin/<epic-branch> origin/<destination>` succeeding means skip *Merge it* and go to *Close it out*. Both sides remote: this is the resume path for a run that died partway, so your local destination is exactly what's stale.
- Of the gates below, **1 and 4** apply - 1 unchanged (pure git, and the one that catches a sibling epic), 4 in its local form. 2, 3 and 5 are `gh`-only: say so rather than pretending to run them. The confirmation always runs, and *Merge it* has the local merge sequence.

## Check first

Every one of these blocks the merge. Report which failed and stop - never work around one.
**In this order** - 1 to 4, or 1 then 4 in local mode; gate 5 is the exception and says why. They're ordered by cost, cheapest first, because each one can make the rest pointless: gates 1 to 3 are a `merge-tree` and two `gh` calls, while gate 4 reads every ticket and runs the suite twice. Reorder them and you spend all of that on an epic that was never going to merge.

1. **It still applies to the destination.** Epics cut from the same base and never rebase, so a sibling that landed first collides here - not during either drain, both of which reported success. `git fetch`, then `git merge-tree --name-only origin/<destination> origin/<epic-branch>`: **exit 0 is clean, exit 1 is a conflict** and the names it prints are the files. Don't read stdout for the verdict - it prints a tree OID either way.
   Conflict -> **stop and report those files**, and say which sibling put them there (`git log --oneline origin/<epic-branch>..origin/<destination> -- <file>` - the range matters, or you get the file's whole history and name the shared base as a culprit). Resolving another epic's conflict on the way in is a human's call; re-running `land` once they've rebased or resolved is cheap.
   **This is the one gate whose answer depends on when you ask.** It compares against `origin/<destination>` as it is right now, so the verdict is a function of who landed first, not of this epic's quality - the same epic merges clean an hour earlier. Landing several: probe them all before merging any, show the human the whole collision set, and land the conflict-free ones first, because after the first irreversible merge the rest have fewer options.
2. **Squash isn't forced.** `gh repo view --json mergeCommitAllowed,squashMergeAllowed`. One call, and it decides whether the merge is even the right shape - squashing collapses the epic's one-merge-commit-per-slice into a single commit, discarding the per-slice history. Disallowed on the destination -> say so now, before the expensive gates; accepting it is the human's call.
3. **It's the integration PR** - head is the epic branch, base is the destination in **Branching**. A slice PR here would merge a fragment into the destination.
4. **Every slice is closed.** `gh issue view <epic> --json subIssues --jq '[.subIssues[] | select(.state == "OPEN")]'` must come back empty. Not `ship`'s `solve-next-startable` - it returns the next *startable* slice, so it prints nothing when the remaining slices are blocked or assigned, exactly the halted drain this gate catches.
   **In local mode this gate still applies.** Read the tickets **off the epic branch** - `git ls-tree --full-tree --name-only <epic-branch> docs/tickets/<feature>/`, then `git show <epic-branch>:<path>` for each - and every Definition-of-done box must be `[x]`. Keep `--full-tree` - without it the pathspec is relative to your cwd, and from a subdirectory you get an empty listing at exit 0 that reads as "all done". (Reading the branch is what makes this work from the main tree at all: the tickets aren't on disk there.)
   Those boxes are a claim the drain wrote about itself, and locally nothing else checks it - gate 5's `statusCheckRollup` is the independent confirmation, and it's `gh`-only. So **run the repo's test command against the epic branch yourself** before merging. The epic branch is checked out in its worktree, not the main tree, so run it **there, read-only** - no switch, no writes - or from `git archive origin/<epic-branch> | tar -x` into a scratch dir you delete after.
   Three outcomes, not two. **Green** -> proceed. **Tests ran and failed** -> the boxes claim something untrue: a stop, unless the same tests fail on the destination too, in which case it predates the epic and belongs to whoever owns the base. **The command never ran at all** - a broken script, a missing runner, `MODULE_NOT_FOUND` - is not the second case even when it fails identically on both sides: it leaves this gate with no signal, which is worse than a red one. Invoke the suite directly instead, say which invocation you used, and report the broken script for the base's owner.
5. **Mergeable.** The one gate that doesn't run here: it needs a PR that isn't a draft, and `ship` left one that is. It runs inside *Merge it*, right after `gh pr ready` - checking a draft always reports `mergeStateStatus: BLOCKED`, which fails every healthy epic and teaches you to wave the gate through.
   `gh pr view <pr> --json state,isDraft,mergeable,mergeStateStatus,statusCheckRollup,reviewDecision`. Require all of: `state` `OPEN`, `mergeable` `MERGEABLE`, `mergeStateStatus` `CLEAN`, `reviewDecision` not `CHANGES_REQUESTED`, every `statusCheckRollup` conclusion `SUCCESS` / `NEUTRAL` / `SKIPPED`. A red check is a stop, not a warning.

Then **show what you're about to do and wait for a yes**: the PR (or, with a local tracker, the epic branch and its destination), the merge method, and every branch and worktree *Close it out* will delete - the merge is irreversible and public, and the invocation isn't consent for the specifics. No way to get an answer back -> stop and hand over the plan; never take silence as approval.

## Merge it

Nothing here runs before the yes.

**`git switch <destination> && git pull`** first, in both modes: two people landing near-simultaneously get a non-fast-forward rejection on push, and the fix is to pull and retry, never to force.
Then in github, `gh pr ready <pr>`, **gate 5 against the now-ready PR**, and `gh pr merge <pr> --merge` - a merge commit, never `--squash` or `--rebase`.
Gate 5 failing here is the one stop that happens after a public change: the PR is no longer a draft. Put it back with `gh pr ready --undo <pr>` before reporting, so the next run finds the state `ship` left.
With a local tracker there's no PR and no gate 5: `git merge --no-ff <epic-branch> -m "<message>" && git push`.

Into the repo's default branch, GitHub closes the epic issue on merge (`Closes #<epic>` is in the body); into a non-default branch it doesn't - *Close it out* handles that.

## Close it out

Now the drain's leftovers, **in this order** - each step unblocks the next.

Three rules over all of it:
- **Prove it landed before you remove anything.** `git fetch origin`, then `git merge-base --is-ancestor origin/<branch> origin/<destination>` - remote ref against remote ref, because either side can sit behind and the remote copy is the one you're deleting. **Run it once for the epic branch before step 1**, and again per branch in steps 2 and 3. Everything here is irreversible, and the resume path (already-merged -> skip *Merge it*) walks straight in without having merged anything itself.
- **Never a flag that skips a refusal** - not `git branch -D`, not `git worktree remove --force`. Those refusals are the last thing between you and work that never landed - and note `git worktree remove` only refuses on a *dirty* tree: a clean worktree holding unmerged work goes without a murmur, which is why the check above comes first.
- **`<type>/<feature>/`** is the branch namespace from **Branching** (`feature/<feature>/` when there's no config).

**1. The worktree**, if the epic ran in one. First, because it holds the epic branch checked out and deleting that branch under it fails.
Act only on `git worktree list` - the sole authority for what exists on *this* machine. A path in the integration PR body or the epic issue comment that it doesn't know is on another machine - report it, never remove it.
`git worktree remove <path>`. Refuses because the tree is dirty -> **leave it** and report what's uncommitted: something in there never reached the epic branch.

**2. The epic branch.**
On the resume path you may not be on the destination yet - `git switch <destination> && git pull` if so. Then `git branch -d <epic-branch>` + `git push origin --delete <epic-branch>`. A remote branch already gone - auto-delete-on-merge repos - is success, not a failure.
Don't lean on `-d` as the check: with an upstream set it validates against that upstream, not the destination, and deletes an unmerged branch warning but exiting 0.

**3. Slice branches still around.** A halted drain, or a slice merged before `ship`'s *Close the loop* step 6 ran, leaves these behind.
**Scope the enumeration to this epic's namespace, and exclude the epic branch itself** - `git branch --merged <destination> --list '<type>/<feature>/*'` matches `<type>/<feature>/epic` too, and on a resumed run that branch is still there to be swept as a slice. Unscoped is worse: a bare `git branch --merged <destination>` lists other epics' branches and **the destination itself**, which git will let you delete locally (the remote refuses, the local one doesn't).
Same ancestor check per branch, then delete local and remote. Anything not provably merged stays, and gets reported.

**4. The epic issue**, if the merge didn't close it - the non-default-destination case.
Close it now, referencing the merged PR - the human invoking `land` plus the merge going through *is* the acceptance signal.
Local mode has no issue: set the spec's `Status` to `landed`, **and commit that on `<destination>`** - left uncommitted, the next `ship` reads that spec and commits this epic's status onto the *next* epic's branch. No spec at all (the epic came from tickets alone, never through `to-spec`)? Then there's nothing to mark - say so in the report rather than inventing a file.

## Report

What was merged, what was deleted, and - separately - **what you found and left alone**: worktrees on other machines or belonging to other epics, branches that aren't provably merged, slices someone reopened.
**If gate 1 stopped you, this epic is what you left mid-air** - say so plainly: it still holds its worktree and both branches, nothing was deleted, and it lands unchanged once someone rebases it onto the new destination or resolves the overlap. Name the conflicting files. Nothing on disk records the attempt, so a later run learns none of this from the repo.

Never clean up something outside this epic - another epic's worktree looks abandoned and is someone's drain in progress.
