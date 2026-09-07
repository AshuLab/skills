---
name: to-spec
description: Turn the brief that sharpen left into a final PRD, and decide where each user story gets tested - the call that both to-tickets and tdd depend on. No new interview, just synthesis; if there's no brief yet, sharpen comes first. Produces a clean local spec, or publishes it as an epic issue when the tracker is GitHub.
---

# to-spec - the brief becomes a PRD, with the seams decided

`sharpen` left a brief at `docs/specs/<feature>.md` (`Status: sharpening`) with Problem, Direction, Out of scope and Open questions.
Your job is to **transform** it into a final PRD - no new interview, just synthesis.
If there's no brief yet, stop and run `sharpen` first.

Follow the canonical structure in `SPEC-FORMAT.md` (next to this file).
Consume the brief, don't stack sections next to it:

- Keep **Problem** and **Out of scope** as they are.
- **Fold Direction into Solution** - write the detailed Solution and delete the Direction section; Solution supersedes it.
- Resolve **Open questions** - but sort them before answering any, because only some are yours. One you can settle by reading the code, or by taking the option this repo already lives with, is yours to close: answer it into Decisions/Solution, and that's the synthesis. One about what the product should do is the user's: put it to them in prose and wait, exactly as `sharpen` would have. The tell is alternatives that differ in what a user gets rather than in what it costs to build - and being able to argue well for one of them is not evidence it was yours to pick. Whatever is still genuinely open after that, keep only that; a final spec carries no stale scaffolding.
- **A hole surfaces mid-draft, not one sharpen already listed** - if folding Direction into Solution exposes an assumption that was never actually settled, don't invent a Decision to cover it: add it as an Open question and stop for a prose answer, or send the brief back to `sharpen` if the gap changes the framing itself. The same rule that keeps `to-spec` from interviewing you from scratch is what keeps it from quietly answering for you mid-draft.
- Add **Scope** (numbered user stories) and **Decisions** (testing seams).
- **A decision you inline as code gets built literally.** `SPEC-FORMAT` has you inline a snippet where it carries the decision better than prose, and the ticket inherits it - which is the risk, not the feature: prose that's roughly right gets checked against the code, the same claim as an expression gets implemented as written. Before leaving one in, run it against the inputs that story actually takes, especially the wrong-typed and empty ones. A validation expression that holds for well-formed input and quietly passes everything else is the one that gets through.
- Flip `Status` to `spec`.

## The one thing to get right: testing seams

A **seam** is where a test can drive and observe a module's behavior through the same interface its callers use - without modifying the module itself.
Before writing, look at the repo and propose where tests go per user story: prefer existing seams, and pick the broadest one that still isolates the story - the interface covering the most behavior behind the smallest surface, so the fewest tests still pin it down.
"This story ships without tests" is a valid, explicit choice, not a gap.
Record the call either way - `to-tickets` and `tdd` both rely on it.

## Where the spec lives

By the repo's tracker mode (declared in `docs/agents/solve.md`; absent -> local):
- **local** -> the completed file at `docs/specs/<feature>.md` is the spec.
- **github** -> the PRD becomes the **epic issue**:
  - brief has `Source: owner/repo#NNN` -> **update that issue** (it matures into the epic, no duplicate): `gh issue edit NNN --body-file <spec> --add-label solve:epic` (keep whatever milestone/labels it already has).
  - no source -> create it: `gh issue create --title "<feature>" --body-file <spec> --label solve:epic`

  **Strip what the issue already provides natively.**
  The on-disk template carries a `# <feature>` H1 and a `Status:` / `Source:` header only because plain markdown has no title or front-matter fields - a GitHub issue has both.
  Push a body *without* those lines: the H1 duplicates (and can contradict) the issue title, `Status: spec` is redundant with `solve:epic`, and `Source: #NNN` inside issue #NNN is self-referential.

  The epic is where the feature's properties live - discover what the repo has and offer it, don't guess:
  - **Milestone** - discover the repo's open milestones first (`gh api repos/{o}/{r}/milestones --jq '.[] | {title, due_on}'`). If any exist, offer **"None"** plus the most relevant few by due date through the harness's choice UI when available, and prose otherwise. None exist -> skip the question and leave it unset. Long list -> ask in prose. New name -> `gh api repos/{o}/{r}/milestones -f title=...`.
  - **Labels** - `solve:epic` is always on. List the repo's labels (`gh label list`) and offer the relevant ones the same way: show the picker only if >=2 apply; if just one obvious label applies, add it silently.
  Native basics only - no Projects v2, no custom fields.
  `to-tickets` carries the milestone onto every slice (labels stay on the epic) and hangs the slices off this epic.
  Keep the file if you want the PRD versioned in git - the stripped H1/Status/Source lines live there, not in the issue.

## Next step

`to-tickets` - break the PRD into vertical slices.
