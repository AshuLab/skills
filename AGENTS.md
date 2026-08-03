This repo is a Claude Code plugin marketplace: `.claude-plugin/marketplace.json`
lists every plugin, each one living in its own top-level folder (e.g. `solve/`).

Each plugin folder owns:

- `.claude-plugin/plugin.json` — name, version, license, author, and the
  explicit `skills` array (only skills listed there ship with the plugin).
- `skills/<name>/SKILL.md` — one folder per skill, flat (no bucket
  subfolders — a single plugin here is one coherent domain, not a grab-bag).
- `README.md` — the plugin's design principles and skill map.

When adding a skill to a plugin: create `skills/<name>/SKILL.md`, add its path
to that plugin's `plugin.json` `skills` array, and add it to the plugin's
`README.md` skill table.

When adding a new plugin: create `<plugin>/.claude-plugin/plugin.json` and
`<plugin>/README.md`, then add an entry to the root `.claude-plugin/marketplace.json`
`plugins` array (with `category` and `keywords`) and to the root `README.md`
plugins table.

Keep a plugin's `version` in `plugin.json` in sync with what actually shipped —
Claude Code uses it to decide when installed users see an update.
