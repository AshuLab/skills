# ashulab

Ashu Lab's provider-neutral skill sets for real engineering work, not vibe coding.

## Install

Claude Code:

```
/plugin marketplace add AshuLab/skills
/plugin install solve@ashulab
/plugin install follow@ashulab
```

Codex native `solve` plugin, from this checkout:

```
codex plugin marketplace add .
codex plugin add solve@ashulab-local
```

`follow` stays as standalone Codex skills because its explicit-only Claude frontmatter is rejected by Codex's native plugin validator.

Codex and other agents, skills-only for either set:

```
npx skills@latest add AshuLab/skills
```

Pick the skills you want when the installer prompts you. Claude Code invokes them as `/solve:<name>` or `/follow:<name>`; standalone Codex skills use `$<name>`. The native Codex plugin exposes solve skills under the `solve:` namespace.

## Plugins

| Plugin | What it's for |
|---|---|
| **[solve](./solve)** | Idea -> shipped, in phases with clear boundaries: `sharpen -> to-spec -> to-tickets -> ship`, plus `tdd` / `code-review` as discipline tools, `research` / `prototype` to feed the thinking, and `diagnose` as an on-ramp for bugs. |
| **[follow](./follow)** | Make something legible, not build it: `plain` re-says the last message at a level you can follow, `brief` cuts a long doc/issue/URL down to what it actually wants, `zoom-out` shows the shape of the whole conversation, `recap` packages it for the agent that picks it up next. |

See each plugin's README for its design principles and skill map.

## License

MIT
