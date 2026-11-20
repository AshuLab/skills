# Preview shape

Read only when the caller asked to see the batch before it is applied - step 6 in `SKILL.md`. Every comment appears under its outcome, with what would be posted and done, so the caller can approve, cut or reword each one.

```markdown
## Fixed / Already resolved
- **{author}** - `file:line` _(verified | probable)_

  Comment: "{quoted comment}"

  Fix: [diff, or `None needed`]

  Reply: "{short reply text}"

  Thread: resolve | leave open for {author}

## Not applicable
- **{author}** - `file:line`

  Comment: "{quoted comment}"

  Reply: "{short reply text}"

## Deferred
- **{author}** - `file:line`

  Comment: "{quoted comment}"

  Route: issue "{title}" | PR body - {why it is too big or important}

  Reply: "{short reply text}"

## Open question
- **{author}** - `file:line`

  Comment: "{quoted comment}"

  Reply: "{the question as it would be posted}"

## Unsettled
- **{author}** - `file:line`

  Comment: "{quoted comment}"

  Missing: what is needed to settle it, or what failed
```
