import type { On, RenderSurface } from 'claude-code'
import { expect, mock, test } from 'claude-code/testing'

const NOW = Date.parse('2026-10-06T12:00:00Z')
const iso = (hoursAgo: number) => new Date(NOW - hoursAgo * 3_600_000).toISOString()
const ZERO = '0001-01-01T00:00:00Z'

const FLOW = {
  command: 'solve-pane',
  args: '',
  origin: { kind: 'composer' },
  presentation: { isFullscreen: false, columns: 100 },
} as const

const PANE = {
  plugin: 'solve-claude-mod',
  component: 'Pane',
  requestId: 'solve-flow',
  viewport: { columns: 100, rows: 30 },
  props: {
    title: 'solve flow',
    isFocused: false,
    bodyColumns: 60,
    placement: 'inline',
    scroll: { offset: 0, bodyRows: 12 },
    view: {},
  },
} as const

// What the fake GitHub holds; a test flips a flag to move time forward.
type World = { closed43: boolean; stale44: boolean; claim44: boolean; ghFails: boolean; noEpics: boolean; draft: string }
const newWorld = (over: Partial<World> = {}): World => ({
  closed43: false, stale44: false, claim44: true, ghFails: false, noEpics: false, draft: '', ...over,
})

const BRIEF_TEXT = '# Webhook retries\nStatus: sharpening\nSource: demo/repo#12\n\n## Open questions\n- one\n- two\n'

const issue = (n: number, title: string, over: object = {}) => ({
  number: n, title, url: `https://github.com/o/r/issues/${n}`, state: 'OPEN', assignees: [],
  labels: [], blockedBy: { nodes: [] }, parent: null, createdAt: iso(48), closedAt: ZERO, updatedAt: iso(48), ...over,
})
const slice = (n: number, title: string, over: object = {}) =>
  issue(n, title, { labels: [{ name: 'solve:ticket' }, { name: 'solve:refined' }], parent: { number: 41 }, ...over })

const epicsOf = () => [
  issue(41, 'Epic title\u001b[31m', { updatedAt: iso(1) }),
  issue(50, 'Other epic', { updatedAt: iso(30) }),
]
const ticketsOf = (w: World) => [
  slice(42, 'done slice', { state: 'CLOSED', closedAt: iso(30), updatedAt: iso(30) }),
  slice(43, 'next slice', w.closed43 ? { state: 'CLOSED', closedAt: iso(0.5), updatedAt: iso(0.5) } : {}),
  slice(44, 'running slice', { assignees: w.claim44 ? [{ login: 'me' }] : [], updatedAt: iso(w.stale44 ? 5 : 1) }),
]
const prsOf = (w: World) => [
  { number: 55, title: 'slice 42', url: 'https://github.com/o/r/pull/55', state: 'MERGED', isDraft: false, createdAt: iso(32), mergedAt: iso(30), updatedAt: iso(30), closingIssuesReferences: [{ number: 42 }] },
  { number: 56, title: 'slice 44', url: 'https://github.com/o/r/pull/56', state: 'OPEN', isDraft: false, createdAt: iso(2), mergedAt: null, updatedAt: iso(w.stale44 ? 5 : 1), closingIssuesReferences: [{ number: 44 }] },
]

// Everything the mod asks the engine for, answered from the world.
const stubs = (on: On, surfaces: RenderSurface[], w: World) => {
  const clock = mock.clock(on, { now: NOW })
  const toasts: string[] = []
  const copied: string[] = []
  const filled: string[] = []
  on('process.run', ($, e) => {
    const done = { isStdoutTruncated: false, isStderrTruncated: false, stderr: '' }
    if (w.ghFails) return { value: { ...done, exitCode: 1, stdout: '', stderr: 'not logged in' } }
    // git status: one new ADR and an edited glossary, both uncommitted.
    if (e.argv[0] === 'git') return { value: { ...done, exitCode: 0, stdout: '?? docs/adr/0004-retries.md\n M docs/glossary.md\n' } }
    const out =
      e.argv[1] === 'api' ? iso(w.stale44 ? 6 : 2)
      : e.argv[1] === 'pr' ? (w.noEpics ? [] : prsOf(w))
      : e.argv.includes('solve:epic') ? (w.noEpics ? [] : epicsOf())
      : w.noEpics ? [] : ticketsOf(w)
    return { value: { ...done, exitCode: 0, stdout: JSON.stringify(out) } }
  })
  on('fs.exists', () => ({ value: true }))
  on('fs.list', () => ({ value: [{ name: 'idea.md', kind: 'file', size: 1, mtimeMs: NOW - 2 * 3_600_000, isLink: false }] }))
  on('fs.read', () => ({ value: BRIEF_TEXT }))
  on('ui.open', () => ({ value: { isPlaced: true } }))
  on('ui.panes', () => ({ value: [{ id: 'solve-flow', title: 'solve flow', isShown: true, isFocused: false, isPlaced: true }] }))
  on('ui.toast', ($, e) => {
    toasts.push(e.text)
    return { value: undefined }
  })
  on('ui.copy', ($, e) => {
    copied.push(e.text)
    return { value: { isCopied: true } }
  })
  on('prompt.read', () => ({ value: { text: w.draft, cursor: 0 } }))
  on('prompt.fill', ($, e) => {
    filled.push(e.text)
    return { isFilled: true }
  })
  on('session.surfaces', () => ({ value: surfaces }))
  on('session.start', () => ({ cwd: '/work' }))
  on('command.register', ($, e) => ({ value: { command: e.name } }))
  return { clock, toasts, copied, filled }
}

test('/solve-pane draws the focused epic on terminal and desktop, with links, and strips control characters', async ($, on) => {
  stubs(on, ['terminal'], newWorld())
  await $.command.run(FLOW)

  for (const surface of ['terminal', 'desktop'] as const) {
    const ui = await $.ui.mount({ ...PANE, surface })
    // The epic's title is a link to its issue, with control characters already stripped.
    const title = await ui.find({ type: 'Link' })
    expect(title?.props.label).toBe('#41 Epic title [31m')
    expect(title?.props.href).toBe('https://github.com/o/r/issues/41')
    expect(await ui.find({ type: 'Text', text: /next slice/ })).toBeDefined()
    expect(await ui.find({ type: 'Text', text: /to-tickets/ })).toBeDefined()
    expect(await ui.find({ type: 'Text', text: /1\/3 · \+1 brief/ })).toBeDefined()
    // The in-progress slice shows a spinner frame, and its number is a link.
    expect(await ui.find({ type: 'Text', text: /[◒◐◓◑]  ship/ })).toBeDefined()
    expect(await ui.find({ type: 'Link', key: undefined })).toBeDefined()
    expect(await ui.find({ type: 'Text', text: /\u001b/ })).toBeUndefined()
    await ui.unmount()
  }
})

test('/solve-pane answers in text where nothing draws', async ($, on) => {
  stubs(on, ['vscode'], newWorld())
  const answer = await $.command.run(FLOW)
  expect(answer.text).toContain('#41 Epic title')
  expect(answer.text).toContain('[ship 1/3]')
  expect(answer.text).toContain('next: Wait: ship is working on #44')
  expect(answer.text).toContain('brief idea [sharpen]')
})

test('a gh failure shows in the text, not silently', async ($, on) => {
  stubs(on, ['vscode'], newWorld({ ghFails: true }))
  const answer = await $.command.run(FLOW)
  expect(answer.text).toBe('gh failed: not logged in')
})

test('a quiet claimed slice is flagged, and the spinner stops', async ($, on) => {
  stubs(on, ['vscode'], newWorld({ stale44: true }))
  const answer = await $.command.run(FLOW)
  expect(answer.text).toContain('Stalled: #44')
})

test('toasts say what changed between two polls', async ($, on) => {
  const w = newWorld()
  const { clock, toasts } = stubs(on, ['terminal'], w)
  await $.session.start({ surface: 'terminal', isInteractive: true, cwd: '/work' })
  await $.command.run(FLOW)
  expect(toasts).toEqual([])

  w.closed43 = true
  await clock.advance(60_000)
  await clock.settle()
  expect(toasts).toEqual(['#43 closed: next slice'])
})

test('use puts the next command in the prompt without sending it', async ($, on) => {
  const { filled, copied, toasts } = stubs(on, ['terminal'], newWorld({ claim44: false }))
  await $.command.run(FLOW)
  const ui = await $.ui.mount({ ...PANE, surface: 'terminal' })
  const button = await ui.find({ key: 'use' })
  expect(button?.props.label).toBe('use /solve:ship #41')
  expect(button?.props.hotkey).toBe('u')
  await ui.press({ key: 'use' })
  expect(filled).toEqual(['/solve:ship #41'])
  expect(copied).toEqual([])
  expect(toasts).toEqual(['/solve:ship #41 is in the prompt: press Enter to run it'])
})

test('use leaves a draft alone and copies the command instead', async ($, on) => {
  const { filled, copied, toasts } = stubs(on, ['terminal'], newWorld({ claim44: false, draft: 'half a thought' }))
  await $.command.run(FLOW)
  const ui = await $.ui.mount({ ...PANE, surface: 'terminal' })
  await ui.press({ key: 'use' })
  expect(filled).toEqual([])
  expect(copied).toEqual(['/solve:ship #41'])
  expect(toasts).toEqual(['copied /solve:ship #41'])
})

test('the refresh button reloads now instead of waiting for the poll', async ($, on) => {
  const w = newWorld()
  const { toasts } = stubs(on, ['terminal'], w)
  await $.command.run(FLOW)
  const ui = await $.ui.mount({ ...PANE, surface: 'terminal' })
  expect((await ui.find({ key: 'refresh' }))?.props.hotkey).toBe('r')
  w.closed43 = true
  await ui.press({ key: 'refresh' })
  expect(toasts).toEqual(['#43 closed: next slice'])
})

test('a failed refresh keeps the last data on screen and says so, with the time of that data', async ($, on) => {
  const w = newWorld()
  stubs(on, ['terminal'], w)
  await $.command.run(FLOW)
  const ui = await $.ui.mount({ ...PANE, surface: 'terminal' })
  expect(await ui.find({ type: 'Text', text: /gh failed/ })).toBeUndefined()

  w.ghFails = true
  await ui.press({ key: 'refresh' })
  // The epic is still drawn; only the footer changed.
  expect(await ui.find({ type: 'Text', text: /[◒◐◓◑]  ship/ })).toBeDefined()
  expect(await ui.find({ type: 'Text', text: /⚠ gh failed: not logged in · showing data from \d\d:\d\d:\d\d/ })).toBeDefined()
})

test('the footer names the keys that work here, and when the data is from', async ($, on) => {
  stubs(on, ['terminal'], newWorld())
  await $.command.run(FLOW)
  const ui = await $.ui.mount({ ...PANE, surface: 'terminal' })
  // A drain is running, so there is no command to use; two or more flows, so p/n.
  expect(await ui.find({ type: 'Text', text: /r refresh · p\/n switch · esc back to prompt  ·  updated \d\d:\d\d:\d\d/ })).toBeDefined()
  expect(await ui.find({ type: 'Text', text: /u use/ })).toBeUndefined()
})

test('prev and next cycle the epics and the brief', async ($, on) => {
  stubs(on, ['terminal'], newWorld())
  await $.command.run(FLOW)
  const ui = await $.ui.mount({ ...PANE, surface: 'terminal' })
  const spinner = /[◒◐◓◑]  ship/
  const waiting = /waiting to be cut into slices/

  // #41 is in focus: its drain is running, one of three slices closed.
  expect((await ui.find({ key: 'next' }))?.props.hotkey).toBe('n')
  expect((await ui.find({ key: 'prev' }))?.props.hotkey).toBe('p')
  expect(await ui.find({ type: 'Text', text: spinner })).toBeDefined()
  expect(await ui.find({ type: 'Text', text: /1 done · 1 running · 1 waiting/ })).toBeDefined()
  expect(await ui.find({ type: 'Text', text: /1\/3 slices/ })).toBeDefined()
  expect(await ui.find({ type: 'Text', text: /opened 2d 0h ago · active 1h ago/ })).toBeDefined()
  expect(await ui.find({ type: 'Text', text: /also/ })).toBeUndefined()
  expect(await ui.find({ type: 'Text', text: waiting })).toBeUndefined()

  await ui.press({ key: 'next' })
  expect(await ui.find({ type: 'Text', text: waiting })).toBeDefined()
  expect(await ui.find({ type: 'Text', text: spinner })).toBeUndefined()

  // The brief is the third flow: sharpen is where it stands.
  await ui.press({ key: 'next' })
  expect(await ui.find({ type: 'Text', text: /Webhook retries/ })).toBeDefined()
  expect(await ui.find({ type: 'Text', text: /brief ready, waiting for to-spec/ })).toBeDefined()

  // Three flows: next wraps back to the first.
  await ui.press({ key: 'next' })
  expect(await ui.find({ type: 'Text', text: waiting })).toBeUndefined()
  expect(await ui.find({ type: 'Text', text: spinner })).toBeDefined()
})

test('a stalled slice raises a red line at the top of the pane', async ($, on) => {
  stubs(on, ['terminal'], newWorld({ stale44: true }))
  await $.command.run(FLOW)
  const ui = await $.ui.mount({ ...PANE, surface: 'terminal' })
  expect(await ui.find({ type: 'Text', text: /no activity for 5h/ })).toBeDefined()
  expect(await ui.find({ type: 'Text', text: /1 done · 1 stalled · 1 waiting/ })).toBeDefined()
})

test('with no epic yet, the brief is the card: title, what is open, what is pending, and the command', async ($, on) => {
  stubs(on, ['terminal'], newWorld({ noEpics: true }))
  await $.command.run(FLOW)
  const ui = await $.ui.mount({ ...PANE, surface: 'terminal' })

  expect(await ui.find({ type: 'Text', text: /No briefs or open epics/ })).toBeUndefined()
  expect(await ui.find({ type: 'Text', text: 'Webhook retries' })).toBeDefined()
  expect(await ui.find({ type: 'Text', text: /brief written 2h ago · from demo\/repo#12/ })).toBeDefined()
  expect(await ui.find({ type: 'Text', text: /2 open questions · \+1 ADR · glossary edited/ })).toBeDefined()
  expect(await ui.find({ type: 'Text', text: /◆  sharpen/ })).toBeDefined()
  expect(await ui.find({ type: 'Text', text: /brief ready, waiting for to-spec/ })).toBeDefined()
  expect((await ui.find({ key: 'use' }))?.props.label).toBe('use /solve:to-spec docs/specs/idea.md')
  // One flow only: nothing to cycle through.
  expect(await ui.find({ key: 'next' })).toBeUndefined()
})
