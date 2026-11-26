---
name: ship
description: Take a startable ticket - or a whole epic - and carry it to done: claim it, build it, close the loop. Hand it one slice and it runs that lifecycle; hand it the epic and it drains every slice in dependency order, unattended. It doesn't dictate how you code - the model, or a skill you pass in, does - ship owns the edges.
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
     |    each slice: delivered (see Slice delivery) -> merge into ITS BASE -> close issue -> delete branch
     |    base = the epic branch, or the blocker's branch for a stacked slice
     |    a stacked slice's base becomes the epic when its blocker closes (github: its PR retargets)
     |
     +- every slice closed -> ONE draft PR: <epic-branch> -> <destination>
                              a human reviews it, then `land` merges it; ship never does
```

**A drain only ever produces hub slices** - it picks the next slice with no open blocker. The stack above is for when `ship` is handed slice 003 directly while 002 is still open; never hunt for a blocked slice mid-drain.

**Two epics can drain at once - in separate clones, never in one - kept apart by two properties:** every branch is namespaced `<type>/<feature>/`, and **a drain never pushes the base branch** - `ship` stops at the integration PR precisely because merging it is `land`'s job. Break either one and concurrent drains collide on every push. What isolation doesn't buy is content: sibling epics branch from the same base and never rebase, so two editing the same files conflict at integration, not during the drain. Each drain reports success, and the conflict is `land`'s to surface.

The slice record - a PR in `github` mode, the merge commit in `local` - is the working record: small, linked to their ticket, merged as they land. The integration PR is the *review surface*: the whole feature, design artifacts included, as one diff.

Everything repo-specific - branch names, the lane worktree path - comes from `docs/agents/solve.md`, written once by `setup`. **No such file** means the repo never ran `setup`; defaults: github inferred from the git remote (`owner/name`), `origin`'s default branch as base and destination, branch names `feature/<feature>/epic` and `feature/<feature>/<NNN-slug>`, slice delivery `github`. Say so once and carry on - don't stop, don't write a config file. A repo with no GitHub remote is the one thing to stop on: the whole branch model pushes.

## One ticket, or the whole epic

Check what you were handed:
- **a ticket (a slice)** - run the lifecycle below once, on it.
- **an epic** - *drain* it: run that same lifecycle on every slice, in dependency order, unattended (AFK). Which slice comes next and when to stop is in **Draining an epic** at the end.

## Delegate the build

*Claim it* and *Build it*, plus *Close the loop*'s steps 1-3, run inside a subagent, launched fresh for each slice - not inline in the draining agent's own session. *Pick the tree* and *Clean the tree, cut the epic branch* stay outside that scope: the draining agent runs them once, before the first slice of a drain dispatches, and hands the subagent the ticket handle, the epic's `<feature>` token, and the tree already resolved (the shared tree, or its lane in a batch) - the subagent builds there, never re-deciding where the drain works.
This holds for every slice, one ticket or a whole drain: the subagent claims the slice, builds it, commits and publishes it as the delivery mode says (steps 1-3: `github` pushes and opens the PR, `local` publishes nothing), then stops - it never merges, never closes the issue, never deletes a branch.
The subagent hands back only a close-out report - the draining agent reads that, never the subagent's own transcript or tool history, and acts on it to run *Close the loop*'s steps 4-6 (merge, close the issue, delete the branch):

A slice that is ready to merge:

```
{
  "slice": "#351",
  "outcome": "ready-to-merge",
  "branch": "feature/export-csv/351-export-button",
  "pr": "https://github.com/acme/app/pull/360",
  "definitionOfDone": {
    "Export button downloads the current view as CSV": true,
    "Empty views download a header-only file": true
  },
  "uiImpact": ["Reports > Export button"]
}
```

A slice that stopped, with the `reason`:

```
{
  "slice": "#351",
  "outcome": "stopped",
  "branch": "feature/export-csv/351-export-button",
  "pr": "https://github.com/acme/app/pull/360",
  "definitionOfDone": {
    "Export button downloads the current view as CSV": true,
    "Empty views download a header-only file": false
  },
  "reason": "The empty-view case fails: the export endpoint returns 500 when there are no rows. Fix it or relax that box."
}
```

A slice that is ready to merge in `local` mode - no PR, and the two lines the merge commit carries:

```
{
  "slice": "#351",
  "outcome": "ready-to-merge",
  "branch": "feature/export-csv/351-export-button",
  "pr": null,
  "shipped": "Reports gets an Export button that downloads the current view as CSV; empty views get a header-only file.",
  "verified": "Suite and typecheck green; export tested at the controller seam the spec named.",
  "definitionOfDone": {
    "Export button downloads the current view as CSV": true,
    "Empty views download a header-only file": true
  }
}
```

The report is a single JSON object and nothing else. A `local` report missing `shipped` or `verified` isn't well-formed (*Draining an epic*). `pr` is the PR URL in `github` mode and `null` in `local`, where the report also carries `shipped` and `verified` - the two lines the merge commit message uses (*Slice delivery*). `reason` appears only when `outcome` is `"stopped"` - what would close it; `note` appears whenever there is something to surface, whatever the outcome - e.g. *Close the loop*'s "the repo arrived broken, not your slice's fault" case, which still needs to reach a human between drains. `uiImpact` is optional: the views the slice visibly changes, shared styles, components or assets included - omit it when the slice changes nothing a user sees. It is a hint for the epic's visual evidence (*Draining an epic*), not the evidence itself.

`outcome: "stopped"` is the subagent's report of *Close the loop*'s stop condition - the draining agent doesn't re-verify the definition of done itself, it halts on the report and reads `reason` for what would close it.
`note`, when present, always reaches a human - surface it verbatim in this slice's own report, or, inside a batch, appended to the consolidated line (*Draining an epic*), regardless of `outcome`. Nothing else in *Close the loop* or *Draining an epic* relays it.

## Claim it

Claim the ticket before any git, so no one doubles up - the *claim* operation in `docs/agents/solve.md` -> **Tracker operations** (`gh issue edit <n> --add-assignee @me`). **Leave `solve:refined` on**, here and after close - it means "fully defined", not "untaken": `blocked-by` says what's startable, the assignee says who has it.

Read the ticket + its linked spec section before touching code.

## Pick the tree

**An epic always drains in the shared tree** - there is no per-epic worktree, and no setting that makes one. The only worktrees `ship` creates are the **lane worktrees** of a parallel batch (*Draining an epic*), and those are [WORKTREES.md](./WORKTREES.md)'s.
**Resolve what's in that tree before you touch a branch** - building wherever you're standing is the mistake when another epic is already in flight there.

**Pre-flight:** `git status --porcelain` before touching anything. Usually no design artifacts are loose: `to-tickets`' hand-off already committed them to the epic branch on the remote. If they are loose (no hand-off), one thing is expected and passes: solve's own output - new **untracked** files in `docs/specs/` or `docs/agents/`, new *or modified* files under `docs/adr/` and `docs/glossary/` (their indexes, a topic file, a superseded ADR's status), and a created-or-modified `docs/glossary.md` - that's `sharpen`/`to-spec`/`vocab` (and `setup`, for `docs/agents/`) leaving output for you, and *Clean the tree* sorts it: the design artifacts go to the epic branch as the fallback, the repo config to the base. **Anything else** - a modified tracked file, an untracked file outside those paths - is working state you can't account for: your own from an earlier run, or another drain in that tree right now. **Stop and surface it:** list the paths and offer the exits - commit it or stash it. Don't sort it into "mine" and route around it - you can't tell from git whose it is, and *Clean the tree* downstream folds whatever's loose onto your epic branch. An AFK drain with no one to answer just stops. This is a start-of-run gate - a drain's own later slices leave the tree dirty by design, and that's fine.

*Something else in flight* is three checks, any one enough: `git worktree list` shows a worktree that is neither the shared tree nor one of this epic's lanes (`<feature>--lane-<N>`) - another epic's lanes, another run's, or an epic worktree an older `ship` left holding the epic branch, which would refuse the switch to it, the current branch carries another epic's `<feature>`, or `git status` is dirty (the pre-flight already stops on a dirty tree - this is the backstop for a run that reaches here regardless). Doesn't matter whether that's your own earlier state or another run happening right now - either way the shared tree isn't yours alone.
**Treat all three as a floor, never as proof of the opposite.** They're a snapshot, and another run can start between the check and your next command, so a clean read doesn't mean nothing is in flight - it means nothing was, a moment ago. Anything you find that isn't yours, leave alone: don't switch to its branch, don't remove its lanes, don't stash its work.
Another epic holding this clone **stops the whole run**, not just this step: two epics can't drain in one clone, so the drain resumes in another clone, or once that epic is done. Nothing on disk records the stop, so your report is the only trace: say what's in flight or dirty, that it isn't yours, and that the drain resumes once whoever owns it commits or drops it.
While draining, never ask: decide from those checks and stop or go.

**A parallel batch (*Draining an epic*) is the one place `ship` uses worktrees**: up to 3 lane worktrees alongside the shared tree. A lane isn't tied to one slice - it's a slot, created once and reused round after round as long as the drain keeps dispatching, parked (not removed) between occupants. A single-slice run never creates one. [WORKTREES.md](./WORKTREES.md) has the path and the mechanics.

## Clean the tree, cut the epic branch

**The shared tree must be clean** - check it with `git status`. *Pick the tree* already ruled on anything that isn't yours; what's left sorts into four cases, all of it yours:
- **belongs to a slice** -> commit it in that slice's normal flow, once its branch exists (*Build it*). Until then it rides across the branch switches - never leave it loose in the shared tree while you go work somewhere else.
- **epic-level design artifacts** -> the output of `sharpen`/`to-spec`/`vocab` (spec, ADR, glossary edits): they belong to the epic, not to any single slice. **Already handed off** (`to-tickets`' hand-off ran: the epic branch is on the remote with the artifacts as its first commit, none loose) -> nothing to commit: `git fetch` (a fresh clone sees the branch), then switch to the epic branch (*Build it*'s lazy logic), don't cut it again. **Still loose** (no hand-off) -> create/switch to the **epic branch first** and commit them there as its first commit - **never on the base branch**, where they'd sit in the base of every PR and no diff would surface them.
- **the repo's own config** -> `AGENTS.md` / `CLAUDE.md`, `docs/agents/solve.md` and `docs/agents/solve-flow.md`, if `setup` just wrote them and left them uncommitted. Commit those to the **base** branch - they describe the repo, not this feature.
- **neither** -> your own stray, unrelated work - stash it (`git stash -u`). Someone else's is not this case; it stopped the run back at *Pick the tree*.
Cut the epic branch with the **start the epic branch** operation from `docs/agents/solve.md` -> **Branching**, exactly as written, not a `git switch -c` you compose yourself. It carries three parts you can't drop: the `git fetch`, the explicit `origin/<base>` (without it you cut from wherever HEAD is), and the `git push -u` (github can't open a PR against a base that only exists locally, and every later merge check reads `origin/`).
Never switch to an **existing** branch carrying changes that don't belong there - the switch either fails or silently drags them onto it. (Cutting the epic branch to carry the artifacts, above, is the deliberate exception.)

If there's distance - time passed, or the ticket isn't fresh from your own `to-tickets` - run `pre-check` first: it rechecks the slice still applies and its labels/milestone are in order. Skip it when you just cut the slice and are building now.

## Build it

**The integration model is fixed even where the names aren't.**
Every feature gets one **epic branch**, cut from the repo's base branch the first time a slice of that epic ships, reused after - lazily: `git fetch`, then look for `origin/<epic-branch>`. Not there, create it with **start the epic branch** (push included); there (the hand-off or an earlier run cut it, maybe from another clone), switch to it. *Clean the tree* may already have cut it to carry design artifacts, or the hand-off already did.
The slice's own branch comes off one of two places, and the `blocked-by` graph decides:
- **no open blocker, or several** -> off the **epic branch** (the hub).
- **exactly one open blocker** -> off **that blocker's branch** (the stack), so you build on its code instead of waiting for it to land; its base is the blocker's branch for now, and becomes the epic branch when the blocker closes (*Slice delivery*).

Bases and names all resolve from `docs/agents/solve.md` -> **Branching**, never hard-coded here; branch names must be git-safe: lowercase, hyphens, no spaces or special characters.
`<feature>` is the epic's token, decided **once**: on the epic's first slice slugify the epic issue's title; from then on read it back off the epic branch name. Never re-slugify - not per slice, not from a spec title that may not match the issue - or the same epic becomes `payments-api` one run and `payments_api` the next: two epic branches, and lane worktrees that stop finding themselves.
Handed a slice and you need its epic - the number for `Closes`, the title for the token - the *find a slice's epic* operation is in `docs/agents/solve.md` -> **Tracker operations**.

*How* you code is the middle, and not ship's: by default just build it; if there's a specialized skill for this work - one you pass in, one the repo standardizes, or `tdd` at the seam the spec named for testing this story - invoke it here. Either way the ticket's **definition of done** is the contract: every box green before you close, and don't gold-plate - reuse before building, write the least code that meets the done, nothing speculative.
Something the change needs to be complete that the ticket missed - a place the slice's blast radius reaches that the definition of done doesn't name - is in scope, not gold-plating: do it, and name it in the PR and the report's `note`, so the gap in the ticket is visible. It stays in scope only while it serves this slice and needs no product call; past that it's a stop like any design gap.

## Close the loop

Steps 1-3 run inside the subagent (*Delegate the build*); steps 4-6 run in the draining agent, off that subagent's report alone. Read this section as one continuous lifecycle regardless of which side runs which step - the split is who executes it, not what it means.
Verify the definition of done first: the repo's static checks if it has any, the full suite, and the tests at the agreed seam - the place the spec named for testing this story. No spec ever named one (a ticket that didn't come from `to-tickets`, or a repo with no `docs/specs/`)? Say so and test at the obvious seam for the change instead of ticking a box against nothing.
If it doesn't pass - test failure, typecheck error, a design gap - **stop**: don't mark it done, don't skip it, don't force a fix that isn't real. Report the blocker and what would close it (a fix, a decision, merging the base in). This holds carrying one ticket or draining an epic (draining just decides the rest of the queue, below).
**First find out whether you broke it.** Run the same check against the base branch **without touching any tree** - `git fetch origin <base>` (a long drain's `origin/<base>` is stale), then `git archive origin/<base> | tar -x -C <a scratch dir>`, run it there, delete it. Don't switch branches to find out: you may be standing in a tree you're not allowed to disturb, and that's precisely when this question comes up. Green on the base and red here means it's yours, and the rule above applies. Red on both means the repo arrived broken - a wrong test command, a missing dep, an unrelated failure - and that is **not** your slice's blocker. Report it, say it predates you, carry on. **Don't fix it - not in a slice, not on the base branch either.** A drain never pushes the base (*The shape*), so a repo-wide fix is a human's commit between drains, not yours during one: inside a slice it lands an unrelated change in someone else's epic diff; on the base it moves the ground under every sibling epic mid-flight. Name the one-line fix in your report and leave it.
"Carry on" means against the underlying checks, not the broken wrapper: if the suite itself is sound and only the command that invokes it is wrong, run the suite directly, say in the commit which invocation you used, and tick the box against that. If the suite is genuinely broken, there's nothing to tick - that's a stop.
Then, in order:

**1. Commit.**
Match the repo's style - infer it from recent `git log` (plus `commitlint.config` / `CONTRIBUTING` if present; `type(scope): subject` when it's Conventional Commits) - so a pre-commit hook doesn't reject it.
**Draining an epic, don't edit a shared changelog file (`CHANGELOG.md`, `RELEASE_NOTES.md`, etc.) in a slice**, even if `CONTRIBUTING.md` or `AGENTS.md` asks for an entry per PR - parallel slices all appending to it guarantee conflicts. The epic's single entry lands at the end of the drain (*Draining an epic*). A slice shipped on its own, outside a drain, never reaches that step: it writes its entry here, as the repo asks.
**The changeset entry** belongs in *this* commit, not later, if the repo tracks changes per-commit in separate files (`.changeset/` or similar). Written after this it's a loose file that never reaches the slice's merge.

**Steps 2-6** - publish, record, check, merge, close the issue, delete the branch - are *Slice delivery*, next.

### Slice delivery (steps 2-6)

Steps 2-6 of the lifecycle - how a finished slice gets from its branch into its base - depend on how this repo delivers slices, and **each mode has its own file, read whole**.

**Read the mode once**, from **Slice delivery** in `docs/agents/solve.md` (**absent** -> `github`; **any other value** -> stop and say so, never guess), and say it in your first report line ("slice delivery: local"). Then read exactly one file and never the other:
- `github` -> [SLICES-GITHUB.md](./SLICES-GITHUB.md): one PR per slice, merged server-side.
- `local` -> [SLICES-LOCAL.md](./SLICES-LOCAL.md): no slice PR, a local merge commit, the epic branch pushed after each.

Hand the subagent the path of the file with the ticket handle and the `<feature>` token - steps 2-3 are its, and it never picks the mode itself.

**The output contract** - what any mode must leave true, and the only thing the rest of `ship`, `land` and the integration PR rely on:
- the slice is merged into **its base** with a merge commit - never squash, never rebase;
- the slice's issue is closed, explicitly;
- the slice branch is deleted, only after the merge is proven to have landed, with `-d` and never `-D`;
- **the epic branch is on the remote and current** whenever the slice's base was the epic branch;
- the close-out report has its fields (*Delegate the build*), `pr` being the PR URL in `github` and `null` in `local`;
- a slice whose check still had findings reaches the integration PR as **Unresolved slice checks**.

**Step numbers are shared**: both files carry steps 2 (publish the slice), 3 (record it), the check before merging, 4 (merge), 5 (close the issue) and 6 (delete the branch), so a cross-reference to *Close the loop* step 4 means the same moment in either. A change to one of these files is read against the other and against this contract before it lands.

## Draining an epic

Up to 3 slices at once - even just one, so a freed lane can be reused. Either way the only thing you pick is which.
**The next startable slice(s)** is every slice **of this epic** that's open, unblocked (every blocker done), unclaimed - `docs/agents/solve.md` -> **Tracker operations** has how to get the set. Absent that file, infer github still (`owner/repo` from the git remote) and use `setup/REFERENCE.md`'s **Tracker operations** -> *find the next startable slice* - drop its `.[0]` to return the whole sorted set instead of just the lowest.
Anything you can't resolve a `blocked-by` edge for is a blocker you can't check: treat the slice as blocked and say which one failed, rather than starting a slice whose dependency may never have landed.
*Of this epic* is load-bearing: an unscoped query returns the lowest startable slice in the whole **repo**, so the drain starts shipping another epic's slices into this epic branch - and never terminates.

Take up to 3 of the currently-startable hub slices (no open blocker), lowest-numbered first, as this round's batch - still *of this epic*, still unclaimed. Even a single startable hub slice goes through this path now, not just when two or more are ready: a lane a previous round freed (below) can then be reused instead of always creating fresh. More than 3 startable still caps the batch at 3; the rest wait for the next round, found the same way once this one's done. The batch is also capped by however many lanes are actually free - a lane still held by an unresolved stopped member from an earlier round doesn't count as available (*Sizing the round* in [WORKTREES.md](./WORKTREES.md)), so it can shrink a round below 3 even with 3+ slices startable; the slice that doesn't fit waits for the next round too.
Dispatch each batch member through *Delegate the build* concurrently, without claiming any of them first - one subagent per member, each resolved to a lane worktree (*Pick the tree*, *Lane worktrees, for a parallel batch* in [WORKTREES.md](./WORKTREES.md)) - reused from an earlier round when one's free, created fresh otherwise. Each subagent claims its own slice as the first step of its own lifecycle (*Claim it*, unchanged), exactly like a single dispatch; the draining agent doesn't pre-claim members before dispatch.
Wait for every member's close-out report, then merge every member that reported `ready-to-merge` into the epic branch, one at a time, in the order the reports arrived - never two merges in flight. If any member reported `outcome: "stopped"` (*Delegate the build*'s report contract), halt the batch once those ready-to-merge merges land, and report it - don't merge the stopped member, and don't pick another startable slice to replace or retry it automatically, same as today's single-slice halt. Each merge is still *Close the loop*'s steps 4-6, unchanged - a conflict's one resolution attempt included.
**Never wait on a report that isn't coming.** A member whose subagent errors out, gets killed, or returns anything short of a well-formed close-out report (*Delegate the build*'s shape) is treated as `outcome: "stopped"`, `reason: "subagent did not return a report"` - same halt-after-merging-clean-siblings path as any other stopped member. This holds even if every other member already reported `ready-to-merge`: don't hold their merges hostage to one that will never resolve on its own.
That also covers a subagent that's still running but has gone silent: **2 hours with no report, counted from that member's own dispatch** (not from the round's start, so a slow earlier member doesn't shorten a later one's wait), gets the same `outcome: "stopped"`, `reason: "subagent exceeded the wait bound with no report"` - don't wait past it on the chance it's still working.
Before resolving that stop - retrying the slice, reassigning its lane - check the member's slice branch for activity after the timeout mark (the delivery mode file says where): the subagent may have kept working past the bound and committed anyway, and redispatching over live work loses it.
An unresolved conflict on one member's merge (*Close the loop* step 4's attempt didn't land it) halts the rest of the queue immediately - any `ready-to-merge` members not yet merged wait for the next round, same as a stopped member: ticket claimed, slice delivered, lane occupied on its own branch and unparked (*Freeing a lane* in [WORKTREES.md](./WORKTREES.md) never runs for a merge that never landed). The next round retries them first, in the order skipped, before dispatching new members - they're already claimed and built, so re-querying startable slices wouldn't find them.
Report the batch's outcome as one consolidated line, not a running per-subagent stream - e.g. "batch of 3: 004 merged, 005 merged, 006 stopped - `<reason>`". A member whose report carried a `note` (*Delegate the build*'s contract) appends it to that member's own clause in the same line, regardless of `outcome` - e.g. "batch of 3: 004 merged - `<note>`, 005 merged, 006 stopped - `<reason>`" - never dropped just because it arrived inside a batch.

Run the lifecycle - on the slice, or on each batch member - then look again. Each slice's build still goes through *Delegate the build*, whether that's the one subagent of a sequential drain or the concurrent subagents of a batch (above).
The initial *Clean the tree* covers the whole drain - a slice picked up later doesn't need pre-check again just because time passed waiting on its blockers.

It ends one of these ways, and none is "keep going anyway":

- **Nothing startable, slices still open.** Every one left is blocked by something open, or already claimed by someone else. **Stop**, and report which slices remain and what holds each. Never take a blocked or someone else's slice to keep the drain moving.
  Empty output from *find the next startable slice* does **not** distinguish this from a finished drain. Ask the other question separately: `gh issue view <epic> --json subIssues --jq '[.subIssues[] | select(.state == "OPEN")]'`. Empty there too, and only then, is the drain done.
- **A slice can't be completed.** Same rule as *Close the loop*. The drain halts with it - don't cherry-pick another slice to keep moving. Resume once it's resolved.
- **An unresolved merge conflict.** One *Close the loop* step 4's slice-branch attempt didn't land, or any conflict outside a slice merge: `git status` to identify the files, then **stop and report** - never auto-resolve on the epic branch or merge unverified code.
- **Every slice closed.** The drain is done. If the repo keeps a shared changelog or release notes file (`CHANGELOG.md`, `RELEASE_NOTES.md`, or whatever `CONTRIBUTING` names), add the **feature's** entry in that format - one per feature, not per slice. Per-file entries (`.changeset/`) already landed with each slice (*Close the loop* step 1). If the epic changes what a user sees, prepare its before/after screenshots first: [VISUAL-EVIDENCE.md](./VISUAL-EVIDENCE.md) says when it applies, what to capture and how it goes in the PR. Then open the **integration PR** - the epic branch into its destination (`docs/agents/solve.md` -> **Branching**), as a **draft** labelled `solve:epic` (`--label solve:epic`) with `Closes #<epic>` for a human to review; ship never merges it. Where evidence applies, read the PR back against its gate before reporting it ready.
  **ship never closes the epic** - "every slice is closed" is checkable, "the feature is delivered" is a judgement. Report the state and leave it open. (On merge GitHub closes it anyway if the destination is the default branch; into a non-default like `develop` it stays open - the human's call.)
  **Unresolved slice checks go in that PR body too** - gathered from the record, not from memory, since a long drain's notes may not survive it: *Unresolved slice checks* in the delivery mode file says where each mode keeps them. Each gets one line under **Unresolved slice checks** - the finding and a link - so the integration review picks it up. None -> omit the section.
  **If a batch left lane worktrees standing, name them in that PR body** - the path, the machine, and the `git worktree remove <path>` for after the merge, one line per lane still standing from the last round the drain dispatched. ship never removes any of them: [WORKTREES.md](./WORKTREES.md) -> *Cleanup*.
  Point them at the review pass next - `code-review` on the integration PR (`solve-flow.md` -> **Reviewing**) - and then **`land`**: it merges the PR and closes out the epic branch, any lane worktrees, the epic issue and any slice branch still around.
