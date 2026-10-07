# ashulab

Ashu Lab's provider-neutral skill sets for real engineering work, not vibe coding.

## Install

Claude Code:

```
/plugin marketplace add AshuLab/skills
/plugin install solve@ashulab
/plugin install follow@ashulab
/plugin install solve-mod@ashulab   # optional: a live pane for the solve flow, Claude Code only
```

Codex native plugins, from this checkout:

```
codex plugin marketplace add .
codex plugin add solve@ashulab-local
codex plugin add follow@ashulab-local
```

Antigravity, from a clone - no marketplace, so `git pull` and reinstall to update:

```
git clone https://github.com/AshuLab/skills
cd skills
agy plugin install ./solve
agy plugin install ./follow
```

Codex and other agents, skills-only for either set:

```
npx skills@latest add AshuLab/skills
```

Pick the skills you want when the installer prompts you. Claude Code invokes them as `/solve:<name>` or `/follow:<name>`; standalone Codex skills use `$<name>`. The native Codex plugins expose skills under the `solve:` / `follow:` namespace.

## Plugins

| Plugin | What it's for |
|---|---|
| **[solve](./solve)** | Idea -> shipped, in phases with clear boundaries: `sharpen -> to-spec -> to-tickets -> ship -> land`, plus `tdd` / `code-review` / `code-post` / `code-resolve` as discipline tools, `research` / `prototype` to feed the thinking, `diagnose` as an on-ramp for bugs, and `file-issue` to park a finding for later. |
| **[follow](./follow)** | Make something legible, not build it: `plain` re-says the last message at a level you can follow, `brief` cuts a long doc/issue/URL down to what it actually wants, `zoom-out` shows the shape of the whole conversation, `recap` packages it for the agent that picks it up next. |
| **[solve-mod](./solve-mod)** | A live pane for the solve flow, as a Claude Code mod rather than skills: `/solve-pane` shows where each brief and epic stands from `sharpen` to `land` - the route, the slices and their PRs, what went quiet, what to run next. Read-only, and Claude Code only. |

See each plugin's README for its design principles and skill map.

## License

MIT
