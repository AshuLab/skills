---
name: recap
argument-hint: "[what the next session will focus on]"
description: Package the conversation so another agent can pick it up cold - what got decided and why, what was ruled out, where things stand, what comes next. Reach for it when you're stopping and something else continues - a new session, another machine, a different tool. The reader has no transcript, so it has to stand on its own.
---

# recap - hand the conversation to whoever comes next

Written for an agent that wasn't here. No transcript, no memory of this session, no
idea what was already tried. If it can't be read off the repo and it isn't in this
text, it's gone.

Given a focus for the next session, build the document around it - what that work
needs, rather than an even summary of everything.

Five things the instinct gets wrong:

- **It's not a story.** The order things happened in is the one thing the reader
  doesn't need. Write the state the conversation arrived at, not the path to it.
- **Every decision carries its reason.** A decision without its why gets
  re-litigated in the first five minutes.
- **What lost, and why it lost.** The part nobody writes and the costliest to lose -
  without it the next agent walks back into the same dead ends.
- **Say what's broken.** Anything failing, unverified, or believed-but-unchecked
  goes in and gets labelled as such. A recap of only the good parts is a trap.
- **Don't restate what's already written.** A spec, an issue, a commit, a diff -
  point at it by path or URL. Copying it in creates a second version that is stale
  by tomorrow.

Be exact - paths, names, numbers, commands, versions. "We updated some of the
config" is worth nothing to a reader who can't see the screen. End on one concrete
next step, a step and not a direction.

Goes to the chat as a single block ready to paste, plus a copy in the OS temp
directory so it outlives the session - never into the workspace. Strip secrets on
the way out (keys, tokens, passwords, personal data), because this text leaves the
session and whatever is in it leaves too.
