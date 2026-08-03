# Templates setup writes

The agent-facing reference that `setup` writes, so an agent opening the user's
repo knows it uses the solve skills. Two pieces:

**Naming rule:** in prose, always write "the solve skill set" / "solve skills" —
never a bare "solve", which reads as the verb "to solve". The technical namespace
(`/solve:…`, `.solve/`, `solve:epic`) stays as is.

## Block for the repo's CLAUDE.md / AGENTS.md

Append to whichever exists (never create the other). Keep it **minimal** — this
lands in a file the model auto-loads every session, so: essentials + the tracker
in one line + the pointer. The detail (labels, paths, `gh` usage) lives in
`solve.md`, not here. Use the variant that matches the tracker; write only that one.

**local** tracker:

```markdown
## solve skills

This repo uses the **solve** skill set — ideas ship through
`sharpen → to-spec → to-tickets → ship` (reach for `tdd` / `code-review` when
they earn it). Tracker: **local markdown under `.solve/`**. Where everything
lives and how it works here → `docs/agents/solve.md`.
```

**github** tracker:

```markdown
## solve skills

This repo uses the **solve** skill set — ideas ship through
`sharpen → to-spec → to-tickets → ship` (reach for `tdd` / `code-review` when
they earn it). Tracker: **GitHub Issues, via the `gh` CLI**. Where everything
lives and how it works here → `docs/agents/solve.md`.
```

## docs/agents/solve.md

A summary (not a copy of the plugin README), filled with the repo's real values.
Write it as flowing prose — one line per paragraph, not hard-wrapped to a fixed
width:

```markdown
# solve skills — how this repo works

Idea → shipped. The flow:
- sharpen — grill a raw idea/doc/issue until the problem holds; leaves a brief
- to-spec — complete the brief into a PRD
- to-tickets — break it into vertical, agent-ready slices
- ship — take a ready ticket to done: claim, build, close the loop (PR);
  reach for tdd / code-review when they earn it

On-ramps: diagnose (bugs) · research / prototype (feed the thinking) ·
pre-check (revalidate a stale spec/ticket) · vocab (glossary + ADRs)

## Where things live here
- PRDs / specs → `docs/specs/` (also the `solve:epic` issue in github mode)
- Glossary + ADRs → `docs/glossary.md`, `docs/adr/` (always files)

## Tracker
Config in `.solve/config.yml`. Keep only the mode this repo uses:
- **local** — tickets are markdown in `.solve/tickets/<feature>/`; blocking is
  textual ("Blocked by").
- **github** — epics and tickets are GitHub Issues in `owner/name`, driven by the
  `gh` CLI. Find work by label: `solve:epic` (PRD), `solve:ticket` (slice),
  `solve:ready` (grabbable now). Slices hang off their epic (`--parent`) with real
  `--blocked-by` deps. List what's ready: `gh issue list --label solve:ready`.
```
