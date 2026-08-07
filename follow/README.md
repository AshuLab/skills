# follow

Skills that **make something legible** rather than build it - the last message, the
whole conversation, or a long text someone handed you. They differ by what they work
on and who reads the result. Nothing here touches your repo.

## Install

```
/plugin marketplace add AshuLab/skills
/plugin install follow@ashulab
```

## The skills

| Skill | Works on | Reader | Reach for it when |
|---|---|---|---|
| **`/follow:plain`** | The last message | You | An answer came out too technical or too dense and didn't land. |
| **`/follow:brief`** | A long text you're handed | You | A doc, issue or URL is long or LLM-bloated and you need what it actually wants. |
| **`/follow:zoom-out`** | The whole conversation | You | You've been deep in the detail and need the shape of it to decide how to go on. |
| **`/follow:recap`** | The whole conversation | The next agent | You're stopping and something else continues - a new session, another machine, a different tool. |

## Why they aren't the built-ins

`/compact` compresses so the *same* session can keep going, with the same model,
which still has the transcript behind it. `recap` writes for a reader that has
**nothing** - it has to stand on its own, which is why it carries the reasons behind
decisions and the paths already ruled out, not a narration of what happened first.

`plain` exists because the default reaction to "I didn't follow" is to say the same
thing with more words. It forces the opposite: shorter than the original, and a
different altitude rather than a bigger version of the same one.

## Principles

- **The user is the reader, or another agent is.** Never both at once - the two
  audiences want opposite things, and a text aimed at both serves neither.
- **Shorter or it failed.** `plain`, `brief` and `zoom-out` come out shorter than
  what they replace, or they didn't work.
- **No artifacts by default.** `recap` writes a file only if you hand it a path.
- **No closed questions.** Someone who is lost can't pick from a list of things they
  don't understand.

## License

MIT
