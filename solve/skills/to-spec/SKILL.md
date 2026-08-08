---
name: to-spec
description: Turn the brief that sharpen left into a final PRD, and decide where each user story gets tested - the call that both to-tickets and tdd depend on. No new interview, just synthesis; if there's no brief yet, sharpen comes first. Produces a clean local spec, or publishes it as an epic issue when the tracker is GitHub.
---

# to-spec - the brief becomes a PRD, with the seams decided

`sharpen` left a brief at `docs/specs/<feature>.md` (`Status: sharpening`) with
Problem, Direction, Out of scope and Open questions. Your job is to **transform**
it into a final PRD - no new interview, just synthesis. If there's no brief yet,
stop and run `sharpen` first.

Follow the canonical structure in `SPEC-FORMAT.md` (next to this file). Consume
the brief, don't stack sections next to it:

- Keep **Problem** and **Out of scope** as they are.
- **Fold Direction into Solution** - write the detailed Solution and delete the
  Direction section; Solution supersedes it.
- Resolve **Open questions** - answer them into Decisions/Solution, or, if one is
  still genuinely open, keep only that. A final spec carries no stale scaffolding.
- Add **Scope** (numbered user stories) and **Decisions** (testing seams).
- Flip `Status` to `spec`.

## The one thing to get right: testing seams

A **seam** is where a test can drive and observe a module's behavior through the
same interface its callers use - without modifying the module itself. Before
writing, look at the repo and propose where tests go per user story: prefer
existing seams, and pick the broadest one that still isolates the story - the
interface covering the most behavior behind the smallest surface, so the fewest
tests still pin it down. "This story ships without tests" is a valid, explicit
choice, not a gap. Record the call either way - `to-tickets` and `tdd` both rely on
it.

## Where the spec lives

By the repo's tracker mode (declared in `docs/agents/solve.md`; absent -> local):
- **local** -> the completed file at `docs/specs/<feature>.md` is the spec.
- **github** -> the PRD becomes the **epic issue**:
  - brief has `Source: owner/repo#NNN` -> **update that issue** (it matures into the
    epic, no duplicate): `gh issue edit NNN --body-file <spec> --add-label solve:epic`
    (keep whatever milestone/labels it already has).
  - no source -> create it:
    `gh issue create --title "<feature>" --body-file <spec> --label solve:epic`

  **Strip what the issue already provides natively.** The on-disk template carries
  a `# <feature>` H1 and a `Status:` / `Source:` header only because plain markdown
  has no title or front-matter fields - a GitHub issue has both. Push a body
  *without* those lines: the H1 duplicates (and can contradict) the issue title,
  `Status: spec` is redundant with `solve:epic`, and `Source: #NNN` inside issue
  #NNN is self-referential. Keep them only in the on-disk file if you retain it.

  The epic is where the feature's properties live - discover what the repo has and
  offer it, don't guess:
  - **Milestone** - discover the repo's open milestones first
    (`gh api repos/{o}/{r}/milestones --jq '.[] | {title, due_on}'`). If any exist,
    offer them via one `AskUserQuestion`: **"None"** plus the most relevant few by
    due date - with "None" that's >=2 options (the tool caps at 4 and rejects a
    single-option question; free-text **"Other"** creates a new one, so no explicit
    "create new"). None exist -> skip the picker, leave it unset. Long list -> ask
    in prose. New name -> `gh api repos/{o}/{r}/milestones -f title=...`.
  - **Labels** - `solve:epic` is always on. List the repo's labels
    (`gh label list`) and offer the relevant ones the same way: show the picker
    only if >=2 apply; if just one obvious label applies, add it silently.
  Native basics only - no Projects v2, no custom fields. `to-tickets` carries the
  milestone onto every slice (labels stay on the epic) and hangs the slices off this
  epic. Keep the file too if you want
  the PRD versioned in git.

## Next step

`to-tickets` - break the PRD into vertical slices.
