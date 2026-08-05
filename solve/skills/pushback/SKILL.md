---
name: pushback
disallowed-tools: AskUserQuestion
description: Push back on an idea, plan or decision until it holds up - relentlessly, one question at a time, walking the tree of decisions outward from the problem. Leaves no artifact and starts no flow - reach for it when you just want the thinking stress-tested. To carry an idea all the way to a spec, use sharpen, which runs this and then writes the brief.
---

# pushback - resist the idea until it holds up

Your job is to make the thinking hold, not to be agreeable. Nothing gets written by
default and there's no next step - when the questions run out, you're done. If the
idea is meant to end up as a spec, that's `sharpen`, which does this and then leaves a
brief behind.

## The shape of it

Pushing back isn't a list of questions, it's a walk through a tree. **The root is the
problem** - not the plan, not the feature. Decisions are branches hanging off it, and a
branch grown from a misread problem is wasted however well you argue it, so the root
gets settled first: what actually hurts, for whom, how we know. People bring a solution
in disguise; separating the two *is* finding the root.

From there one rule drives the walk - **only ask what's answerable now**. A question
whose answer depends on something still open belongs to a later pass; what remains is
the **frontier**, the decisions whose prerequisites are already settled. The rest of
the method falls out of that:

- **Prune before expanding.** With the problem clear, the next question is never "how
  do we build it?" but "does this need building at all?" - doing nothing, or reusing
  what already exists, cuts whole branches before you cost them out.
- **The frontier is usually one node wide**, which is why you ask one question at a
  time - each answer is what opens the next. When it genuinely widens, several open
  decisions that don't touch each other, ask them in one numbered round so the reply
  comes back as "1 yes, 2 the second one". Strict test - if one answer could reshape
  another, they were never independent.
- **An unsettled prerequisite blocks its subtree, not the walk.** A fact you're still
  fetching, or a term too vague to reason about, holds up only what hangs off it - keep
  working the rest of the frontier meanwhile.
- **A contradiction un-settles a node.** When a new answer clashes with an earlier one,
  say so ("earlier you said X, now Y - which holds?"): that node reopens and the
  branches under it return to the frontier. The clash is signal - the thinking moved,
  or the problem was never clear.

## Working the frontier

- **Look facts up, don't ask them** - only *decisions* are the user's. Dispatch
  anything slower than a grep (a background `Agent`, or `research` for primary
  sources) and keep asking what doesn't depend on it.
- **Pin vague terms down.** When a boundary won't hold still, probe with a **concrete
  scenario** - an edge case that forces the concept's edges into the open.
- **Say where you lean on design nodes** - your read as a hypothesis to attack ("I'd
  derive 'liquidated' from `receipt_id` rather than a separate `status` field - what
  breaks that?"), not a verdict to nod at. Problem and domain nodes work the other
  way: the answer lives with the user, so there you ask and listen.
- **No `AskUserQuestion`** - a closed button can't hold "I'd change the approach".
  Every question in prose. The frontmatter blocks it; the rule holds regardless.

## When you stop

When the frontier is empty - and empty means something specific: the problem is clear,
the scope has an edge, risky assumptions are named, hard decisions recorded. Not "we've
talked enough", and not a frontier you stopped looking at.

What's left over are the nodes conversation can't settle at all - they need evidence
instead of more talk: `research` for a missing fact, `prototype` for a design question
paper can't answer. Name those as open and stop there; don't fake a resolution to tidy
the ending.

## Leave a trail if it earns one

Nothing here writes a file by default - that's the point of reaching for this instead
of `sharpen`. But a term you had to pin down, or a decision that turned out hard to
reverse, outlives the conversation while the conversation doesn't: hand it to `vocab`
for a glossary entry or an ADR. Cheap, and only for what earned it.
