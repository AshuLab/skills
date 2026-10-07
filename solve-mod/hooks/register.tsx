import { atom, read, update } from 'claude-code'
import type { EngineInterface as Engine, Register } from 'claude-code'

import type { Brief, Epic, Flow, Pr, Slice } from '../types'
import type { Mark } from './flow'
import {
  alerts, briefCommand, briefLines, briefRoute, changes, commandFor, counts, describe, firstItem, itemsOf, parseBrief, pulse, route,
  segments, tabMark,
} from './flow'

const PANE = 'solve-pane'
const REFRESH_MS = 60_000
const MAX_TOASTS = 3
// Wide enough for "PR #1234 ●".
const PR_COLUMN = 11
const flow = atom({ plugin: 'solve-mod', key: 'flow' } as const, undefined)
const selected = atom({ plugin: 'solve-mod', key: 'selected' } as const, undefined)

type GhIssue = {
  number: number
  title: string
  url: string
  state: string
  assignees: unknown[]
  labels: { name: string }[]
  blockedBy?: { nodes?: { number: number; state: string }[] }
  parent?: { number: number } | null
  createdAt: string
  closedAt?: string
  updatedAt: string
}

type GhPr = {
  number: number
  title: string
  url: string
  state: string
  isDraft: boolean
  createdAt: string
  mergedAt?: string | null
  updatedAt: string
  closingIssuesReferences: { number: number }[]
}

async function gh<T>($: Engine, args: string[]): Promise<T> {
  const ran = await $.process.run(['gh', ...args])
  if (ran.exitCode !== 0) throw new Error(ran.stderr.trim() || `gh exited ${ran.exitCode}`)
  return JSON.parse(ran.stdout)
}

// Titles, file names and gh's stderr come from outside the repo; no control characters reach the terminal.
const clean = (text: string) => text.replace(/[\u0000-\u001f\u007f-\u009f]/g, ' ')
// Only https links are drawn as links.
const safeUrl = (url: string) => (url.startsWith('https://') ? url : '')

const ISSUE_FIELDS = 'number,title,url,state,assignees,labels,blockedBy,parent,createdAt,closedAt,updatedAt'
const PR_FIELDS = 'number,title,url,state,isDraft,createdAt,mergedAt,updatedAt,closingIssuesReferences'

// What sharpen left uncommitted under docs/: new or changed ADRs, an edited glossary. Repo-wide, so every
// brief shows the same pending set.
const pendingDocs = async ($: Engine): Promise<{ adrs: number; glossary: boolean }> => {
  const none = { adrs: 0, glossary: false }
  try {
    const ran = await $.process.run(['git', 'status', '--porcelain', '-uall', '--', 'docs/adr', 'docs/glossary.md'])
    if (ran.exitCode !== 0) return none
    const files = ran.stdout.split('\n').map(line => line.slice(3).trim())
    return { adrs: files.filter(f => f.startsWith('docs/adr/')).length, glossary: files.includes('docs/glossary.md') }
  } catch (err) {
    // Not being in a git repo only costs the "+1 ADR" detail.
    $.ui.log(`pending docs: ${err instanceof Error ? err.message : String(err)}`, { to: 'debug' })
    return none
  }
}

// Briefs are the sharpen output still waiting for to-spec: docs/specs/*.md with Status: sharpening.
const briefs = async ($: Engine): Promise<Brief[]> => {
  if (!(await $.fs.exists('docs/specs'))) return []
  const pending = await pendingDocs($)
  const found: Brief[] = []
  for (const entry of await $.fs.list('docs/specs')) {
    if (!entry.name.endsWith('.md')) continue
    const text = String(await $.fs.read(`docs/specs/${entry.name}`))
    if (!/^Status:\s*sharpening\b/m.test(text)) continue
    const brief = parseBrief(clean(entry.name.replace(/\.md$/, '')), text, entry.mtimeMs)
    found.push({ ...brief, title: clean(brief.title), source: brief.source && clean(brief.source), ...pending })
  }
  return found
}

// When a slice was claimed: its last `assigned` event. One call per claimed slice, kept until it is unclaimed.
const claims = new Map<number, number>()
const claimedAt = async ($: Engine, number: number): Promise<number | undefined> => {
  const known = claims.get(number)
  if (known !== undefined) return known
  try {
    const ran = await $.process.run([
      'gh', 'api', `repos/:owner/:repo/issues/${number}/timeline?per_page=100`,
      '--jq', '[.[] | select(.event == "assigned") | .created_at] | last',
    ])
    if (ran.exitCode !== 0) throw new Error(ran.stderr.trim() || `gh exited ${ran.exitCode}`)
    // No `assigned` event (assigned by another route): gh prints nothing, and the slice stays undated.
    if (ran.stdout.trim() === '') return undefined
    const iso = JSON.parse(ran.stdout)
    if (typeof iso !== 'string') return undefined
    const ms = Date.parse(iso)
    claims.set(number, ms)
    return ms
  } catch (err) {
    // The claim time is detail, not the point: the slice still draws, undated.
    $.ui.log(`claim time of #${number}: ${err instanceof Error ? err.message : String(err)}`, { to: 'debug' })
    return undefined
  }
}

const load = async ($: Engine): Promise<Flow> => {
  const at = await $.clock.now()
  try {
    const [epics, tickets, prs, found] = await Promise.all([
      gh<GhIssue[]>($, ['issue', 'list', '--label', 'solve:epic', '--state', 'open', '--limit', '100', '--json', ISSUE_FIELDS]),
      gh<GhIssue[]>($, ['issue', 'list', '--label', 'solve:ticket', '--state', 'all', '--limit', '500', '--json', ISSUE_FIELDS]),
      gh<GhPr[]>($, ['pr', 'list', '--state', 'all', '--limit', '200', '--json', PR_FIELDS]),
      briefs($),
    ])
    const epicNumbers = new Set(epics.map(e => e.number))
    const mine = tickets.filter(t => t.parent && epicNumbers.has(t.parent.number))

    const claimed = mine.filter(t => t.state === 'OPEN' && t.assignees.length > 0)
    for (const n of [...claims.keys()]) if (!claimed.some(t => t.number === n)) claims.delete(n)
    const times = await Promise.all(claimed.map(t => claimedAt($, t.number)))
    const claimTime = new Map(claimed.map((t, i) => [t.number, times[i]]))

    const sliceOf = (t: GhIssue): Slice => ({
      number: t.number,
      title: clean(t.title),
      url: safeUrl(t.url),
      done: t.state !== 'OPEN',
      claimed: t.assignees.length > 0,
      claimedAt: claimTime.get(t.number),
      blockedBy: (t.blockedBy?.nodes ?? []).filter(b => b.state === 'OPEN').map(b => b.number),
      refined: t.labels.some(l => l.name === 'solve:refined'),
      createdAt: Date.parse(t.createdAt),
      // gh reports a zero date for an open issue, so only a closed one has a closing time.
      closedAt: t.state === 'OPEN' ? undefined : Date.parse(t.closedAt ?? ''),
      updatedAt: Date.parse(t.updatedAt),
    })
    const prOf = (p: GhPr): Pr => ({
      number: p.number,
      title: clean(p.title),
      url: safeUrl(p.url),
      isDraft: p.isDraft,
      state: p.state,
      createdAt: Date.parse(p.createdAt),
      mergedAt: p.mergedAt ? Date.parse(p.mergedAt) : undefined,
      updatedAt: Date.parse(p.updatedAt),
      closes: p.closingIssuesReferences.map(r => r.number),
    })

    const built: Epic[] = epics.map(e => {
      const slices = mine.filter(t => t.parent?.number === e.number).map(sliceOf)
      const closing = new Set([e.number, ...slices.map(s => s.number)])
      return {
        number: e.number,
        title: clean(e.title),
        url: safeUrl(e.url),
        createdAt: Date.parse(e.createdAt),
        updatedAt: Date.parse(e.updatedAt),
        slices,
        prs: prs.map(prOf).filter(p => p.closes.some(n => closing.has(n))),
      }
    })
    return { briefs: found, epics: built, at }
  } catch (err) {
    // Expected here: no gh, not logged in, not a GitHub repo. Shown in the pane, not swallowed.
    return { briefs: [], epics: [], at, error: clean(err instanceof Error ? err.message : String(err)) }
  }
}

// The spinner frames @clack/prompts uses.
const FRAMES = ['◒', '◐', '◓', '◑']
const FRAME_MS = 120

// True while the drawn epic has a live slice in progress, so the spinner timer only redraws when something moves.
let animating = false
// Set by the first /solve-pane: from then on the poll runs, pane open or not, so toasts reach someone who isn't looking.
let watching = false

const pad = (n: number) => String(n).padStart(2, '0')
const stamp = (ms: number) => {
  const d = new Date(ms)
  return `${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}
// 14:03:22
const clock = (ms: number) => new Date(ms).toTimeString().slice(0, 8)

const colorOf = (mark: Mark): 'success' | 'warning' | 'suggestion' | 'error' | undefined =>
  mark === '✓' ? 'success' : mark === '●' ? 'warning' : mark === '▶' ? 'suggestion' : mark === '⚠' ? 'error' : undefined

const refresh = async ($: Engine) => {
  const prev = await read($, flow)
  const loaded = await load($)
  // A failed refresh keeps the last good data and says so; only a first load has nothing to keep.
  const next: Flow = loaded.error && prev && !prev.error ? { ...prev, failed: { message: loaded.error, at: loaded.at } } : loaded
  await update($, flow, () => next)
  const news = changes(prev, next)
  for (const text of news.slice(0, MAX_TOASTS)) $.ui.toast(text)
  if (news.length > MAX_TOASTS) $.ui.toast(`+${news.length - MAX_TOASTS} more changes: see /solve-pane`)
}

// The poll calls gh only once someone asked for /solve-pane.
const tick = async ($: Engine) => {
  if (watching) await refresh($)
}

// Redraws for the spinner; stops by itself once the pane is gone.
const spin = async ($: Engine) => {
  if (!animating) return
  const panes = await $.ui.panes()
  if (panes.some(pane => pane.id === PANE)) $.ui.invalidate('ui.render')
  else animating = false
}

const openPane = async ($: Engine) => {
  watching = true
  // focus: the 1-9 tab hotkeys and the copy hotkey work as soon as /solve-pane opens it (Esc hands the keys back).
  await $.ui.open({ id: PANE, title: 'solve flow', focus: true })
  await refresh($)
}

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    $.clock.every(REFRESH_MS, () => void tick($))
    $.clock.every(FRAME_MS, () => void spin($))
    try {
      await $.command.register({
        name: 'solve-pane',
        description: 'Show where each brief and epic stands, sharpen to land',
      })
    } catch (err) {
      // A taken name must not skip the rest of session.start.
      $.ui.log(`/solve-pane not registered: ${err instanceof Error ? err.message : String(err)}`)
    }
    return next(e)
  })

  on('command.run', { command: 'solve-pane' }, async $ => {
    const surfaces = await $.session.surfaces()
    if (surfaces.some(s => s === 'terminal' || s === 'desktop')) {
      await openPane($)
      return {}
    }
    // VS Code, claude -p, cloud: nothing draws, so the answer is text.
    watching = true
    await refresh($)
    return { text: describe(await read($, flow)) }
  })

  on('ui.render', { component: 'Pane', requestId: PANE }, async ($, e) => {
    const { Box, Text, Button, Link } = $.ui.resolve(e)
    const data = await read($, flow)
    if (!data) return <Text dimColor>Loading...</Text>
    if (data.error) return <Text color="error">gh failed: {data.error}</Text>

    const items = itemsOf(data)
    const pick = await read($, selected)
    const current = items.find(x => x.key === pick) ?? firstItem(items)
    const epic = current?.epic
    const brief = current?.brief
    const at = current ? items.indexOf(current) : 0
    const now = await $.clock.now()
    const stations = epic ? route(epic, now) : brief ? briefRoute(brief) : []
    animating = data.epics.some(x => tabMark(x, now) === '●')
    const frame = Math.floor(now / FRAME_MS) % FRAMES.length
    // Step symbols: a filled circle for done (against the hollow one for pending), a filled diamond for
    // waiting on you, a triangle for trouble, and clack's spinner for what is running.
    const sym = (mark: Mark) =>
      mark === '✓' ? '●' : mark === '●' ? (FRAMES[frame] ?? '◒') : mark === '▶' ? '◆' : mark === '⚠' ? '▲' : mark
    const cmd = epic ? commandFor(epic) : brief ? briefCommand(brief) : undefined
    // One segment per slice: green done, amber in progress, grey still to come.
    const sliceBar = (x: NonNullable<typeof epic>) =>
      segments(x, now).map(seg =>
        seg.state === 'todo' ? (
          <Text dimColor>{'─'.repeat(seg.cells)}</Text>
        ) : (
          <Text color={seg.state === 'done' ? 'success' : 'warning'}>{'━'.repeat(seg.cells)}</Text>
        ),
      )
    // Cycling wraps around, so two flows need no more than one key.
    const go = (step: number) => update($, selected, () => items[(at + step + items.length) % items.length]?.key)

    // The rail's colour follows the step it belongs to, as in clack: green once done, blue while current.
    const railOf = (state: 'done' | 'now' | 'todo') => (state === 'done' ? 'success' : state === 'now' ? 'suggestion' : undefined)

    return (
      <Box flexDirection="column">
        {!current && <Text dimColor>No briefs or open epics. Start with sharpen.</Text>}

        {current && (
          <Box flexDirection="column">
            {epic && (
              <Box flexDirection="column">
            <Box flexDirection="row">
              <Text color="suggestion">┌  </Text>
              {epic.url ? (
                <Link href={epic.url} label={`#${epic.number} ${epic.title}`} />
              ) : (
                <Text bold wrap="truncate">#{epic.number} {epic.title}</Text>
              )}
            </Box>
            <Box flexDirection="row">
              <Text dimColor>│  </Text>
              <Text dimColor wrap="truncate">{pulse(epic, now)}</Text>
            </Box>
            {epic.slices.length > 0 && (
              <Box flexDirection="column">
                <Box flexDirection="row">
                  <Text dimColor>│  </Text>
                  <Text>{sliceBar(epic)}  {epic.slices.filter(x => x.done).length}/{epic.slices.length} slices</Text>
                </Box>
                <Box flexDirection="row">
                  <Text dimColor>│  </Text>
                  <Text wrap="truncate">{counts(epic, now)}</Text>
                </Box>
              </Box>
            )}
            {alerts(epic, now).map(alert => (
              <Box flexDirection="row">
                <Text dimColor>│  </Text>
                <Text color="error">▲ </Text>
                {alert.ref && <Link href={alert.ref.href} label={alert.ref.label} />}
                <Text color="error" wrap="truncate"> {alert.text}</Text>
              </Box>
            ))}
              </Box>
            )}
            {brief && (
              <Box flexDirection="column">
                <Box flexDirection="row">
                  <Text color="suggestion">┌  </Text>
                  <Text bold wrap="truncate">{brief.title}</Text>
                </Box>
                {briefLines(brief, now).map(text => (
                  <Box flexDirection="row">
                    <Text dimColor>│  </Text>
                    <Text dimColor wrap="truncate">{text}</Text>
                  </Box>
                ))}
              </Box>
            )}
            <Text dimColor>│</Text>

            {stations.map((st, i) => (
              <Box flexDirection="column">
                <Box flexDirection="row">
                  <Text color={colorOf(st.mark)} dimColor={st.state === 'todo'} bold={st.state === 'now'}>
                    {sym(st.mark)}  {st.name}
                  </Text>
                </Box>
                {st.name !== 'ship' && (st.ref || st.text !== '') && (
                  <Box flexDirection="row">
                    <Text color={railOf(st.state)} dimColor={st.state === 'todo'}>│  </Text>
                    {st.ref && <Link href={st.ref.href} label={st.ref.label} />}
                    <Text dimColor wrap="truncate">{st.ref ? ' ' : ''}{st.text}</Text>
                    {st.when !== undefined && <Text dimColor>  {stamp(st.when)}</Text>}
                  </Box>
                )}
                {st.rows.map(row => (
                  <Box flexDirection="row">
                    <Text color={railOf(st.state)}>│  </Text>
                    <Text color={colorOf(row.mark)} dimColor={row.mark === '○'}>{sym(row.mark)} </Text>
                    {row.ref && <Link href={row.ref.href} label={row.ref.label} />}
                    {/* The PR sits in a column of its own, so a narrow pane cuts the title, never the link. */}
                    <Box flexDirection="row" width={PR_COLUMN} marginLeft={1}>
                      {row.pr?.ref && <Link href={row.pr.ref.href} label={row.pr.ref.label} />}
                      {row.pr?.merged && <Text color="success"> ●</Text>}
                    </Box>
                    <Text color={colorOf(row.mark)} dimColor={row.mark === '○'} wrap="truncate">{row.text}</Text>
                  </Box>
                ))}
                {i < stations.length - 1 && (
                  <Text color={st.state === 'done' ? 'success' : undefined} dimColor={st.state !== 'done'}>│</Text>
                )}
              </Box>
            ))}

            <Text dimColor>│</Text>
            <Box flexDirection="row" justifyContent="space-between">
              <Box flexDirection="row">
                <Text color={cmd ? 'suggestion' : undefined} dimColor={!cmd}>└  </Text>
                {cmd && (
                  <Button
                    key="use"
                    label={`use ${cmd}`}
                    hotkey="u"
                    onPress={async () => {
                      // Fill the prompt, never send it: running ship or land stays the person's call.
                      const draft = await $.prompt.read()
                      if (draft.text.trim() === '') {
                        const filled = await $.prompt.fill({ text: cmd })
                        if (filled.isFilled) {
                          $.ui.toast(`${cmd} is in the prompt: press Enter to run it`)
                          return
                        }
                      }
                      // A draft is already there, or nothing to fill: leave it alone and copy instead.
                      const copied = await $.ui.copy({ text: cmd })
                      $.ui.toast(copied.isCopied ? `copied ${cmd}` : `could not copy ${cmd}`)
                    }}
                  />
                )}
              </Box>
              <Box flexDirection="row" columnGap={1}>
                <Button key="refresh" label="↻" hotkey="r" onPress={() => refresh($)} />
                {items.length > 1 && <Button key="prev" label="‹" hotkey="p" onPress={() => go(-1)} />}
                {items.length > 1 && (
                  <Text dimColor>
                    {at + 1}/{items.length}{epic && data.briefs.length > 0 ? ` · +${data.briefs.length} brief${data.briefs.length === 1 ? '' : 's'}` : ''}
                  </Text>
                )}
                {items.length > 1 && <Button key="next" label="›" hotkey="n" onPress={() => go(1)} />}
              </Box>
            </Box>
            {data.failed && (
              <Text color="error" wrap="truncate">⚠ gh failed: {data.failed.message} · showing data from {clock(data.at)}</Text>
            )}
            <Text dimColor wrap="truncate">
              {[cmd ? 'u use' : '', 'r refresh', items.length > 1 ? 'p/n switch' : '', 'esc back to prompt'].filter(Boolean).join(' · ')}
              {'  ·  updated '}{clock(data.at)}
            </Text>
          </Box>
        )}

      </Box>
    )
  })
}
