---
name: brief
disable-model-invocation: true
description: Read something long and text-only you were pointed at - a doc, a GitHub issue, a URL, a wall of pasted text - and give back what's under it in plain words - what they want done, why, and how they expect it, with the padding cut. Reach for it when the thing is long, dense or LLM-bloated and you need the intent fast. For re-saying the assistant's own last message simpler, that's plain.
---

# brief - what a long text actually wants

Someone points you at something long and text-only - a doc, a GitHub issue, a URL, a
wall of pasted text - and you need what's under it: the ask, the reason, how they
expect it done. Long and LLM-padded is the norm now; the length is not the signal.
Pull it in and read all of it before cutting - you can't tell padding from signal
until you've seen it all - and give it back in the reader's language.

Four things the instinct gets wrong:

- **The ask, not the tour.** What does it want to happen - usually one thing, buried
  under background and justification. Lead with that, not with section one.
- **Split the ask from the proposed fix.** It arrives as a solution in disguise; the
  reason it exists is the problem, not the implementation it came dressed in. Keep
  the two apart.
- **Don't invent clarity.** Where the document is vague about what it wants, stay
  vague and say so - mark what they ask, what you're inferring, and what it never
  says. A clean, confident brief that reads clearer than the source is worse than the
  source.
- **Cut the padding, keep the caveat.** Restated context and generated filler go; a
  real constraint, deadline or risk stays, even when it's buried. Shorter, never
  lossy on what matters.

Straight to the chat, no file. Write it as one person telling another what this
says - plain words over jargon, notes over prose, short enough to take in at once.
No preface.
