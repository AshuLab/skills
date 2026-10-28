---
name: to-tickets
description: Break a spec (or a plan) into vertical, agent-ready slices - small tickets an agent can pick up one at a time, each with a definition of done. Use it once you have a spec and want to split the work. Publishes each slice as a GitHub sub-issue with real dependency edges, then hands the epic's design artifacts off to the remote and marks the epic ready.
---

# to-tickets - break a spec into vertical, agent-ready slices

Draft first, quiz on granularity and blocking, then publish.

## What a slice is (fixed)

The smallest cut that still ships - **minimal but functional**:

- **Vertical** - cuts through every layer it touches (schema -> logic -> UI -> test), never one horizontal layer.
- **Demoable on its own** - shipping it alone leaves the app working and shows something. Keep splitting until it's the smallest cut that *still holds this*; if a smaller split would leave the system broken, you went one too far.
- **Agent-ready** - one agent finishes it in a sitting without coming back to ask: no open design decisions (those were settled in the spec), a bounded seam (not "touch 15 files"), a verifiable definition of done.

The test: **could an agent pick this up and finish it without asking you anything?**
If not, it's too big or under-specified - split it, or send it back to `to-spec`.

One trap the test misses: a slice can look vertical and demoable yet quietly rest on new infrastructure - a first external process, a protocol client, a heavy new dependency.
That scaffolding is a sub-project hiding inside the slice; pull it out as its own enabling-chore first, or the "finishes it in a sitting" promise breaks.

Wide refactors are the exception: sequence them expand-contract - add the new path, migrate callers onto it, then remove the old, so the build never breaks mid-refactor.
Spikes and enabling chores are the other exception - a spike answers an open question, a chore unblocks later slices; neither demos on its own, and that's fine.
Give each a verifiable done (findings recorded, the enablement in place) and keep them rare.

## Ticket format (fixed)

```markdown
# NNN - <title>

## Goal
One sentence: what this slice delivers.

## Context
Links to the spec section + relevant ADRs / glossary terms - reference, don't restate.

## Definition of done
- [ ] <observable outcome the slice must show>
- [ ] the repo's static checks pass (omit this box entirely if it has none)
- [ ] full test suite passes
- [ ] tests at the agreed seam (or: no tests - per spec)

## Blocked by
NNN, NNN  (or: nothing)
```

The `NNN` in **Blocked by** are draft indexes; at publish they resolve to each blocker's real `#<issue>` handle, which GitHub auto-links.
A draft index appears **only** in **Blocked by**, as bare digits - never with `@` or `#` (GitHub reads `@007` as a mention and notifies that user the moment the issue is created; an edit can't recall it).
The prose of a slice never refers to another slice by index and never names one that isn't its blocker: describe the behavior instead.

The definition of done is where the execution discipline lives - keep it observable, not a to-do list.
**Every box has to be tickable by someone who didn't write it.** The test is yours while drafting, not a field in the ticket: for each box name to yourself the command that proves it or the thing you'd look at, and if you can't name one, the box is prose and doesn't belong.
Two shapes pass that test at a glance and fail it in the hand, and they don't have the same fix.
A box pinned to a state the code can't reach - rows from before this change, in a store that resets on restart - has nothing to run against, so the agent either invents a way or ticks it on faith. Rewrite it around a state that exists, or drop it; there's nothing upstream to send.
A box smuggling an unmade decision is worse, because it reads as settled: "the new path stays compatible with the old" names no behaviour, so two agents build opposite things and both tick it honestly, and the disagreement surfaces after the merge. That one isn't a wording problem - the decision belongs in the spec, and the box waits for it.

Write the ticket's prose as flowing lines - one line per paragraph, not hard-wrapped to a fixed width.

Write the ticket **behavioral, not procedural**: name the contracts (types, signatures, config shapes) and the observable outcome, never file paths or line numbers - a ticket pinned to "line 42 of x.ts" is dead on arrival; one pinned to a contract survives the code moving under it.

A contract is often clearest **as code**: when a type shape, schema, signature or state machine encodes the decision better than prose, inline that snippet - trimmed to the decision, not a working demo.
That's still the *what* (the contract, durable), not the *how* (implementation the agent writes itself).
It's what a from-scratch, unattended agent leans on hardest - but if the spec already carries the contract, reference it; inline only what this slice adds.

**A snippet reads as authoritative, so trimming it is where it turns into a lie.** Prose that's roughly right gets checked against the code; the same claim as an expression gets implemented verbatim. Before you inline one, run it against the cases the slice will actually see, especially the wrong-typed and empty ones - an expression that's right for the happy path and silently wrong for everything else is worse than the sentence it replaced. Then read it against the definition of done: if the two say different things about the same input, the agent has to pick, and it may not pick the way you'd have. Reconcile them before you publish - correct the snippet where the slice owns the call, and send it back to the spec where it doesn't.

## Before publishing

Draft the slice list and show it - granularity and blocking edges laid out - then adjust from the reply; never publish off a first guess.
Only use a closed-choice UI when you're genuinely torn between two concrete cuts (e.g. 3 slices vs 5), each a real option; otherwise show the draft in prose and wait.

## Publish the slices

Read the epic's milestone **before creating anything** (`gh issue view <epic> --json milestone`), if it has one, and carry it onto every slice in the batch.
Labels don't inherit - each slice gets only its own `solve:` labels (below).
No milestone on the epic -> nothing to carry, nothing to ask.

Then publish each slice as a sub-issue, in **topological order** (blocker before blocked) - which is what makes the cross-references resolvable: a slice's blockers already exist by the time it's created, so before creating it, rewrite each draft index (`001`) on its `Blocked by` line - and only that line - to the blocker's real `#<issue number>` handle, which GitHub auto-links, alongside the native `--blocked-by` edge. There is no marker to resolve and no second pass over published slices.
Then, before the body is sent, wrap in backticks any `@word` and any `#digits` outside a code fence or inline code that isn't one of those blocker handles: unwrapped, they notify people and add backlinks, and a sent body can't take that back. Tickets never mention people, so nothing legitimate is lost.
The concrete operation is in `docs/agents/solve.md` -> **Tracker operations** (*publish a slice*); run it per slice. **No such file** means the repo never ran `setup`: infer `owner/repo` from the git remote and use `setup/REFERENCE.md`'s **Tracker operations** -> *publish a slice*. Say so once and carry on - don't stop, and don't write a config file.
Throttle the loop - creating issues too fast trips rate limiting.

Every slice gets `solve:ticket` + `solve:refined` at publish - **blocked or not**.
`refined` means the definition is complete, not that the slice is unblocked; blocking lives in the `blocked-by` edges, a separate signal.

## Hand off the epic

The last step, run in this same tree and session: the design artifacts (spec, ADRs, glossary edits) are untracked files that exist only where `sharpen`, `to-spec` and `vocab` wrote them, and the remote is the only place an orchestrator on another clone can read them. The happy path has no confirmation gate - those files were already approved at `to-spec` and above; only a deviation (below) stops and waits.

1. **Find the artifacts** with the classification in `ship`'s *Clean the tree, cut the epic branch* - its *epic-level design artifacts* case (spec, ADRs, glossary edits); reference it, don't restate it or invent another. The repo's own config (`AGENTS.md` / `CLAUDE.md`, `docs/agents/solve.md`, `docs/agents/solve-flow.md`) is that section's other case: not an artifact here, it stays loose. Note the branch you are on.
2. **Resolve `<feature>` once**: slugify this epic issue's title exactly as `ship`'s *Build it* does. `<epic-branch>` is then the exact name `docs/agents/solve.md` -> **Branching** gives for that `<feature>`, never a pattern match over the remote's branches: another epic's branch must not read as this one's. Never re-slugify.
3. **Cut the branch** with the **start the epic branch** operation from `docs/agents/solve.md` -> **Branching** (**no such file** -> `setup/REFERENCE.md`'s **Branching operations**, same one-line note as for tracker operations), not a `git switch -c` of your own. The artifacts ride across the switch.
4. **Commit by path**: `git add -- <artifact paths>`, then `git commit -m "<feature>: design artifacts" -- <artifact paths>` - nothing else loose comes along, and this is the branch's first commit. Then `git push`.
5. **Verify the push**: `git ls-remote origin <epic-branch>` returns the commit you just made (`git rev-parse HEAD`). Until it does, nothing below happens.
6. **Switch back** to the branch you started on. The epic branch is never left checked out (`ship` may need it for the epic's worktree, and git refuses a second checkout), and the artifacts are no longer loose in the tree.
7. **Mark it ready**: if the epic issue is still open, `gh issue edit <epic> --add-label solve:epic:ready` (harmless to repeat). A missing label is reported with a pointer to `/solve:setup` - never created here; the branch is already pushed.

Re-running is safe, and each case is decided before touching anything:

- **Branch absent** -> steps 3-7.
- **Branch present with the artifacts** (every artifact is already on it unchanged, or none is loose and it carries artifact paths beyond `origin/<base>`) -> no commit, nothing duplicated; go to step 7.
- **Branch present with no commits of its own** (its tip is `origin/<base>`'s tip or an ancestor of it) **and the artifacts still loose** (an earlier run died between steps 3 and 4: the branch was cut and pushed, the commit never landed) -> switch to it if the tree isn't on it already, and continue at step 4. If the tree already is on it, the branch you started on is `<base>` (the dead run's starting branch is unknowable): step 6 returns there, so the epic branch is never left checked out.
- **Branch present without them** (its tip is past `origin/<base>` and lacks the artifacts), or **the artifacts already on `origin/<base>`** -> stop, say which, change nothing, and wait. Never switch an existing branch with changes that don't belong there, and never skip silently.
- **No artifacts loose and no branch** -> nothing to hand off; say so and stop.

## Next step

`ship` - take each startable ticket to done: claim it, build it, close the loop.
