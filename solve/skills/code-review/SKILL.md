---
name: code-review
description: "Adversarially reviews a pull request, local branch, supplied diff, file, or directory against three independent axes: intent, repository standards, and risk. Works on code, schemas, config, migrations, docs, specs, and prompts. Returns evidence-backed findings with severity and certainty; it never publishes them. Use for PR review, branch review, pre-PR checks, or when given a GitHub pull-request URL."
---

# code-review - Adversarial Change Review

Find what is wrong before it ships; do not bless the change. Adversarial means demanding, not noisy: a long report nobody reads is a failed review.

Review any change by reading its language, idioms, and conventions from the repository. This skill supplies the questions, not stack-specific answers.

**Find and report only. Never publish, comment, tag, edit, commit, or push.** The caller decides what to do with the report; `code-post` is what delivers it. Inherit language and tone from the session. Review your own work as strictly as anyone else's.

## Necessity first

Before judging implementation, ask in order:

1. **Does the change need to exist?** Is the problem real, and does the repo, platform, standard library, or existing configuration already solve it?
2. **Does each part need to exist?** For every file, option, dependency, abstraction, and line: what breaks without it? If nothing, remove it.
3. **Is this the smallest complete solution?** Smaller is better only when it closes the problem end-to-end; patching one symptom is incomplete, not minimal.

A finding that removes unnecessary work outranks one that improves it.

## Finding contract

These rules bind every pass:

1. A finding is `file:line` + defect + consequence + fix. Change-level findings may instead name specific files, contracts, commits, or checks.
2. Certainty and severity are separate. `verified`: state it. `probable`: state the assumption and what would confirm it. If it cannot be checked, omit it.
3. Skip formatting, lint, types, or other issues that the configured pipeline already enforces.
4. Baselines are prompts to reason, not checklists. A pattern name alone is not a finding; "none apply" is valid.
5. Judge the diff. A pre-existing defect counts only if this change makes it reachable, likelier, or worse.

## 1 - Resolve the target

Resolve inputs semantically; slash commands or tool names are client-specific:

- Pull-request URL or number -> review that PR.
- File or directory -> restrict the changed scope to that path.
- No target -> review the current branch against its base, including uncommitted work.
- Supplied diff -> review it and state which metadata or repository context is unavailable.

State the resolved target before analysis. A review needs at least one accessible source: a remote PR integration/API/CLI, a local checkout, or a supplied diff. If none exists, ask for a target.

Load exactly one acquisition guide:

- GitHub PR -> [references/github-target.md](references/github-target.md)
- Local Git branch or scoped local changes -> [references/local-target.md](references/local-target.md)
- Supplied diff -> no acquisition guide; build the review bundle from what the caller supplied.

The guides describe required information. Their commands are examples, not part of this skill's contract; use any available capability that retrieves equivalent evidence.

## 2 - Build the review bundle

Gather once, then give each review pass access through shared files, resource handles, or inline content - whatever the environment supports. Do not assume a worker can execute commands or share the parent's filesystem.

The bundle contains:

**Intent.** Find an independent statement of what was requested, in this order:

1. Issue or ticket referenced by commits or PR body; fetch it through an available tracker integration, API, or CLI.
2. Spec or path supplied by the caller.
3. Matching PRD/spec under the repository's documented planning locations.
4. Nothing found -> ask. If no independent spec exists, skip the Spec axis and disclose that the weaker PR description or commit messages were used.

**Conventions.** Start with instructions the current runtime declares active, then repository standards such as `CONTRIBUTING.md`, `CODING_STANDARDS.md`, relevant docs, and neighbouring files. Agent-specific files such as `AGENTS.md`, `CLAUDE.md`, or `.cursorrules` may contain useful technical conventions, but do not treat all of them as equally authoritative. Follow the runtime's precedence; surface unresolved conflicts instead of choosing silently.

**Changed behaviour.** For each changed unit, understand what it did before, its invariants, and its direct callers or consumers. Inspect only the context needed to verify the diff.

**Removal inventory.** Make one complete pass over deletions. Record each removed function, section, guard, validation, or operational step - not each deleted line. The Risk pass must account for every entry.

**Validation state.** Record tests, build, lint, CI, mergeability, base divergence, and unresolved feedback where available. Distinguish not run, running, unavailable, and failed.

## 3 - Run three independent passes

Run Spec, Standards, and Risk as separate subagents. No runtime for that? Run them one at a time with sealed notes - finish and record one axis before opening the next.

Either way each pass stays blind to the others and to the author's case: PR narrative, commit rationale, and prior approvals are claims to verify, not framing. And each works from the same full bundle, not a summary.

Give each pass:

- the review bundle, or a handle to all of it
- Necessity first and the Finding contract from this skill
- its axis brief below and matching `references/*-baseline.md`
- the charge: find what is wrong; do not bless the change. "None apply" is valid. Stay under 500 words.

Each pass returns this envelope so synthesis can trust or reject it:

```
Axis:                Spec | Standards | Risk
Bundle received:     yes, with <contents> | missing <what>
Baseline consulted:  <file> - <sections that bore on the diff>
Foreign inputs seen: none | <name them>
Findings:            <Finding-contract format> | none apply
```

### Spec - does it do what was asked?

Read [references/spec-baseline.md](references/spec-baseline.md).

Compare the diff with the independent intent. Find missing or partial requirements, wrong implementations, and unrequested scope. Quote the relevant requirement per finding. For a bug, check whether the fix closes the failure class or only the reported example.

If no independent spec exists, do not manufacture this pass; report the limitation.

### Standards - does it fit this repository?

Read [references/standards-baseline.md](references/standards-baseline.md). Find documented convention violations and design smells introduced by the diff. A documented repository rule overrides the baseline; baseline smells remain judgement calls.

### Risk - what breaks or is missing?

Read [references/risk-baseline.md](references/risk-baseline.md). Trace every removal, consumer contract, behaviour change, new test, and relevant security boundary. Treat validation status as evidence, not reassurance.

## 4 - Synthesize the change

**Validate the passes first.** Reject any envelope reporting a missing bundle, a baseline never consulted, or foreign inputs seen - re-run that pass in a clean context before continuing. A pass you cannot validate is a missing pass; say so in the report rather than synthesizing around it.

With all three passes visible, inspect the change as a whole:

1. Re-run the three necessity questions. Is the cause fixed end-to-end? Is deletion a better answer?
2. Check single concern. Unrelated refactors, dependency bumps, or fixes bundled together should be split; excessive size that prevents rigorous review is itself a finding.
3. Engage with the author's stated reasoning. A confident explanation is a claim to verify, including when it is your own.
4. Deduplicate only now. Convergence from independent axes strengthens a finding; report it once under the axis with the clearest framing and note the convergence.

Keep axes separate. Severity sorts within an axis, never across them:

- **Blocker** - must be resolved before merge: runtime failure; lost functionality with no replacement; hard requirement or documented convention violated; broken contract without migration; unrelated concerns bundled; secret exposed; or unattended reviewer feedback.
- **Suggestion** - consequential improvement that does not block.
- **Nitpick** - minor detail.

Cut noise:

- Blockers have no ceiling.
- Keep at most three suggestions per axis; merge or drop weaker ones.
- Group all nitpicks once.
- One repeated pattern becomes one finding with every relevant location.
- Delete findings justified only by "best practice" without a concrete consequence here.
- Add one or two lines on what is solid and should not change.

## 5 - Report

Return one structured report. Keep every axis and both severity subsections; write "None" when empty.

```markdown
## Change-level - necessity & scope
### Blockers
[Findings, or `None`]
### Suggestions
[Findings, or `None`]

## Spec - does it do what was asked?
### Blockers
[Findings, or `None`]
### Suggestions
[Findings, or `None`]

## Standards - does it fit this repository?
### Blockers
[Findings, or `None`]
### Suggestions
[Findings, or `None`]

## Risk - what breaks or is missing?
### Blockers
[Findings, or `None`]
### Suggestions
[Findings, or `None`]

## Nitpicks
[Findings, or `None`]

## Solid
- [One or two specific things worth preserving.]

## Verdict
[**Ready** | **Not ready** - blocker count and axes. First action: action.]
```

Present each finding in up to three lines:

```markdown
- **Defect** - `file:line` _(verified)_
  Consequence: what breaks or degrades.
  Fix: smallest concrete change.
```

For probable findings, replace the consequence with `Assumption: what must be true` and add `Confirm with: check or evidence needed`. Do not repeat the axis or severity inside the finding text; its section and subsection already encode them.

Then stop. Publishing the report - inline PR comments, a ticket, an ADR - is `code-post`'s job, once a person has read it. If the caller instead asks for fixes, change only what they select; do not commit or push unless explicitly requested.
