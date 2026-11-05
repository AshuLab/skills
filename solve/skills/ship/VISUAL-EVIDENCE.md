# Visual evidence for the integration PR

A reviewer reads a UI change faster in a picture than in a diff. When the epic changes what a user sees, the integration PR carries a before/after for each affected view. ship owns *that the evidence exists and is honest*; how to start and drive the app comes from the repo (README, scripts, `AGENTS.md`/`CLAUDE.md`) and whatever browser or simulator skill the session has.

## Does it apply

Decide once, at the end of the drain, before opening the integration PR:

- **The repo has no UI** (a library, a CLI, a service) -> skip this file. Nothing goes in the PR.
- **The repo has a UI, the epic doesn't touch it** -> the PR body gets one line, `Visual evidence: n/a - <why>`, and you're done. "Doesn't touch it" is judged on the whole epic diff, not on the slice reports.
- **The epic changes what a user sees** -> everything below.

## Which views

Start from the slices' optional `uiImpact` lists (*Delegate the build*), then check them against the epic diff (`git diff <baseline>...origin/<epic>`) and the spec's acceptance scenarios. Add what a slice couldn't see: a shared component, stylesheet, asset, dependency or config change moves views nobody listed.

Capture **states**, not just pages: each scenario's visible outcome, plus the empty, error and loading states the epic added. A new view has an *after* and no *before* - say "new". A removed view has a *before* and no *after*. Viewport or theme variants only when the epic is about them.

## Capture

Neither shot touches a tree you're working in. Both are exports of an exact commit, the same move as *Close the loop*'s "did I break it" check.

- **Baseline** - where the epic started, derived from git, not remembered:

  ```
  git rev-parse $(git rev-list --reverse --first-parent origin/<epic> ^origin/<destination> | head -1)^
  ```

  The oldest commit that is on the epic and not yet in its destination, then its parent. Unlike `git merge-base`, it doesn't move if the base was merged into the epic mid-drain. The epic's first commit is the design artifacts (docs only), so the parent is the code the epic started from.
- **After** - `origin/<epic>` as it stands.

For each: `git archive <sha> | tar -x -C <scratch dir>`, link the gitignored config the app boots on (`.env*`, never copy - [WORKTREES.md](./WORKTREES.md) -> *Making it runnable*), install, start the app, capture. Put the PNGs in a scratch dir **outside** any repo, named `<view>-before.png` / `<view>-after.png`. Delete the exports when you're done.

Do it in a subagent: screenshots and server logs are exactly the bulk the draining agent's context shouldn't carry. It returns the list of view, state and file paths, and anything it couldn't capture.

**Bounded.** The app doesn't come up after a couple of honest attempts, or the baseline can't run against what exists today (a migration the old code can't read), or a view needs access the run doesn't have -> stop trying and record the gap. A missing shot is reported as missing; never substitute a mock, a hand-edited screenshot or the wrong build.

**Data.** Seed or fake data only. Look at every image before it ships: a token, an email, a customer name or a real record in a screenshot is published to everyone who can read the PR.

## Publish

GitHub hosts the images. `gh pr create` and `gh pr edit` take `--attach <file>#<alt text>` and rewrite a matching `![alt](./file.png)` in the body to the uploaded asset (a `gh` without `--attach` -> record the gap). Write the body to a file **next to the PNGs** - the references resolve relative to it:

```
## Visual evidence

Baseline `<short sha>` -> epic tip `<short sha>`.

| View / state | Before | After |
|---|---|---|
| Settings > Billing | ![before](./billing-before.png) | ![after](./billing-after.png) |
| Export dialog (error) | new | ![after](./export-error-after.png) |

Not captured: <view> - <why>.
```

`gh pr create --draft --body-file <dir>/body.md --attach <dir>/billing-before.png ...`, one `--attach` per image. Adding a state after the PR exists: `gh pr edit <pr> --attach ...`.

One short line under the table for anything the reviewer should know that a picture can't show (a hover state, an animation). No narration of what the pictures already show.

## The gate

ship doesn't report the epic ready until, reading the PR back (`gh pr view <pr> --json body`):

- a `## Visual evidence` section is there, with every row either two images, or one image and "new"/"removed", and
- every image URL is a GitHub-hosted one (no `./file.png` left unrewritten), and
- anything not captured is named under *Not captured*, with the reason.

Not met -> the report opens with the concrete gap ("billing view: baseline wouldn't boot, needs migration 0042") and doesn't call the PR ready for review. A gap isn't a failed drain - the code is delivered, the evidence isn't - but it is never glossed over.
