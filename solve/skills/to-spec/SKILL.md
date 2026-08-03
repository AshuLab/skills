---
name: to-spec
description: Consume the brief that sharpen left into a final PRD — no new interview, just synthesis. Use it once an idea has been grilled with sharpen and you want to formalize it before breaking it into tickets. Produces a clean local spec, or publishes an epic issue when the tracker is GitHub.
---

# to-spec — consume the brief into a final PRD

`sharpen` left a brief at `docs/specs/<feature>.md` (`Status: sharpening`) with
Problem, Direction, Out of scope and Open questions. Your job is to **transform**
it into a final PRD — no new interview, just synthesis. If there's no brief yet,
stop and run `sharpen` first.

Follow the canonical structure in `SPEC-FORMAT.md` (next to this file). Consume
the brief, don't stack sections next to it:

- Keep **Problem** and **Out of scope** as they are.
- **Fold Direction into Solution** — write the detailed Solution and delete the
  Direction section; Solution supersedes it.
- Resolve **Open questions** — answer them into Decisions/Solution, or, if one is
  still genuinely open, keep only that. A final spec carries no stale scaffolding.
- Add **Scope** (numbered user stories) and **Decisions** (testing seams).
- Flip `Status` to `spec`.

## The one thing to get right: testing seams

A **seam** is where a test can drive and observe a module's behavior through the
same interface its callers use — without modifying the module itself. Before
writing, look at the repo and propose where tests go per user story: prefer
existing seams, and pick the broadest one that still isolates the story — the
interface covering the most behavior behind the smallest surface, so the fewest
tests still pin it down. "This story ships without tests" is a valid, explicit choice, not a gap.
Record the call: `to-tickets` and `tdd` rely on it.

## Where the spec lives

Read `.solve/config.yml`:
- **local** (or no config) → the completed file at `docs/specs/<feature>.md` is
  the spec.
- **github** → the PRD becomes the **epic issue**:
  - brief has `Source: owner/repo#NNN` → **update that issue** (it matures into the
    epic, no duplicate): `gh issue edit NNN --body-file <spec> --add-label solve:epic`
    (keep whatever milestone/labels it already has).
  - no source → create it:
    `gh issue create --title "<feature>" --body-file <spec> --label solve:epic`

  **Strip what the issue already provides natively.** The on-disk template carries
  a `# <feature>` H1 and a `Status:` / `Source:` header only because plain markdown
  has no title or front-matter fields — a GitHub issue has both. Push a body
  *without* those lines: the H1 duplicates (and can contradict) the issue title,
  `Status: spec` is redundant with `solve:epic`, and `Source: #NNN` inside issue
  #NNN is self-referential. Keep them only in the on-disk file if you retain it.

  The epic is where the feature's properties live — discover what the repo has and
  offer it, don't guess:
  - **Milestone** — only if the repo already has some. Offer them via one
    `AskUserQuestion`: **"None"** plus the most relevant few by due date — with
    "None" that's ≥2 options (the tool caps at 4 and rejects a single-option
    question; free-text **"Other"** creates a new one, so no explicit "create
    new"). No milestones yet → skip the picker, leave it unset. Long list → ask in
    prose. New name → `gh api repos/{o}/{r}/milestones -f title=...`.
  - **Labels** — `solve:epic` is always on. Offer other relevant ones the same way:
    show the picker only if ≥2 apply; if just one obvious label applies, add it
    silently.
  Native basics only — no Projects v2, no custom fields. `to-tickets` inherits these
  onto every slice and hangs the slices off this epic. Keep the file too if you want
  the PRD versioned in git.

## Next step

`to-tickets` — break the PRD into vertical slices.
