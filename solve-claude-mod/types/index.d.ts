export type Pr = {
  number: number
  title: string
  url: string
  isDraft: boolean
  state: string
  createdAt: number
  mergedAt?: number
  updatedAt: number
  // Issues the PR says it closes: a slice's number for a slice PR, the epic's for the integration PR.
  closes: number[]
}

export type Slice = {
  number: number
  title: string
  url: string
  done: boolean
  claimed: boolean
  claimedAt?: number
  blockedBy: number[]
  refined: boolean
  createdAt: number
  closedAt?: number
  updatedAt: number
}

export type Epic = {
  number: number
  title: string
  url: string
  createdAt: number
  updatedAt: number
  slices: Slice[]
  // Only the PRs that close this epic or one of its slices.
  prs: Pr[]
}

// The output of sharpen, before there is an epic: docs/specs/<name>.md with Status: sharpening.
export type Brief = {
  name: string
  title: string
  // The file's own modification time: when the brief was last written.
  writtenAt?: number
  // `Source:` line, when the idea came from an existing issue.
  source?: string
  openQuestions: number
  // Uncommitted ADRs and glossary edits under docs/: what sharpen leaves for the epic branch.
  adrs: number
  glossary: boolean
}

export type Flow = {
  briefs: Brief[]
  epics: Epic[]
  at: number
  // No data at all: the very first load failed.
  error?: string
  // A later refresh failed: briefs, epics and `at` are from the last good load.
  failed?: { message: string; at: number }
}

declare module 'claude-code' {
  interface PluginState {
    // Which flow is in focus: `epic:41` or `brief:idea`.
    'solve-claude-mod': { flow: Flow | undefined; selected: string | undefined }
  }
}
