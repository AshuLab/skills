---
name: pre-check
description: Optional gate you run on a written spec or ticket before it advances — to confirm it still applies today and to do the operational prep (tags, milestone, and the handoff notes the next step needs). It does NOT re-grill the fundamentals (sharpen already did that); it checks freshness + redundancy against the current codebase. Run it when there's distance from when the idea was sharpened; skip it when you just sharpened and are building now.
---

# pre-check — optional freshness + prep gate

A gate you *choose* to run on something already written — a spec (the PRD/epic)
or a ticket (a slice/issue) — before it advances.

## When to run it (and when to skip)

Run it when there's **distance** between the thinking and the building:
- **Time** — the spec/ticket sat a while; the codebase moved underneath it.
- **Origin** — it didn't come from `sharpen` (someone else's issue, a handed-down
  ticket), so nothing has validated it yet.

Skip it when you just sharpened the idea and you're building it now — `sharpen`
already validated the fundamentals; re-checking would just be repetition.

## It does NOT re-grill

If it came from `sharpen`, assume the fundamentals hold — don't re-run the
grilling. `pre-check` looks only at what `sharpen` couldn't:

**1. Freshness.** Does it still apply *today*?
- The codebase may have moved — already done, partly done, or moot now.
- Redundant? Search the code: already solved, or a duplicate?
- (If it never went through `sharpen`, then check the fundamentals too — nobody
  else did.)

**2. Operational prep.**
- Set the right tags / labels.
- Decide milestone membership, and set it.
- Leave what the next step needs — context, links, the definition of done.

If it no longer holds, kick it back with the reason — don't wave it through.

## Output

Ready to advance:
- a **spec** (the epic) → on to `to-tickets`. No `solve:ready` — that label marks
  a grabbable *slice*, and an epic isn't one (it'd pollute
  `gh issue list --label solve:ready`); its `solve:epic` already says what it is.
- a **ticket** (a slice) → on to `ship`. In github mode make sure `solve:ready` is
  on it — `to-tickets` already sets it, so add it only for a handed-down ticket
  that arrived without it.

`pre-check` never writes code.
