---
name: pre-check
description: Optional gate you run on a written spec or ticket before it advances - to confirm it still applies today and to do the operational prep (tags, milestone, and the handoff notes the next step needs). Checks freshness + redundancy against the current codebase; grills fundamentals only if the artifact never went through sharpen. Run it when there's distance from when the idea was sharpened; skip it when you just sharpened and are building now.
---

# pre-check - optional freshness + prep gate

A gate you *choose* to run on something already written - a spec (the PRD/epic)
or a ticket (a slice/issue) - before it advances.

## When to run it (and when to skip)

Run it when there's **distance** between the thinking and the building:
- **Time** - the spec/ticket sat a while; the codebase moved underneath it.
- **Origin** - it didn't come from `sharpen` (someone else's issue, a handed-down
  ticket), so nothing has validated it yet.

Skip it when you just sharpened the idea and you're building it now - `sharpen`
already validated the fundamentals; re-checking would just be repetition.

## It does NOT re-grill

If it came from `sharpen`, assume the fundamentals hold - don't re-run the
grilling. `pre-check` looks only at what `sharpen` couldn't:

**1. Freshness.** Does it still apply *today*?
- The codebase may have moved - already done, partly done, or moot now.
- Redundant? Search the code: already solved, or a duplicate?
- (If it never went through `sharpen`, then check the fundamentals too - nobody
  else did.)

**2. Operational prep.** What there is to prep depends on the repo's tracker mode
(declared in `docs/agents/solve.md`; absent -> local):
- **github** - set the right labels, and decide milestone membership. Discover what
  the repo actually has before setting either (`gh label list`,
  `gh api repos/{o}/{r}/milestones --jq '.[] | {title, due_on}'`) - never invent a
  label or a milestone name.
- **local** - there are no labels or milestones to set; the ticket file is the whole
  surface.
- Either mode - leave what the next step needs: context, links, the definition of done.

If it no longer holds, kick it back with the reason - don't wave it through.

## Output

Ready to advance:
- a **spec** (the epic) -> on to `to-tickets`. No `solve:refined` - that label marks
  a refined *slice*, and an epic isn't one (it'd pollute
  `gh issue list --label solve:refined`); its `solve:epic` already says what it is.
- a **ticket** (a slice) -> on to `ship`. In github mode make sure `solve:refined` is
  on it - `to-tickets` already sets it, so add it only for a handed-down ticket
  that arrived without it.

`pre-check` never writes code.
