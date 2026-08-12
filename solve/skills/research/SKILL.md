---
name: research
description: Investigate a question against primary sources and save the findings as a markdown file in the repo. Runs as a background agent so you keep working. Primary sources only - official docs, source code, specs, first-party APIs. Feeds sharpen; it informs the thinking, it doesn't replace it.
---

# research - investigate against primary sources, in the background

Delegate the reading to a background `Agent` while you keep working; it comes back with a markdown file, not a chat answer.
The agent reads the official docs directly via `WebFetch` / `WebSearch`.

## Primary sources only

Official docs, source code, specs, first-party API references.
Not blog posts, not memory, not a summary of a summary.
If a claim can't be traced to a primary source, it doesn't go in.

## The output

Save to `docs/research/<topic>.md`.
Every claim cites its source inline.
Lead with the answer, then the evidence.
Flag what's uncertain or contradictory rather than smoothing it over.
Write it as flowing prose - one line per paragraph, not hard-wrapped to a fixed width.

## Where it goes

Feeds the questioning - `sharpen`, or `follow:pushback` on its own: read the findings, then grill the idea against them.
Either one can dispatch this mid-flight and keep asking whatever doesn't depend on the answer.
