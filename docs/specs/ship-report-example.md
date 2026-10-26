# ship-report-example

Status: spec
Source: AshuLab/skills#44

## Problem

`ship`'s *Delegate the build* tells the build subagent to hand back a close-out report, and shows its shape as a template: bare keys, `<placeholders>`, `|` alternatives and `?` optional markers. Subagents copy the look of what they are shown, so the report often arrives as invalid JSON (bare keys, `slice` as a number, no newlines), while other runs return valid JSON, so the result depends on the model's mood. The draining agent reads this report to decide merge or stop, and the Carrier macOS app renders it as a card when it is a JSON object, so a malformed report is friction on the critical path. Diego, the plugin's sole user today, is the one who hits it. We know it happens from a real Carrier run (slice #351), and the cause is visible in the skill: the only thing the subagent has to copy is something that is not JSON.

## Solution

Fix what the subagent copies, nothing else. In `solve/skills/ship/SKILL.md`, *Delegate the build*, the pseudo-JSON template is replaced by two concrete examples with real values, one per outcome: `ready-to-merge`, and `stopped` with its `reason`. Each example is valid JSON that `JSON.parse` accepts, with every key and string double-quoted and `slice` a string like `"#351"`, and each is shown as the bare object, which is the whole instruction about format.

Two lines of prose go next to the examples, because an example cannot express them. One says the report is a single JSON object and nothing else. The other lists the optional keys: `reason` only when the outcome is `stopped`, `note` whenever there is something to surface. The existing paragraphs after the template (what `stopped` means for the draining agent, and that `note` always reaches a human) stay as they are. The key set stays as it is today.

The skill does not name Carrier, does not forbid a ```json fence as a rule, and adds no schema or validation step. The draining agent's reading of the report, including treating anything short of a well-formed report as `stopped` in batch mode, is left untouched, neither tightened nor loosened.

The change ships as a patch bump of `solve` to 0.26.1, in both `.claude-plugin/plugin.json` and `.codex-plugin/plugin.json`, with a `ship` entry under a new `## solve 0.26.1` heading in `CHANGELOG.md`.

## Scope

1. As the draining agent, I read each slice's close-out report as a JSON object, because the skill the subagent followed shows it two concrete valid examples, one for `ready-to-merge` and one for `stopped` with a `reason`, instead of a pseudo-JSON template.
2. As the skill's author, I can parse each example in `SKILL.md` with `JSON.parse` and it succeeds, so the example is itself valid JSON.
3. As a build subagent, I know from prose next to the examples that the report is one JSON object and nothing else, and that `reason` appears only when the outcome is `stopped` and `note` whenever there is something to surface.
4. As an installed user, I get the fix as `solve` 0.26.1, with the manifests in sync and the change recorded in `CHANGELOG.md`.

## Decisions

No new ADR: the change is reversible and carries no real trade-off beyond the alternatives already cut, which the Solution names.

Testing seams. The repo has no test suite, and the change is skill text. Story 1 ships without tests: whether a subagent copies the new examples faithfully is behaviour of a model, and it can only be seen over a few real drains after the change ships. Story 2 has one throwaway check inside the slice, run and not committed: extract the example blocks from `SKILL.md` and run each through `JSON.parse` (for example with `node -e`). Stories 3 and 4 ship without tests: prose and version numbers, checked by reading the diff.

## Out of scope

Any change to how the draining agent reads, validates, tolerates or acts on the report. Any change to the report's key set or meaning. Carrier's own parsing (it already tolerates JSON5). Any change outside *Delegate the build*, apart from the version bump and changelog entry the plugin convention asks for.
