---
name: file-issue
description: Park a problem you ran into while working on something else - write it up as a GitHub issue so it's on record and you can come back to it later, without fixing it now or leaving the task at hand. Use it when you find a bug, a gap or a smell you won't deal with in this change. Shows the issue for approval before publishing. Not a ticket - it's raw material for sharpen or diagnose when someone picks it up.
---

# file-issue - park a finding, keep working

You hit something that isn't this task's job.
This puts it on record as one GitHub issue, then you go back to what you were doing.
It doesn't fix it, doesn't investigate it, and doesn't enter the flow.

## What it files (fixed)

A **raw report**: what was seen, where, and why it's not being dealt with now.
Not a slice - no definition of done, no `solve:ticket`, no `solve:refined` - so `ship` never picks it up by accident.
Not a solution either: `sharpen` treats an issue as raw material and grills it, so a to-do list in the body only anchors whoever reads it later.
If you have a hunch about the cause or the fix, say it once, marked as a hunch.

## 1. Gather from the conversation

Everything the issue needs is usually already here. Pull it out, don't interview:

- **What** - the symptom, in one or two lines. What you saw, not what you think causes it.
- **Evidence** - the error text, the command and its output, the input that triggers it. Verbatim, trimmed to what matters.
- **Where** - the area, and a pointer (file, symbol, endpoint) if you have one. Say it's a pointer: code moves.
- **Why not now** - out of scope for this change, needs its own decision, blocked on something. One line.
- **Found while** - the branch, PR or issue you were on, if any.

A quick look to make the report accurate is fine (re-run the command, open the file you're pointing at).
Anything more is `diagnose`'s job, and the point here is to not leave the task.
If one fact is missing and it would change what the issue says, ask once, in prose. Otherwise write it without.

Never put secrets, tokens or customer data in the body - the issue is outward-facing and gets indexed. Redact and say so.

## 2. Check it isn't already filed

`gh issue list --state open --search "<2-3 keywords from the symptom>"`.
A close match -> show it and offer a comment on that issue instead of a duplicate; the user decides.

## 3. Draft and show

```markdown
# <title: the symptom, not a guess at the cause>

## What
What happens, and when.

## Evidence
Verbatim output / repro, or where it shows up.

## Where
Area and pointer. (Pointers can go stale.)

## Why it's parked
Why this isn't being dealt with now.

## Found while
Branch / PR / issue, or: nothing in particular.
```

Write the prose as flowing lines - one line per paragraph, not hard-wrapped to a fixed width.
Write it in the language the repo's existing issues use.
Skip a section that has nothing to say instead of padding it.

Show the title and body and wait for the go-ahead - publishing is outward-facing, and you may want to reword it.
Adjust from the reply; never publish off a first draft.

## 4. Publish

Read `docs/agents/solve.md` -> **Tracker** for the repo. **No such file** means the repo never ran `setup`: infer `owner/repo` from the git remote and carry on - say so once, don't stop, don't write a config file. No GitHub remote -> stop and say so.

```
gh label create solve:parked --color d4c5f9 --description "Found along the way, not for now" --force
gh issue create --title "<title>" --body-file <draft> --label solve:parked
```

Write the draft to `$TMPDIR`, not the repo.
No `--parent`, no `--blocked-by`, no milestone: a parked issue belongs to no epic until someone sharpens it.
Return the issue URL and go back to the task - one line, then continue what you were doing.

## Next step

Whenever someone picks it up: `sharpen <issue>` if what to do about it is still open, or `diagnose` if it's a bug and the cause isn't known.
List what's parked with `gh issue list --label solve:parked`.
