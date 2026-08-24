---
name: prototype
description: Build a throwaway thing to settle a design question that talk can't answer - "does this state model feel right?", "how should this read?". Usually code, but a mockup, a one-page draft or a spreadsheet if the question isn't about software. Feeds sharpen; the output is a decision, not the thing. Disposable from day one.
---

# prototype - a throwaway thing to settle a design question

Reach for this when the questioning - `sharpen`, or `follow:pushback` on its own - hits a design question that talk can't settle.
Build the smallest thing that answers it, then throw it away.

## Build whatever answers the question fastest

- **Code** - a small script, or UI variants side by side - when the question is about software (how a state model feels, how a screen reads).
- **Not code** - a mockup, a one-page draft, a spreadsheet, a storyboard - when the question isn't (does this flow make sense? does the pitch hold up?).

## Make it viewable

A prototype nobody looks at settles nothing.

- **One entry point, not N loose files** - if it's variants side by side, put them all on one page (columns, or links between them), not separate files the user has to hop between.
- **`file://` first** - plain HTML/CSS/JS with no `fetch` or module imports opens straight from disk, nothing to start or kill.
- **A server only when the question needs it** - `fetch`, module imports, or hitting something local don't work over `file://`; spin up whatever's on hand, and kill it once the question is answered.
- **Open it yourself when you can** - run the OS's native opener (`open` on macOS, `xdg-open` on Linux) instead of just handing over a path and hoping.
- **End on the exact path or URL** - not "check the temp folder."

## Throwaway from day one

- **`$TMPDIR` by default, never the repo** - same as any scratch in this set.
- **Exception: it needs the repo's own build or dependencies** (e.g. UI variants that only run through the real toolchain) - a throwaway branch instead, never merged, deleted once the question is answered.
- Just enough to answer ONE question. No polish, no persistence, resist scope creep.

## The output is a decision, not the thing

When the question is answered, the answer goes back to whoever asked - into `sharpen`'s brief, or an ADR via `vocab` if it's hard-to-reverse.
