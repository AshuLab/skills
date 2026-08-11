---
name: ship
description: Take a startable ticket - or a whole epic - and carry it to done - claim it, build it, close the loop. Hand it one slice and it runs that slice's lifecycle; hand it the epic and it drains every slice in dependency order, unattended. It does not dictate how you code - the model, or a skill you pass in, does that - ship owns the edges.
---

# ship - take a ticket to done

The value isn't in telling you how to code - the model already does that well, and if
you have a specialized skill for it, better still. `ship` owns the **edges**: claiming
the ticket and closing the loop, so nothing is left half-tracked. You (or a skill) own
the middle; this owns the borders.

## One ticket, or the whole epic

Check what you were handed:
- **a ticket (a slice)** - run the lifecycle below once, on it.
- **an epic** - *drain* it: run that same lifecycle on every slice, in dependency
  order, unattended (AFK). Which slice comes next and when to stop is in **Draining an
  epic** at the end - the lifecycle comes first, because the drain is just that on
  repeat.

## Before you start

**Working tree must be clean.** Before touching any branch - `git status`. If there's
uncommitted work: commit it if it belongs to a slice, stash it (`git stash -u`) if it
doesn't. Never switch branches with a dirty tree - the switch either fails or silently
carries the changes into the wrong branch.

If there's distance - time passed, or the ticket isn't fresh from your own
`to-tickets` - run `pre-check` first: it rechecks the slice still applies and its
tags/milestone are in order. Skip it when you just cut the slice and are building now.

## Claim it

Claim the ticket so no one doubles up - the *claim* operation in
`docs/agents/solve.md` -> **Tracker operations**. In github that self-assigns; leave
`solve:refined` where it is - it means "fully defined, agent-ready", not "untaken":
the `blocked-by` edges say what's startable, the assignee says who has it (the label
stays on after close - a closed issue just drops out of the default `gh issue list`).
In local there's no board; just open the ticket file.

Read the ticket + its linked spec section before touching code.

## Build it

**Branching is `ship`'s call now** - the integration model is fixed even where the
names aren't. Every feature gets one **epic branch**, cut from the repo's base branch
the first time a slice of that epic ships and reused after - lazy: not there yet,
create it; otherwise switch to it. The slice's own branch comes off one of two places,
and the `blocked-by` graph decides:
- **no open blocker, or several** -> off the **epic branch** (the hub).
- **exactly one open blocker** -> off **that blocker's branch** (the stack), so you
  build on its code instead of waiting for it to land; its PR targets the blocker for
  now, and retargets when the blocker closes (*Close the loop*).

Bases and names all resolve from `docs/agents/solve.md` -> **Branching**, never
hard-coded here. Branch names must be git-safe: lowercase, hyphens, no spaces or special
characters (slugify any title before using it as `<feature>` or `<NNN-slug>`).

What ship still doesn't own is the middle - *how* you code: by default
you just build it, and if there's a specialized skill for this work - one you pass in,
one the repo standardizes, or `tdd` at an agreed seam - invoke it here. Either way the
ticket's **definition of done** is the contract: every box green before you close, and
don't gold-plate - reuse before building, write the least code that meets the done,
nothing speculative.

## Close the loop

Verify the definition of done first (typecheck, full suite, tests at the agreed seam).
This is also where `code-review` earns its place on a diff worth a second pass. Then,
in order:

**1. Commit.** Match the repo's style - infer it from recent `git log` (plus
`commitlint.config` / `CONTRIBUTING` if present; `type(scope): subject` when it's
Conventional Commits) - so a pre-commit hook doesn't reject it.

**2. Push the slice branch.** `git push -u origin <slice-branch>` - GitHub needs the
branch on the remote before a PR can be opened.

**3. Open the PR.** Every slice gets its own PR - that's what keeps the history and
links each ticket. If the repo has a PR template
(`.github/PULL_REQUEST_TEMPLATE.md`), fill it; otherwise short prose (no hard-wrap),
three parts:
- `Closes #<n>` - links the ticket. It **won't auto-close on merge** (the slice merges
  into the epic branch, not the default branch), so **close the issue explicitly** after
  merging (`gh issue close <n>`).
- **what shipped** - the actual change in a line or two, not a copy of the goal.
- **verified** - definition of done met: typecheck + suite green, tests at the agreed
  seam (or "no tests - per spec").

**4. Merge into the epic branch** - merge commit, never squash or rebase, so every
slice's commits and PR survive in history. If the repo tracks changes per-commit
(`.changeset/` or similar), add this slice's entry before merging.

**5. Close the issue** (`gh issue close <n>`). That explicit close releases the next
tickets and fires the **retarget**: any slice stacked on this one moves its PR base to
the epic branch (`gh pr edit <pr> --base <epic-branch>`), so it stops targeting a branch
that just merged. Operations in `docs/agents/solve.md` -> **Branching**.

In local there's no issue to close, so the ticket file has to carry the signal itself:
**tick every box in its Definition of done to `[x]`**, then commit referencing the
ticket. Those boxes are what marks the slice done - *find the next startable slice*
reads exactly them, so a slice built but left unticked reads as unfinished and holds
up everything blocked on it.

## Draining an epic

One slice at a time, and the only thing you pick is which. **The next startable slice**
is open, unblocked (every blocker done), unclaimed, lowest number - the exact query
lives in `docs/agents/solve.md` -> **Tracker operations**. Run the lifecycle on it,
then look again.

Two ways it ends, and neither of them is "keep going anyway":

- **Nothing startable, slices still open.** Every one left is blocked by something open,
  or already claimed by someone else. **Stop**, and report which slices remain and what
  holds each. Never take a blocked or someone else's slice to keep the drain moving -
  unattended mode makes that mistake expensive.
- **A slice can't be completed.** Definition of done won't pass (test failure,
  typecheck error, design gap) or a merge conflict blocks the integration. **Stop** -
  don't mark it done and don't skip it. Report the slice, the blocker, and what's
  needed to unblock (a fix, a decision, a rebase). The drain resumes when it's resolved.
- **A merge conflict on integration.** `git status` to identify the conflicts, then
  **stop and report** - don't auto-resolve. Conflicts need a human call; resolving them
  wrong silently corrupts the epic branch.
- **Every slice closed.** The drain is done. If the repo keeps a changelog or release
  notes (`CHANGELOG.md`, `.changeset/`, or whatever `CONTRIBUTING` names), add the
  **feature's** entry in that format - one per feature, not one per slice. Then in
  github, open the **integration PR** - the epic branch into its destination
  (`docs/agents/solve.md` -> **Branching**), as a **draft** with `Closes #<epic>` for a
  human to review; ship never merges it. When the
  human merges that PR, GitHub closes the epic - but only if the destination is the repo's
  default branch; into a non-default like `develop` it stays open until that reaches
  default, the human's call anyway. So **ship never closes the epic** itself. A slice has
  a mechanically verifiable definition of done; an epic doesn't - it's the PRD. "Every
  slice is closed" is a fact you can check, "the feature is delivered" is a judgement
  call, and the slices you drained may not even be all of them (one added later, one
  that never came from `to-tickets`). Report the state and leave the epic open - closing
  it is a human's signal that they accept the feature. Same in local: leave the spec's
  `Status` for the person to flip.
