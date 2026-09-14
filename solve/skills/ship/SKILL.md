---
name: ship
description: Take a startable ticket - or a whole epic - and carry it to done - claim it, build it, close the loop. Hand it one slice and it runs that slice's lifecycle; hand it the epic and it drains every slice in dependency order, unattended. It does not dictate how you code - the model, or a skill you pass in, does that - ship owns the edges.
---

# ship - take a ticket to done

`ship` owns the **edges** - claim the ticket, close the loop; *Build it* says where your coding skill goes.

## The shape

One feature, one epic branch, and **exactly one PR a human reviews** at the end:

```
<base>
 |
 +- <epic-branch>                  one per feature, cut lazily on the first slice
     |
     +- <slice-001>   hub    - cut off the epic branch
     +- <slice-002>   hub    - cut off the epic branch
     +- <slice-003>   stack  - cut off 002 while 002 is still open, so it starts early
     |
     |    each slice: own PR -> merge into ITS BASE -> close issue -> delete branch
     |    base = the epic branch, or the blocker's branch for a stacked slice
     |    a stacked slice's PR retargets to the epic when its blocker closes
     |
     +- every slice closed -> ONE draft PR: <epic-branch> -> <destination>
                              a human reviews it, then `land` merges it; ship never does
```

**A drain only ever produces hub slices** - it picks the next slice with no open blocker. The stack above is for when `ship` is handed slice 003 directly while 002 is still open; never go hunting for a blocked slice mid-drain.

**Two epics can drain at once, and two properties are what keep them apart:** every branch is namespaced `<type>/<feature>/`, and **a drain never pushes the base branch** - `ship` stops at the integration PR precisely because merging it is `land`'s job. Break either one and concurrent drains collide on every push. What isolation does *not* buy you is content: sibling epics branch from the same base and never rebase, so two of them editing the same files conflict at integration, not during the drain. Each drain reports success and the conflict is `land`'s to surface.

Slice PRs are the working record - small, linked to their ticket, merged as they land. The integration PR is the *review surface*: the whole feature, design artifacts included, as one diff.

Everything repo-specific - tracker, branch names, worktrees - comes from `docs/agents/solve.md`, written once by `setup`. **No such file** means the repo never ran `setup`; defaults: local tracker (markdown tickets under `docs/tickets/<feature>/`), worktrees off, `origin`'s default branch as base and destination, branch names `feature/<feature>/epic` and `feature/<feature>/<NNN-slug>`. Say so once and carry on - don't stop, don't write a config file. A repo with no remote is the one thing to stop on: the whole branch model pushes.

## One ticket, or the whole epic

Check what you were handed:
- **a ticket (a slice)** - run the lifecycle below once, on it.
- **an epic** - *drain* it: run that same lifecycle on every slice, in dependency order, unattended (AFK). Which slice comes next and when to stop is in **Draining an epic** at the end.

## Delegate the build

*Claim it* and *Build it*, plus *Close the loop*'s steps 1-3, run inside a subagent, launched fresh for each slice - not inline in the draining agent's own session. *Pick the tree* and *Clean the tree, cut the epic branch* stay outside that scope: the draining agent runs them once, before the first slice of a drain dispatches, and hands the subagent the ticket handle, the epic's `<feature>` token, and the tree already resolved for it - the subagent builds there, it never re-decides the drain's worktree strategy.
This holds for every slice, one ticket or a whole drain: the subagent claims the slice, builds it, commits, pushes and opens the PR (steps 1-3), then stops - it never merges, never closes the issue, never deletes a branch.
The subagent hands back a close-out report, nothing else - the draining agent reads only this, never the subagent's own transcript or tool history, and acts on it to run *Close the loop*'s steps 4-6 (merge, close the issue, delete the branch):

```
{
  slice: <ticket handle>,
  outcome: "ready-to-merge" | "stopped",
  branch: <pushed slice branch name>,
  pr: <PR reference (github) | ticket path (local)>,
  definitionOfDone: { <box>: boolean, ... },
  reason?: <string, present when outcome is "stopped" - what would close it>,
  note?: <string, present whenever there's something to surface regardless of outcome - e.g. *Close the loop*'s "the repo arrived broken, not your slice's fault" case, which still needs to reach a human between drains>
}
```

`outcome: "stopped"` is the subagent's report of *Close the loop*'s stop condition - the draining agent doesn't re-verify the definition of done itself, it halts on the report and reads `reason` for what would close it.

## Claim it

Claim the ticket before any git, so no one doubles up - the *claim* operation in `docs/agents/solve.md` -> **Tracker operations**.
In github that self-assigns. **Leave `solve:refined` on**, here and after close - it means "fully defined", not "untaken": `blocked-by` says what's startable, the assignee says who has it.
In local there's no board, so claiming is just opening the ticket file - and *nothing records it*. Two runs pointed at the same local epic will both build every slice; the drain's "unclaimed" test has nothing to read. If concurrency matters here, one epic per run is the only guarantee, and github mode is where claiming is real.

Read the ticket + its linked spec section before touching code.

## Pick the tree

**Resolve where you're working before you touch a branch** - building wherever you're standing is the mistake when another epic is already in flight there.

**Pre-flight, every mode:** `git status --porcelain` before you touch anything. One thing is expected and passes: the solve hand-off artifacts - new **untracked** files in `docs/specs/`, `docs/tickets/`, `docs/adr/` or `docs/agents/`, and a created-or-modified `docs/glossary.md` - that's `sharpen`/`to-spec`/`to-tickets`/`vocab` leaving their output for you, and *Clean the tree* commits it to the epic branch. **Anything else** - a modified tracked file, an untracked file outside those paths - is working state you can't account for: your own from an earlier run, or another drain in that tree right now. **Stop and surface it:** list the paths and offer the exits - commit it, stash it, or `worktree` to isolate this epic (which leaves the shared tree's dirt untouched). Don't sort it into "mine" and route around it - you can't tell from git whose it is, and *Clean the tree* downstream folds whatever's loose onto your epic branch. The worktree is an exit the human picks, not one you take to skip the question; an AFK drain with no one to answer just stops. This is a start-of-run gate - a drain's own later slices leave the tree dirty by design, and that's fine.

Read **Worktrees** in `docs/agents/solve.md`.
*Off* or absent -> the shared tree - **unless this run was told to isolate this epic** (the invoker asked up front, or the pre-flight halt was answered `worktree`). That request is honoured in any mode: [WORKTREES.md](./WORKTREES.md) at the configured path (none configured -> `~/.solve/worktrees/<repo>/<feature>/`) - reuse the epic's worktree if it's already there, otherwise create it. No such request -> skip the rest.

*On* -> take the first row of the table that matches, top to bottom:

| Situation | Tree |
|---|---|
| The epic already has a worktree | Reuse that one |
| Draining a whole epic | Create one |
| A single slice, nothing else in flight | The shared tree |
| A single slice, something else in flight | Create the epic's |

**One per epic, never per slice.**
*Something else in flight* is three checks, any one enough: `git worktree list` shows another epic's worktree, the current branch carries another epic's `<feature>`, or `git status` is dirty (the pre-flight already stops on a dirty tree - this is the backstop for a run that reached here regardless). It doesn't matter whether that's your own earlier state or another run happening right now - either way the shared tree isn't yours alone, and the answer is the same.
**Treat all three as a floor, never as proof of the opposite.** They're a snapshot, and another run can start between the check and your next command, so a clean read doesn't mean nothing is in flight - it means nothing was, a moment ago. Anything you find that isn't yours, leave alone: don't switch to its branch, don't remove its worktree, don't stash its work.
While draining, never ask: decide from those checks and report which tree you took.

**A parallel batch (*Draining an epic*) adds one exception to "one per epic, never per slice"**: up to 3 lane worktrees, in addition to - not instead of - the epic's own worktree from the table above. A lane isn't tied to one slice - it's a slot, created once and reused round after round for as long as the drain keeps dispatching, parked (not removed) between occupants. This applies only while the drain is in a github-mode epic; every row in the table above, and the one-per-epic rule itself, is otherwise unchanged for sequential drains and local mode. [WORKTREES.md](./WORKTREES.md) has the path and the mechanics.

Create it **here**, before the checks below - they run on the tree you'll work in.

Dirty shared tree when you go to create the worktree? The pre-flight already surfaced it and the human (or invoker) chose isolation, so what's here is **yours** - **only that carries across.** A run could still have started since the pre-flight, though: another may be mid-slice in that tree, and stashing its work moves it out from under them and commits it onto your epic branch. Anything you didn't create: **stop the whole run**, not just this step - report what's there and end. Don't stash it, and don't create the worktree and carry on either: a fresh worktree *is* clean by construction, so proceeding feels safe and is the workaround this forbids. It also leaves an epic branch a later run reads as a live claim.
Nothing on disk will record that you stopped, so your report is the only trace. Say what's dirty, that it isn't yours, and that the drain resumes once whoever owns it commits or drops it.
Work that *is* yours goes across stashed **by path**, before you create - order and paths both matter, and getting either wrong loses work: *Carrying loose work across* in [WORKTREES.md](./WORKTREES.md). Read that file before creating one - it also holds the derived path, the reuse check, symlinked config and dependency install.

## Clean the tree, cut the epic branch

**The tree you picked must be clean.**
A worktree you just created is clean by construction; the shared tree you check with `git status`. That's about *this* tree being fit to work in - it does not settle anything left in the shared tree, which *Pick the tree* already ruled on. Uncommitted work sorts into four cases, all of it yours:
- **belongs to a slice** -> commit it in that slice's normal flow, once its branch exists (*Build it*). Until then it rides along in the stash from *Pick the tree* - never leave it loose in the shared tree while you go work somewhere else.
- **epic-level design artifacts** -> the output of `sharpen`/`to-spec`/`vocab` (spec, ADR, glossary edits, local ticket files): they belong to the epic, to no single slice. Create/switch to the **epic branch first** (*Build it*'s lazy logic) and commit them there as its first commit - **never on the base branch**, where they'd sit in the base of every PR and no diff would ever surface them. In a worktree they arrived stashed (*Pick the tree*): `git stash pop`, then commit as above.
- **the repo's own config** -> `AGENTS.md` / `CLAUDE.md` and `docs/agents/solve.md`, if `setup` just wrote them and left them uncommitted. Commit those to the **base** branch - they describe the repo, not this feature.
- **neither** -> your own stray, unrelated work - stash it (`git stash -u`). Someone else's is not this case; it stopped the run back at *Pick the tree*.
Cut the epic branch with the **start the epic branch** operation from `docs/agents/solve.md` -> **Branching**, exactly as written, not a `git switch -c` you compose yourself. It carries three parts you can't drop: the `git fetch`, the explicit `origin/<base>` (without it you cut from wherever HEAD is), and the `git push -u` (github can't open a PR against a base that only exists locally, and every later merge check reads `origin/`).
Never switch to an **existing** branch carrying changes that don't belong there - the switch either fails or silently drags them onto it. (Cutting the epic branch to carry the artifacts, above, is the deliberate exception.)

If there's distance - time passed, or the ticket isn't fresh from your own `to-tickets` - run `pre-check` first: it rechecks the slice still applies and its labels/milestone are in order. Skip it when you just cut the slice and are building now.

## Build it

**The integration model is fixed even where the names aren't.**
Every feature gets one **epic branch**, cut from the repo's base branch the first time a slice of that epic ships and reused after - lazily: not there yet, create it with **start the epic branch** (push included); otherwise switch to it. *Clean the tree* may have already cut it to carry design artifacts.
The slice's own branch comes off one of two places, and the `blocked-by` graph decides:
- **no open blocker, or several** -> off the **epic branch** (the hub).
- **exactly one open blocker** -> off **that blocker's branch** (the stack), so you build on its code instead of waiting for it to land; its PR targets the blocker for now, and retargets when the blocker closes (*Close the loop*).

Bases and names all resolve from `docs/agents/solve.md` -> **Branching**, never hard-coded here; branch names must be git-safe: lowercase, hyphens, no spaces or special characters.
`<feature>` is the epic's token, decided **once**: on the epic's first slice take it from the tickets' directory name (`docs/tickets/<feature>/`) in local, or slugify the epic issue's title in github; from then on read it back off the epic branch name. Never re-slugify - not per slice, not from a spec title that may not match the directory - or the same epic becomes `payments-api` one run and `payments_api` the next: two epic branches, and a worktree that stops finding itself.
Handed a slice and you need its epic - the number for `Closes`, the title for the token - the *find a slice's epic* operation is in `docs/agents/solve.md` -> **Tracker operations**.

*How* you code is the middle, and not ship's: by default you just build it; if there's a specialized skill for this work - one you pass in, one the repo standardizes, or `tdd` at the seam the spec named for testing this story - invoke it here. Either way the ticket's **definition of done** is the contract: every box green before you close, and don't gold-plate - reuse before building, write the least code that meets the done, nothing speculative.

## Close the loop

Steps 1-3 run inside the subagent (*Delegate the build*); steps 4-6 run in the draining agent, off that subagent's report alone. Read this section as one continuous lifecycle regardless of which side runs which step - the split is who executes it, not what it means.
Before step 4, the draining agent runs one sanity check on the report itself, not a re-run of steps 1-3's own checks: `git fetch` and confirm `origin/<branch>` exists, and that the ticket's Definition of done boxes read `[x]` in that branch's copy of the file. A report that doesn't hold up here is treated as `outcome: "stopped"` - name the mismatch and halt, don't merge on faith.
Verify the definition of done first: the repo's static checks if it has any, the full suite, and the tests at the agreed seam - the place the spec named for testing this story. No spec ever named one (a ticket that didn't come from `to-tickets`, or a repo with no `docs/specs/`)? Say so and test at the obvious seam for the change instead of ticking a box against nothing.
If it doesn't pass - test failure, typecheck error, a design gap - **stop**: don't mark it done, don't skip it, don't force a fix that isn't real. Report the blocker and what would close it (a fix, a decision, merging the base in). This holds carrying one ticket or draining an epic (draining just decides the rest of the queue, below).
**First find out whether you broke it.** Run the same check against the base branch **without touching any tree** - `git fetch origin <base>` (a long drain's `origin/<base>` is stale), then `git archive origin/<base> | tar -x -C <a scratch dir>`, run it there and delete it. Don't switch branches to find out: you may be standing in a tree you're not allowed to disturb, and that's precisely when this question comes up. Green on the base and red here means it's yours, and the rule above applies. Red on both means the repo arrived broken - a wrong test command, a missing dep, an unrelated failure - and that is **not** your slice's blocker. Report it, say it predates you, and carry on. **Don't fix it - not in a slice, and not on the base branch either.** A drain never pushes the base (*The shape*), so a repo-wide fix is a human's commit between drains, not yours during one: inside a slice it lands an unrelated change in someone else's epic diff, and on the base it moves the ground under every sibling epic mid-flight. Name the one-line fix in your report and leave it.
"Carry on" means against the underlying checks, not the broken wrapper: if the suite itself is sound and only the command that invokes it is wrong, run the suite directly, say in the commit which invocation you used, and tick the box against that. If the suite is genuinely broken, there's nothing to tick - that's a stop.
Run `code-review` here on a diff worth a second pass.
Then, in order:

**1. Commit.**
Match the repo's style - infer it from recent `git log` (plus `commitlint.config` / `CONTRIBUTING` if present; `type(scope): subject` when it's Conventional Commits) - so a pre-commit hook doesn't reject it.
Two things belong in *this* commit, not later:
- **The changeset entry**, if the repo tracks changes per-commit (`.changeset/` or similar). Written after this it's a loose file: `gh pr merge` merges server-side, so it never reaches the PR.
- **In local mode, the ticket's done signal** - tick every Definition of done box to `[x]` here, so the tick travels with the merge in step 4. Ticked later on the slice branch, the commit dies with the branch at step 6, the epic branch's copy still reads `[ ]`, and the drain re-picks this slice forever.

**2. Push the slice branch.**
`git push -u origin <slice-branch>` - required in both modes. github needs it before a PR can be opened; with a local tracker it's what step 6 and `land` verify and delete against, so skipping it leaves them with no `origin/<slice-branch>` to check.

**3. Open the PR** - github only; a local tracker has no PRs, so skip to step 4.
Every slice gets its own PR. If the repo has a PR template (`.github/PULL_REQUEST_TEMPLATE.md`), fill it; otherwise short prose (no hard-wrap), three parts:
- `Closes #<n>` - links the ticket. It **won't auto-close on merge** (the slice merges into the epic branch, not the default branch), so **close the issue explicitly** after merging (`gh issue close <n>`). With a local tracker there's no issue number: reference the ticket by path in the commit instead.
- **what shipped** - the actual change in a line or two, not a copy of the goal.
- **verified** - definition of done met: checks and suite green, tests at the agreed seam (or "no tests - per spec").

**4. Merge the slice into its base** - always a merge commit, never squash or rebase: the per-slice history *is* the review surface this model exists to keep. A repo that forbids merge commits is a conflict to raise, not to work around - `land` gates on the same thing.
Its base is whatever *Build it* cut it from: the **epic branch** for a hub slice, **the blocker's branch** for a stacked one whose blocker is still open - merge a stacked slice straight into the epic branch and it drags the blocker's unreviewed commits along, leaving the blocker's own PR with nothing to merge.
In github, `gh pr merge <pr> --merge`. With a local tracker, **`git switch <base> && git merge --no-ff <slice-branch> -m "<message>" && git push`** - each part guards a silent failure: step 1 left you on the slice branch, so no switch is `Already up to date.` at exit 0; a bare merge fast-forwards, producing no merge commit and ignoring `-m`; no `-m` opens an editor that hangs an unattended drain.

**5. Close the issue** (`gh issue close <n>`; local mode has no issue - the boxes ticked at step 1 are the signal).
That explicit close releases the next tickets and fires the **retarget**: any slice stacked on this one moves its PR base to the epic branch. Enumerate them, don't guess - `gh pr list --base <slice-branch>` is the list, and each one gets `gh pr edit <pr> --base <epic-branch>`.
Skip this and step 6 closes those PRs outright: GitHub closes any open PR whose base branch is deleted. Operations in `docs/agents/solve.md` -> **Branching**.

**6. Delete the slice branch.** Get off it first - `git switch <the base you merged into> && git pull` - then `git branch -d <slice-branch>` + `git push origin --delete <slice-branch>`. In github nothing moved you off the slice branch (the merge happened server-side), and git refuses to delete the branch you're standing on. The `pull` is what leaves the base current for the next slice.
Two rules, both about not losing work:
- **Delete after the retarget (step 5), never before** - dropping a branch an open PR still targets orphans the slice stacked on it. So `gh pr merge --delete-branch` at step 4 is the wrong tool: it deletes on merge, before the retarget runs.
- **Confirm the merge landed before deleting**, and not with `-d`: with an upstream set (step 2) it validates against that upstream, not the base you merged into, and will delete an unmerged branch - warning, but exiting 0.
  Check against **the base you merged into at step 4** - the epic branch, or the blocker's branch for a stacked slice; check a stacked slice against the epic branch and a good merge reads as missing, halting the drain.
  Both sides must be **remote** refs: `git fetch`, then `git merge-base --is-ancestor origin/<slice-branch> origin/<that base>`. `gh pr merge` merges server-side, so your *local* copy of that base doesn't have the merge yet and the check fails on a slice that landed perfectly. If it doesn't succeed, stop - don't delete. And still `-d`, never `-D`.

## Draining an epic

One slice at a time in local mode; in github mode, up to 3 at once - even just one, so a freed lane can be reused. Either way the only thing you pick is which.
**The next startable slice(s)** is every slice **of this epic** that's open, unblocked (every blocker done), unclaimed - `docs/agents/solve.md` -> **Tracker operations** has how to get the set. Absent that file it's local mode: the lowest-numbered ticket in `docs/tickets/<feature>/` whose Definition-of-done boxes aren't all `[x]` and whose `Blocked by` tickets' all are - read from the same place the check below reads them.
A ticket's `## Blocked by` is either the word `nothing` or one relative link per blocker, in the format `to-tickets` publishes. Anything you can't resolve is a blocker you can't check: treat the slice as blocked and say which link failed, rather than starting a slice whose dependency may never have landed.
*Of this epic* is load-bearing: an unscoped query returns the lowest startable slice in the whole **repo**, so the drain starts shipping another epic's slices into this epic branch - and never terminates.

**In github mode**, take up to 3 of the currently-startable hub slices (no open blocker), lowest-numbered first, as this round's batch - still *of this epic*, still unclaimed. Even a single startable hub slice goes through this path now, not just when two or more are ready at once: a lane a previous round freed (below) can then be reused instead of always creating fresh. More than 3 startable at once still caps the batch at 3; the rest wait for the next round, found the same way once this one's done. The batch is also capped by however many lanes are actually free - a lane still held by an unresolved stopped member from an earlier round doesn't count as available (*Sizing the round* in [WORKTREES.md](./WORKTREES.md)), so it can shrink a round below 3 even with 3+ slices startable; the slice that doesn't fit waits for the next round too. Local mode isn't a batch - single dispatch, the shared epic worktree, proceed exactly as before.
Dispatch each batch member through *Delegate the build* concurrently, without claiming any of them first - one subagent per member, each resolved to a lane worktree (*Pick the tree*, *Lane worktrees, for a parallel batch* in [WORKTREES.md](./WORKTREES.md)) - reused from an earlier round when one's free, created fresh otherwise. Each subagent claims its own slice as the first step of its own lifecycle (*Claim it*, unchanged), exactly like a single dispatch; the draining agent doesn't pre-claim members before dispatch.
Wait for every member's close-out report, then merge every member that reported `ready-to-merge` into the epic branch, one at a time, in the order the reports arrived - never two merges in flight. If any member reported `outcome: "stopped"` (*Delegate the build*'s report contract), halt the batch once those ready-to-merge merges land, and report it - don't merge the stopped member, and don't pick another startable slice to replace it or retry it automatically, same as today's single-slice halt. Each merge is still *Close the loop*'s steps 4-6, unchanged, its conflict-stop policy included: a same-file conflict between two members' merges stops that merge and reports it, exactly as a single-slice conflict does today - it just fires more often, since batch members build without being sequenced against each other.
**Never wait on a report that isn't coming.** A member whose subagent errors out, gets killed, or returns anything short of a well-formed close-out report (*Delegate the build*'s shape) is treated as `outcome: "stopped"`, `reason: "subagent did not return a report"` - same halt-after-merging-clean-siblings path as any other stopped member. This holds even if every other member already reported `ready-to-merge`: don't hold their merges hostage to one that will never resolve on its own.
A conflict on one member's merge halts the rest of the queue immediately - any ready-to-merge members not yet merged wait for the next round, same as a stopped member. A batch only ever runs in github mode, so this is `gh pr merge` refusing server-side, not a local conflict - nothing touches the epic worktree or any lane, there's no local state to clean up before reporting it.
Report the batch's outcome as one consolidated line, not a running per-subagent stream - e.g. "batch of 3: 004 merged, 005 merged, 006 stopped - `<reason>`".

Run the lifecycle - on the slice, or on each batch member - then look again. Each slice's build still goes through *Delegate the build*, whether that's the one subagent of a sequential drain or the concurrent subagents of a batch (above).
The initial *Clean the tree* covers the whole drain - a slice picked up later doesn't need pre-check again just because time passed waiting on its blockers.

It ends one of these ways, and none is "keep going anyway":

- **Nothing startable, slices still open.** Every one left is blocked by something open, or already claimed by someone else. **Stop**, and report which slices remain and what holds each. Never take a blocked or someone else's slice to keep the drain moving.
  Noticed your own noise after the slice closed - a stray whitespace change, a leftover import, something your feature had no business touching? Commit it straight onto the epic branch and name it in your report. Don't reopen a closed slice, and don't leave it: it rides into the integration diff either way. This is for *your* mess and only when it changes no behaviour - anything real is a new slice.
  Empty output from *find the next startable slice* does **not** distinguish this from a finished drain. Ask the other question separately: `gh issue view <epic> --json subIssues --jq '[.subIssues[] | select(.state == "OPEN")]'`. Empty there too, and only then, is the drain done.
  **In local mode, read the tickets off the epic branch** - they were committed there, not to the base (*Clean the tree*), so from the base "no unticked tickets" is indistinguishable from "no tickets at all". List with `git ls-tree --full-tree --name-only <epic-branch> docs/tickets/<feature>/`, then `git show <epic-branch>:<path>` per ticket. `--full-tree` isn't optional: `ls-tree`'s pathspec is relative to your working directory, so from a subdirectory it returns nothing at exit 0 - the false "all done" this check exists to catch. (`git show` takes a root-relative path and doesn't.)
  **On the epic's first slice the epic branch doesn't exist yet** - `git rev-parse --verify <epic-branch>` fails - so read the working tree instead. Every slice after that, read the branch.
- **A slice can't be completed.** Same rule as *Close the loop*. The drain halts with it - don't cherry-pick another slice to keep moving. Resume once it's resolved.
- **A merge conflict on integration.** `git status` to identify the conflicts, then **stop and report** - don't auto-resolve: resolving them wrong silently corrupts the epic branch.
- **Every slice closed.** The drain is done. If the repo keeps a changelog or release notes (`CHANGELOG.md`, `.changeset/`, or whatever `CONTRIBUTING` names), add the **feature's** entry in that format - one per feature, not one per slice. Then in github, open the **integration PR** - the epic branch into its destination (`docs/agents/solve.md` -> **Branching**), as a **draft** with `Closes #<epic>` for a human to review; ship never merges it.
  **ship never closes the epic** - "every slice is closed" is checkable, "the feature is delivered" is a judgement. Report the state, leave it open, and leave the spec's `Status` alone in local. (On merge GitHub closes it anyway if the destination is the default branch; into a non-default like `develop` it stays open - the human's call.)
  **If the epic ran in a worktree, name it in that PR body** - the path, the machine, and the `git worktree remove <path>` for after the merge, one line per path: the epic worktree, plus any lane still standing from the last round the drain dispatched. ship never removes any of them: [WORKTREES.md](./WORKTREES.md) -> *Cleanup*.
  **In local mode there's no PR**, so name the review surface instead: `git diff <base>...<epic-branch>` is the whole feature as one diff, design artifacts included. Say where the epic branch is, and where its worktree is if it ran in one.
  Point them at **`land`** for what comes next: it merges (the PR in github, the epic branch in local) and closes out the epic branch, the worktree, the epic issue and any slice branch still around.
