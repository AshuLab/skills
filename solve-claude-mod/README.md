# solve-claude-mod

A **mod** for Claude Code: a live pane that shows where each idea and epic of the [solve](../solve) flow stands, from `sharpen` to `land`, and what to run next.
It only reads. It never edits an issue, a PR or a file, and it never sends a prompt for you.

Mods run only in Claude Code (the terminal and the Desktop app's Code tab). Nothing here works in Codex or Antigravity, which is why this is its own plugin and not part of `solve`: the skills stay portable.

## Install

Needs Claude Code **2.1.287 or later** (built and tested on 2.1.292), `gh` logged in, and a GitHub repo that uses the solve labels (`/solve:setup` creates them).

```
/plugin marketplace add AshuLab/skills
/plugin install solve-claude-mod@ashulab
```

Then run `/solve-pane` in a repo that uses solve.

A mod is code that runs with your permissions. To see what this one does before loading it: `claude plugin validate ./solve-claude-mod` lists every event it hooks and every call it makes.

## What you see

```
┌  #41 Billing export
│  opened 2d 0h ago · active 1h ago
│  ━━━━━━━━────────────  1/5 slices
│  1 done · 1 running · 1 blocked · 2 waiting
│
●  sharpen
│
●  to-spec
│  #41 opened                              10-05 09:30
│
●  to-tickets
│  5 slices cut                            10-05 10:10
│
◒  ship
│  ●  #42  PR #55 ●   Schema for export jobs (closed 20h ago)
│  ◒  #43  PR #56     Export endpoint (in progress, claimed 40m ago)
│  ⏸  #44             CSV writer (blocked by #43)
│  ◆  #45             Settings page toggle (next)
│  ○  #46             Email the finished export (not refined)
│
○  land
│
└  [ use /solve:ship #41 ]                 [ ↻ ] [ ‹ ] 1/3 · +1 brief [ › ]
r refresh · p/n switch · esc back to prompt  ·  updated 14:03:22
```

The pane follows one flow at a time (the epic being drained, else the one touched last, else a brief). `p` and `n` walk through all of them.

**Header.** The epic (a link to its issue), how long it has been open and how long since anything moved, a bar with one segment per slice (green done, amber in progress, grey still to come), a count by state, and a red line for each slice that went quiet.

**The route.** The five stations of the flow, with what hangs from each: the dates for `to-spec` and `to-tickets`, one row per slice under `ship` (with its PR in a column of its own), the integration PR at `land`.

| Symbol | Meaning |
|---|---|
| `●` green | done |
| `◒ ◐ ◓ ◑` | running now (it turns) |
| `◆` | waiting on you |
| `▲` | stalled: claimed, but no activity for 3 hours |
| `⏸` | blocked by another slice |
| `○` | still to come |

**Before there is an epic.** A brief (`docs/specs/<name>.md` with `Status: sharpening`) gets the same rail, with `sharpen` as the current station: its title, when it was written, its `Source:`, how many open questions it still lists, and the ADRs and glossary edits sharpen left uncommitted.

**The footer.** `use` puts the next command in the prompt (never sends it: running `ship` or `land` stays your call; with a draft already there it copies the command instead), `↻` reloads now, and the line under it names the keys that work at that moment and when the data is from.

When something changes (a slice closes, one goes quiet, the integration PR opens) a toast says so. If a refresh fails, the pane keeps the last data and says when it is from.

Where nothing draws (the VS Code panel, `claude -p`, cloud sessions) `/solve-pane` answers in plain text instead.

## Where the data comes from

| What | From |
|---|---|
| Epics, slices, blockers, who claimed what | `gh issue list` on the `solve:epic` and `solve:ticket` labels |
| PRs, and which slice or epic each closes | `gh pr list`, through the `Closes #<n>` each PR carries |
| When a slice was claimed | `gh api .../issues/<n>/timeline`, only for slices that are claimed |
| Briefs and their open questions | `docs/specs/*.md` |
| ADRs and glossary edits sharpen left | `git status` on `docs/adr` and `docs/glossary.md` |

It refreshes every 60 seconds once you have run `/solve-pane` in the session, and not before. Titles and file names are cleaned of control characters before they reach the terminal, and only `https` links are drawn as links.

## Limits

- **The stalled threshold is fixed at 3 hours.** A slice that builds for longer without touching its issue or its PR looks stalled.
- **There is nothing to show while you are still talking an idea through.** Until `sharpen` writes the brief there is no file and no issue.
- **The ADR count is for the whole repo.** Two briefs open at once show the same pending set, because git does not say which brief an ADR belongs to.
- **Checked against a fake `gh`, not yet against a real epic drained end to end.** The tests cover the logic and the drawing on the terminal and the desktop; the shapes `gh` returns were checked against this repo's own issues and PRs.
- The validator warns that the name reads as one of Anthropic's own. It is a warning, not an error.

## Working on it

```
claude --plugin-dir ./solve-claude-mod     # loads it, reloads on save
claude plugin validate ./solve-claude-mod
claude plugin test ./solve-claude-mod
```

Develop against the directory, not an installed copy: Claude Code caches an installed plugin by version, so bump `version` in `.claude-plugin/plugin.json` for an edit to reach installed users. Claude Code writes `.claude-plugin/types/` and a `tsconfig.json` next to a mod it loads (git ignores them); `tsc -p ./solve-claude-mod` type-checks against them.

The logic that decides what to show (stage, stalled, counts, the route, what changed) is plain functions in `hooks/flow.ts`, with its tests beside it. `hooks/register.tsx` only fetches and draws.
