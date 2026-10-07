import type { Brief, Epic, Flow, Pr, Slice } from '../types'

export type Stage = 'to-tickets' | 'ship' | 'land'
export type Mark = '✓' | '●' | '▶' | '⏸' | '○' | '⚠'
export type Ref = { label: string; href: string }
export type Entry = { at?: number; mark: Mark; ref?: Ref; text: string }
export type Step = { name: string; state: 'done' | 'now' | 'todo' }
export type Row = { mark: Mark; ref?: Ref; text: string; pr?: { ref?: Ref; merged: boolean } }
export type Station = { name: string; state: Step['state']; mark: Mark; ref?: Ref; text: string; when?: number; rows: Row[] }

// ponytail: one fixed threshold; make it a userConfig option if 3h is wrong for someone's slices.
export const STALE_MS = 3 * 3_600_000

// The ship bar spends about this many cells, shared among the slices.
const SLICE_BAR_CELLS = 24

// An epic is past sharpen and to-spec by existing; what's left is read off its slices.
export const stageOf = (epic: Epic): Stage => {
  if (epic.slices.length === 0) return 'to-tickets'
  return epic.slices.some(s => !s.done) ? 'ship' : 'land'
}

// Same rule as ship/scripts/solve-next-startable: open, refined, unassigned, no open blocker.
export const startable = (epic: Epic): Slice | undefined => {
  const open = new Set(epic.slices.filter(s => !s.done).map(s => s.number))
  return epic.slices
    .filter(s => !s.done && s.refined && !s.claimed && !s.blockedBy.some(n => open.has(n)))
    .sort((a, b) => a.number - b.number)[0]
}

// ship opens the integration PR with `Closes #<epic>`; slice PRs close their own slice.
export const integrationPr = (epic: Epic): Pr | undefined => epic.prs.find(p => p.closes.includes(epic.number))

// Last sign of life on a slice: the issue, its claim, or a PR that closes it (a push moves the PR's updatedAt).
export const activityOf = (epic: Epic, s: Slice): number =>
  Math.max(s.updatedAt, s.claimedAt ?? 0, ...epic.prs.filter(p => p.closes.includes(s.number)).map(p => p.updatedAt))

// A claimed slice that went quiet: a drain that died looks the same as one still building, until this fires.
export const isStale = (epic: Epic, s: Slice, now: number): boolean =>
  s.claimed && !s.done && now - activityOf(epic, s) > STALE_MS

// One glyph per slice, the same rule the timeline reads.
export const markOf = (s: Slice, next: Slice | undefined, stale: boolean): Mark => {
  if (s.done) return '✓'
  if (s.claimed) return stale ? '⚠' : '●'
  if (s.blockedBy.length > 0) return '⏸'
  return s === next ? '▶' : '○'
}

// The one glyph a tab wears: stalled, a drain running, something waiting on you, or nothing to do.
export const tabMark = (epic: Epic, now: number): Mark => {
  if (epic.slices.some(s => isStale(epic, s, now))) return '⚠'
  if (epic.slices.some(s => !s.done && s.claimed)) return '●'
  return commandFor(epic) ? '▶' : '○'
}

// The route sharpen -> land, with where this epic stands on it.
export const spine = (epic: Epic): Step[] => {
  const at = { 'to-tickets': 2, ship: 3, land: 4 }[stageOf(epic)]
  return ['sharpen', 'to-spec', 'to-tickets', 'ship', 'land'].map((name, i) => ({
    name,
    state: i < at ? 'done' : i === at ? 'now' : 'todo',
  }))
}

export const age = (ms: number): string => {
  const minutes = Math.max(0, Math.floor(ms / 60_000))
  if (minutes < 60) return `${minutes}m`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h`
  return `${Math.floor(hours / 24)}d ${hours % 24}h`
}

const sliceRef = (s: Slice): Ref | undefined => (s.url ? { label: `#${s.number}`, href: s.url } : undefined)
const prRef = (p: Pr): Ref | undefined => (p.url ? { label: `PR #${p.number}`, href: p.url } : undefined)

// What happened (dated, from issues and PRs) and what's still ahead, in order.
export const timeline = (epic: Epic, now: number): { past: Entry[]; ahead: Entry[] } => {
  const past: Entry[] = [
    {
      at: epic.createdAt,
      mark: '✓',
      ref: epic.url ? { label: `#${epic.number}`, href: epic.url } : undefined,
      text: 'epic opened, spec published',
    },
  ]
  if (epic.slices.length > 0) {
    past.push({ at: Math.min(...epic.slices.map(s => s.createdAt)), mark: '✓', text: `${epic.slices.length} slices cut` })
  }
  for (const s of epic.slices) {
    if (s.claimedAt !== undefined) past.push({ at: s.claimedAt, mark: '●', ref: sliceRef(s), text: 'claimed' })
    if (s.done) past.push({ at: s.closedAt, mark: '✓', ref: sliceRef(s), text: s.title })
  }
  for (const p of epic.prs) {
    const slice = epic.slices.find(s => p.closes.includes(s.number))
    const opened = p.closes.includes(epic.number)
      ? `opened as the integration PR${p.isDraft ? ' (draft)' : ''}`
      : `opened for #${slice?.number}`
    past.push({ at: p.createdAt, mark: '●', ref: prRef(p), text: opened })
    if (p.mergedAt !== undefined) past.push({ at: p.mergedAt, mark: '✓', ref: prRef(p), text: 'merged' })
  }
  past.sort((a, b) => (a.at ?? Infinity) - (b.at ?? Infinity))

  const next = startable(epic)
  const ahead: Entry[] = epic.slices
    .filter(s => !s.done)
    .sort((a, b) => a.number - b.number)
    .map((s): Entry => {
      const mark = markOf(s, next, isStale(epic, s, now))
      const note = {
        '✓': '',
        '●': 'in progress',
        '⚠': `no activity for ${age(now - activityOf(epic, s))}`,
        '⏸': `blocked by ${s.blockedBy.map(n => `#${n}`).join(', ')}`,
        '▶': 'next',
        '○': s.refined ? 'queued' : 'not refined',
      }[mark]
      return { mark, ref: sliceRef(s), text: `${s.title} (${note})` }
    })
  if (epic.slices.length === 0) {
    ahead.push({ mark: '▶', text: `cut into slices: run to-tickets on #${epic.number}` })
  }
  const pr = integrationPr(epic)
  if (stageOf(epic) !== 'land') ahead.push({ mark: '○', text: 'land' })
  else if (pr) ahead.push({ mark: '▶', ref: prRef(pr), text: 'review the integration PR, then land' })
  else ahead.push({ mark: '▶', text: 'waiting for the integration PR' })
  return { past, ahead }
}

// The five stations of the route, each with what hangs from it: the slices under ship, the PR at land.
export const route = (epic: Epic, now: number): Station[] => {
  const next = startable(epic)
  const pr = integrationPr(epic)
  const stale = epic.slices.some(s => isStale(epic, s, now))
  const running = epic.slices.some(s => !s.done && s.claimed)
  const total = epic.slices.length
  const ago = (at: number | undefined) => (at === undefined ? '' : ` ${age(now - at)} ago`)

  const rows = (): Row[] =>
    [...epic.slices]
      .sort((a, b) => a.number - b.number)
      .map((s): Row => {
        const mark = markOf(s, next, isStale(epic, s, now))
        const note = {
          '✓': `closed${ago(s.closedAt)}`,
          '●': s.claimedAt === undefined ? 'in progress' : `in progress, claimed${ago(s.claimedAt)}`,
          '⚠': `no activity for ${age(now - activityOf(epic, s))}`,
          '⏸': `blocked by ${s.blockedBy.map(n => `#${n}`).join(', ')}`,
          '▶': 'next',
          '○': s.refined ? 'queued' : 'not refined',
        }[mark]
        const latest = epic.prs.filter(p => p.closes.includes(s.number)).sort((a, b) => b.createdAt - a.createdAt)[0]
        return {
          mark,
          ref: sliceRef(s),
          text: `${s.title} (${note})`,
          pr: latest && { ref: prRef(latest), merged: latest.mergedAt !== undefined },
        }
      })

  return spine(epic).map((st): Station => {
    // Where the epic is now: stalled, a drain running, or waiting on the person.
    const mark: Mark =
      st.state === 'done' ? '✓' : st.state === 'todo' ? '○' : stale ? '⚠' : running || (st.name === 'land' && !pr) ? '●' : '▶'
    const station = { name: st.name, state: st.state, mark, text: '', rows: [] as Row[] }
    if (st.name === 'to-spec') {
      return { ...station, ref: epic.url ? { label: `#${epic.number}`, href: epic.url } : undefined, text: 'opened', when: epic.createdAt }
    }
    if (st.name === 'to-tickets') {
      return total > 0
        ? { ...station, text: `${total} slices cut`, when: Math.min(...epic.slices.map(s => s.createdAt)) }
        : { ...station, text: 'waiting to be cut into slices' }
    }
    if (st.name === 'ship') return { ...station, rows: rows() }
    if (st.name === 'land' && pr) {
      return { ...station, ref: prRef(pr), text: pr.isDraft ? 'draft, review it then land' : 'review it then land', when: pr.createdAt }
    }
    return station
  })
}

export type Segment = { state: 'done' | 'doing' | 'todo'; cells: number }

// One segment per slice, equal width, spending about SLICE_BAR_CELLS cells in all. Three states only:
// closed, claimed (stalled ones included: the alert says so), and everything still waiting.
export const segments = (epic: Epic, now: number): Segment[] => {
  const next = startable(epic)
  const cells = Math.max(1, Math.floor(SLICE_BAR_CELLS / Math.max(1, epic.slices.length)))
  return [...epic.slices]
    .sort((a, b) => a.number - b.number)
    .map(s => {
      const mark = markOf(s, next, isStale(epic, s, now))
      return { state: mark === '✓' ? 'done' : mark === '●' || mark === '⚠' ? 'doing' : 'todo', cells }
    })
}

// What the person should do now, as one sentence. A slice in progress means a drain is running: wait.
export const nextStep = (epic: Epic, now: number): string => {
  const stage = stageOf(epic)
  if (stage === 'to-tickets') return `Run /solve:to-tickets #${epic.number} to cut it into slices`
  if (stage === 'land') {
    return integrationPr(epic)
      ? `Review the integration PR, then run /solve:land #${epic.number}`
      : 'Waiting for the integration PR'
  }
  const stale = epic.slices.filter(s => isStale(epic, s, now))
  const [quietest] = stale
  if (quietest) {
    return `Stalled: ${stale.map(s => `#${s.number}`).join(', ')}, no activity for ${age(now - activityOf(epic, quietest))}`
  }
  const working = epic.slices.filter(s => !s.done && s.claimed)
  if (working.length > 0) return `Wait: ship is working on ${working.map(s => `#${s.number}`).join(', ')}`
  const next = startable(epic)
  if (next) return `Run /solve:ship #${epic.number}, it starts with slice #${next.number}`
  return 'Nothing can start: the open slices are blocked or not refined'
}

// The command worth copying right now, or nothing while a drain is running or stuck.
export const commandFor = (epic: Epic): string | undefined => {
  const stage = stageOf(epic)
  if (stage === 'to-tickets') return `/solve:to-tickets #${epic.number}`
  if (stage === 'land') return integrationPr(epic) ? `/solve:land #${epic.number}` : undefined
  if (epic.slices.some(s => !s.done && s.claimed)) return undefined
  return startable(epic) ? `/solve:ship #${epic.number}` : undefined
}

// The epic to put in front: the one being drained, else the one touched last.
export const focusOf = (epics: Epic[]): Epic | undefined =>
  epics.find(e => e.slices.some(s => !s.done && s.claimed)) ??
  [...epics].sort((a, b) => b.updatedAt - a.updatedAt)[0]

// The last sign of life anywhere in the epic: its issue, its slices, their PRs.
export const lastActive = (epic: Epic): number =>
  Math.max(
    ...[
      epic.createdAt,
      epic.updatedAt,
      ...epic.slices.flatMap(s => [s.createdAt, s.updatedAt, s.claimedAt ?? 0, s.closedAt ?? 0]),
      ...epic.prs.flatMap(p => [p.createdAt, p.updatedAt, p.mergedAt ?? 0]),
    ].filter(Number.isFinite),
  )

// How long it has been open, and how long since anything moved.
export const pulse = (epic: Epic, now: number): string =>
  `opened ${age(now - epic.createdAt)} ago · active ${age(now - lastActive(epic))} ago`

// How the slices are spread: done, running, stalled, blocked, waiting. Empty states stay out.
export const counts = (epic: Epic, now: number): string => {
  const next = startable(epic)
  const marks = epic.slices.map(s => markOf(s, next, isStale(epic, s, now)))
  const n = (...of: Mark[]) => marks.filter(m => of.includes(m)).length
  return [
    [n('✓'), 'done'],
    [n('●'), 'running'],
    [n('⚠'), 'stalled'],
    [n('⏸'), 'blocked'],
    [n('▶', '○'), 'waiting'],
  ]
    .filter(([count]) => count !== 0)
    .map(([count, name]) => `${count} ${name}`)
    .join(' · ')
}

export type Alert = { ref?: Ref; text: string }

// Reads a brief the way sharpen writes it (see to-spec's SPEC-FORMAT): an H1, a `Status:` and `Source:`
// header, and an `## Open questions` section whose bullets are what the grilling left unsettled.
export const parseBrief = (name: string, text: string, writtenAt: number | undefined): Omit<Brief, 'adrs' | 'glossary'> => {
  const title = /^#\s+(.+)$/m.exec(text)?.[1]?.trim() || name
  const source = /^Source:\s*(.+)$/m.exec(text)?.[1]?.trim()
  const section = /^##\s+Open questions\s*$([\s\S]*?)(?=^##\s|(?![\s\S]))/m.exec(text)?.[1] ?? ''
  const openQuestions = section.split('\n').filter(line => /^\s*(?:[-*]|\d+\.)\s+\S/.test(line)).length
  return { name, title, writtenAt, source, openQuestions }
}

// A brief on the same route as an epic: sharpen is where it stands, waiting for to-spec.
export const briefRoute = (brief: Brief): Station[] =>
  ['sharpen', 'to-spec', 'to-tickets', 'ship', 'land'].map((name, i): Station =>
    i === 0
      ? { name, state: 'now', mark: '▶', text: 'brief ready, waiting for to-spec', when: brief.writtenAt, rows: [] }
      : { name, state: 'todo', mark: '○', text: '', rows: [] },
  )

// The two header lines of a brief: when it was written and where from; what is still open.
export const briefLines = (brief: Brief, now: number): string[] => {
  const written = brief.writtenAt === undefined ? 'brief written' : `brief written ${age(now - brief.writtenAt)} ago`
  const open = brief.openQuestions === 0 ? 'no open questions' : `${brief.openQuestions} open question${brief.openQuestions === 1 ? '' : 's'}`
  const pending = [brief.adrs > 0 ? `+${brief.adrs} ADR${brief.adrs === 1 ? '' : 's'}` : '', brief.glossary ? 'glossary edited' : '']
  return [brief.source ? `${written} · from ${brief.source}` : written, [open, ...pending].filter(Boolean).join(' · ')]
}

// What to run for a brief: to-spec reads the brief it names.
export const briefCommand = (brief: Brief): string => `/solve:to-spec docs/specs/${brief.name}.md`

// Epics first (by number), then briefs (by name): the order p and n walk through.
export type Item = { key: string; epic?: Epic; brief?: Brief }
export const itemsOf = (flow: Flow): Item[] => [
  ...[...flow.epics].sort((a, b) => a.number - b.number).map(epic => ({ key: `epic:${epic.number}`, epic })),
  ...[...flow.briefs].sort((a, b) => a.name.localeCompare(b.name)).map(brief => ({ key: `brief:${brief.name}`, brief })),
]

// What to show first: the epic being drained, else the one touched last, else a brief.
export const firstItem = (items: Item[]): Item | undefined => {
  const epic = focusOf(items.flatMap(i => (i.epic ? [i.epic] : [])))
  return items.find(i => i.epic === epic && epic !== undefined) ?? items[0]
}

// What is wrong right now, for the top of the pane. Nothing wrong, nothing listed.
export const alerts = (epic: Epic, now: number): Alert[] =>
  epic.slices
    .filter(s => isStale(epic, s, now))
    .map(s => ({ ref: sliceRef(s), text: `no activity for ${age(now - activityOf(epic, s))}` }))

// What moved between two loads, worth a toast. The first load, or a failed one, has nothing to compare.
export const changes = (prev: Flow | undefined, next: Flow): string[] => {
  if (!prev || prev.error || next.error) return []
  const out: string[] = []
  for (const epic of next.epics) {
    const before = prev.epics.find(e => e.number === epic.number)
    if (!before) continue
    for (const s of epic.slices) {
      const was = before.slices.find(b => b.number === s.number)
      if (was && !was.done && s.done) out.push(`#${s.number} closed: ${s.title}`)
      if (isStale(epic, s, next.at) && !(was && isStale(before, was, prev.at))) {
        out.push(`#${s.number} has had no activity for ${age(next.at - activityOf(epic, s))}`)
      }
    }
    const pr = integrationPr(epic)
    if (pr && !integrationPr(before)) out.push(`#${epic.number} integration PR #${pr.number} opened: ready for review`)
    else if (stageOf(epic) === 'land' && stageOf(before) !== 'land') out.push(`#${epic.number}: all slices closed`)
  }
  return out
}

// Plain text for surfaces that can't draw a pane (VS Code, claude -p, cloud).
export const describe = (flow: Flow | undefined): string => {
  if (!flow) return 'No data yet.'
  if (flow.error) return `gh failed: ${flow.error}`
  const lines = [
    ...flow.briefs.map(b => `brief ${b.name} [sharpen] next: run ${briefCommand(b)}`),
    ...flow.epics.map(epic => {
      const done = epic.slices.filter(s => s.done).length
      return `#${epic.number} ${epic.title} [${stageOf(epic)} ${done}/${epic.slices.length}] next: ${nextStep(epic, flow.at)}`
    }),
  ]
  if (lines.length === 0) return 'No briefs or open epics. Start with sharpen.'
  return [...lines, ...(flow.failed ? [`(gh failed: ${flow.failed.message}; this is the last data that loaded)`] : [])].join('\n')
}
