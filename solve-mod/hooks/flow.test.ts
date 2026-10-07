import { expect, test } from 'claude-code/testing'
import {
  STALE_MS, age, alerts, briefCommand, briefLines, briefRoute, counts, firstItem, itemsOf, lastActive, parseBrief, segments, changes, commandFor, describe, focusOf, isStale, markOf, nextStep, pulse, route, spine, stageOf, startable, tabMark, timeline,
} from './flow'
import type { Brief, Epic, Flow, Pr, Slice } from '../types'

const H = 3_600_000
const slice = (n: number, over: Partial<Slice> = {}): Slice => ({
  number: n, title: `s${n}`, url: `u/${n}`, done: false, claimed: false, blockedBy: [], refined: true,
  createdAt: 100, updatedAt: 100, ...over,
})
const pr = (n: number, closes: number[], over: Partial<Pr> = {}): Pr => ({
  number: n, title: `pr${n}`, url: `p/${n}`, isDraft: false, state: 'OPEN', createdAt: 150, updatedAt: 150, closes, ...over,
})
const epic = (slices: Slice[], over: Partial<Epic> = {}): Epic => ({
  number: 1, title: 'e', url: 'u/1', createdAt: 50, updatedAt: 50, slices, prs: [], ...over,
})
const flowOf = (epics: Epic[], at: number): Flow => ({ briefs: [], epics, at })
const brief = (name: string, over: Partial<Brief> = {}): Brief => ({
  name, title: `T ${name}`, writtenAt: 1000, openQuestions: 0, adrs: 0, glossary: false, ...over,
})

test('stage follows the slices', () => {
  expect(stageOf(epic([]))).toBe('to-tickets')
  expect(stageOf(epic([slice(2), slice(3, { done: true })]))).toBe('ship')
  expect(stageOf(epic([slice(2, { done: true })]))).toBe('land')
})

test('next slice skips claimed, blocked and unrefined; closed blockers do not count', () => {
  const e = epic([slice(2, { claimed: true }), slice(3, { blockedBy: [2] }), slice(4, { refined: false }), slice(5, { blockedBy: [9] })])
  expect(startable(e)?.number).toBe(5)
  // #2 is claimed and fresh, so a drain is running: wait, don't start another.
  expect(nextStep(e, 200)).toBe('Wait: ship is working on #2')
  const idle = epic([slice(2, { done: true, closedAt: 9 }), slice(3, { blockedBy: [4] }), slice(4), slice(5, { refined: false })])
  expect(nextStep(idle, 200)).toBe('Run /solve:ship #1, it starts with slice #4')
})

test('a claimed slice goes stale after STALE_MS without activity; a PR push counts as activity', () => {
  const claimed = slice(2, { claimed: true, claimedAt: 1000, updatedAt: 1000 })
  const e = epic([claimed])
  expect(isStale(e, claimed, 1000 + STALE_MS)).toBe(false)
  expect(isStale(e, claimed, 1001 + STALE_MS)).toBe(true)
  const pushed = epic([claimed], { prs: [pr(7, [2], { updatedAt: 1000 + 2 * H })] })
  expect(isStale(pushed, claimed, 1001 + STALE_MS)).toBe(false)
  expect(nextStep(e, 1001 + STALE_MS)).toContain('Stalled: #2')
  expect(isStale(e, slice(3), 1e12)).toBe(false)
})

test('describe gives one line per brief and epic', () => {
  const text = describe({ briefs: [brief('idea')], epics: [epic([slice(2, { done: true }), slice(3)])], at: 0 })
  expect(text).toContain('brief idea [sharpen] next: run /solve:to-spec docs/specs/idea.md')
  expect(text).toContain('[ship 1/2]')
  expect(describe({ briefs: [], epics: [], at: 0, error: 'boom' })).toBe('gh failed: boom')
})

test('timeline: dated past in order, then what is ahead, ending in land', () => {
  const e = epic([
    slice(2, { done: true, closedAt: 300 }),
    slice(3, { claimed: true, claimedAt: 310, updatedAt: 310 }),
    slice(4, { blockedBy: [3] }),
    slice(5),
    slice(6, { refined: false }),
  ])
  const { past, ahead } = timeline(e, 320)
  expect(past.map(p => p.at)).toEqual([50, 100, 300, 310])
  expect(ahead.map(a => a.mark)).toEqual(['●', '⏸', '▶', '○', '○'])
  expect(ahead.at(-1)?.text).toBe('land')
  expect(ahead[0]?.ref).toEqual({ label: '#3', href: 'u/3' })
})

test('timeline: PR events join the past, and a stale slice is flagged ahead', () => {
  const e = epic(
    [slice(2, { claimed: true, claimedAt: 200, updatedAt: 200 })],
    { prs: [pr(7, [2], { createdAt: 250, updatedAt: 250 }), pr(8, [2], { createdAt: 260, mergedAt: 270, updatedAt: 270 })] },
  )
  const { past, ahead } = timeline(e, 270 + STALE_MS + 1)
  expect(past.map(p => p.text)).toContain('opened for #2')
  expect(past.map(p => p.text)).toContain('merged')
  expect(past.find(p => p.text === 'merged')?.ref?.label).toBe('PR #8')
  expect(ahead[0]?.mark).toBe('⚠')
})

test('timeline: no slices asks for to-tickets; all closed points at the integration PR', () => {
  expect(timeline(epic([]), 0).ahead[0]?.text).toContain('to-tickets')
  const waiting = timeline(epic([slice(2, { done: true, closedAt: 300 })]), 0)
  expect(waiting.ahead).toEqual([{ mark: '▶', text: 'waiting for the integration PR' }])
  const open = timeline(epic([slice(2, { done: true, closedAt: 300 })], { prs: [pr(9, [1], { isDraft: true })] }), 0)
  expect(open.ahead).toEqual([{ mark: '▶', ref: { label: 'PR #9', href: 'p/9' }, text: 'review the integration PR, then land' }])
  expect(open.past.map(p => p.text)).toContain('opened as the integration PR (draft)')
})

test('focus: the epic being drained, else the one touched last', () => {
  const busy = epic([slice(2, { claimed: true })], { number: 7, updatedAt: 1 })
  const recent = epic([slice(3)], { number: 8, updatedAt: 999 })
  expect(focusOf([recent, busy])?.number).toBe(7)
  expect(focusOf([epic([], { number: 1, updatedAt: 1 }), recent])?.number).toBe(8)
})

test('spine marks what is done, where we are and what is left', () => {
  const states = (e: Epic) => spine(e).map(s => s.state)
  expect(states(epic([]))).toEqual(['done', 'done', 'now', 'todo', 'todo'])
  expect(states(epic([slice(2)]))).toEqual(['done', 'done', 'done', 'now', 'todo'])
  expect(states(epic([slice(2, { done: true })]))).toEqual(['done', 'done', 'done', 'done', 'now'])
})

test('one glyph per slice', () => {
  const e = epic([slice(2, { done: true }), slice(3, { claimed: true }), slice(4, { blockedBy: [3] }), slice(5), slice(6), slice(7, { claimed: true })])
  const next = startable(e)
  const marks = e.slices.map(s => markOf(s, next, s.number === 7))
  expect(marks).toEqual(['✓', '●', '⏸', '▶', '○', '⚠'])
})

test('age and pulse read in plain units', () => {
  expect(age(5 * 60_000)).toBe('5m')
  expect(age(3 * H)).toBe('3h')
  expect(age(31 * H)).toBe('1d 7h')
  const e = epic([slice(2, { done: true, closedAt: H })], { createdAt: 0 })
  expect(pulse(e, 4 * H)).toBe('opened 4h ago · active 3h ago')
})

test('the command worth copying depends on where the epic is', () => {
  expect(commandFor(epic([]))).toBe('/solve:to-tickets #1')
  expect(commandFor(epic([slice(2)]))).toBe('/solve:ship #1')
  expect(commandFor(epic([slice(2, { claimed: true })]))).toBeUndefined()
  const done = [slice(2, { done: true, closedAt: 1 })]
  expect(commandFor(epic(done))).toBeUndefined()
  expect(commandFor(epic(done, { prs: [pr(9, [1])] }))).toBe('/solve:land #1')
})

test('changes: a closed slice, a new integration PR and a newly stale slice each say so; the first load says nothing', () => {
  const before = flowOf([epic([slice(2, { claimed: true, updatedAt: 0 }), slice(3, { claimed: true, updatedAt: 0 })])], 1000)
  expect(changes(undefined, before)).toEqual([])
  const closed = flowOf([epic([slice(2, { done: true, closedAt: 2000 }), slice(3, { claimed: true, updatedAt: 0 })])], 2000)
  expect(changes(before, closed)).toEqual(['#2 closed: s2'])
  const stale = flowOf([epic([slice(2, { done: true, closedAt: 2000 }), slice(3, { claimed: true, updatedAt: 0 })])], STALE_MS + 5000)
  expect(changes(closed, stale)).toEqual(['#3 has had no activity for 3h'])
  // already stale on both loads: no repeat
  expect(changes(stale, { ...stale, at: STALE_MS + 9000 })).toEqual([])
  const allDone = flowOf([epic([slice(2, { done: true }), slice(3, { done: true })])], 9000)
  expect(changes(closed, allDone)).toContain('#1: all slices closed')
  const withPr = flowOf([epic([slice(2, { done: true }), slice(3, { done: true })], { prs: [pr(9, [1])] })], 9000)
  expect(changes(allDone, withPr)).toEqual(['#1 integration PR #9 opened: ready for review'])
})

test('a tab wears the state of its epic: stalled, running, waiting on you, or idle', () => {
  const claimed = slice(2, { claimed: true, claimedAt: 1000, updatedAt: 1000 })
  expect(tabMark(epic([claimed]), 1000 + 1000)).toBe('●')
  expect(tabMark(epic([claimed]), 1001 + STALE_MS)).toBe('⚠')
  expect(tabMark(epic([slice(2)]), 0)).toBe('▶')
  expect(tabMark(epic([slice(2, { refined: false })]), 0)).toBe('○')
})

test('route: five stations, the slices hang from ship, and the epic waits where it is', () => {
  const e = epic(
    [slice(2, { done: true, closedAt: 300 }), slice(3, { claimed: true, claimedAt: 310, updatedAt: 310 }), slice(4, { blockedBy: [3] }), slice(5)],
    { prs: [pr(7, [3], { createdAt: 320, updatedAt: 320 })] },
  )
  const stations = route(e, 400)
  expect(stations.map(s => s.name)).toEqual(['sharpen', 'to-spec', 'to-tickets', 'ship', 'land'])
  expect(stations.map(s => s.mark)).toEqual(['✓', '✓', '✓', '●', '○'])
  const ship = stations[3]
  expect(ship?.rows.map(r => r.mark)).toEqual(['✓', '●', '⏸', '▶'])
  expect(ship?.rows[1]?.text).toContain('in progress, claimed')
  expect(ship?.rows[1]?.pr).toEqual({ ref: { label: 'PR #7', href: 'p/7' }, merged: false })
  expect(ship?.rows[0]?.pr).toBeUndefined()
})

test('route: a stalled drain turns the current station into a warning', () => {
  const claimed = slice(2, { claimed: true, claimedAt: 0, updatedAt: 0 })
  expect(route(epic([claimed]), STALE_MS + 1)[3]?.mark).toBe('⚠')
})

test('route: to-tickets waits for you; land links the integration PR once it exists', () => {
  const empty = route(epic([]), 0)
  expect(empty[2]).toMatchObject({ state: 'now', mark: '▶', text: 'waiting to be cut into slices' })
  const done = [slice(2, { done: true, closedAt: 300 })]
  expect(route(epic(done), 0)[4]).toMatchObject({ state: 'now', mark: '●' })
  const withPr = route(epic(done, { prs: [pr(9, [1], { isDraft: true })] }), 0)[4]
  expect(withPr).toMatchObject({ mark: '▶', ref: { label: 'PR #9', href: 'p/9' }, text: 'draft, review it then land' })
})

test('segments: one per slice in order, three states, sharing about 24 cells, at least one each', () => {
  const four = epic([slice(2, { done: true }), slice(3, { claimed: true }), slice(4, { blockedBy: [3] }), slice(5)])
  expect(segments(four, 200)).toEqual([
    { state: 'done', cells: 6 }, { state: 'doing', cells: 6 }, { state: 'todo', cells: 6 }, { state: 'todo', cells: 6 },
  ])
  // A stalled slice is still claimed, so it stays "doing"; the alert is what flags it.
  const quiet = epic([slice(2, { claimed: true, updatedAt: 0 })])
  expect(segments(quiet, STALE_MS + 1).map(s => s.state)).toEqual(['doing'])
  const many = epic(Array.from({ length: 40 }, (_, i) => slice(i + 2)))
  expect(segments(many, 0).every(s => s.cells === 1)).toBe(true)
})

test('lastActive takes the newest sign of life anywhere, and ignores a missing date', () => {
  const e = epic(
    [slice(2, { updatedAt: 500 }), slice(3, { done: true, closedAt: Number.NaN, updatedAt: 200 })],
    { updatedAt: 100, prs: [pr(7, [2], { updatedAt: 700 })] },
  )
  expect(lastActive(e)).toBe(700)
})

test('counts name only the states that exist', () => {
  const e = epic([slice(2, { done: true }), slice(3, { claimed: true }), slice(4, { blockedBy: [3] }), slice(5), slice(6, { refined: false })])
  expect(counts(e, 200)).toBe('1 done · 1 running · 1 blocked · 2 waiting')
  expect(counts(epic([slice(2, { claimed: true, updatedAt: 0 })]), STALE_MS + 1)).toBe('1 stalled')
  expect(counts(epic([]), 0)).toBe('')
})

test('alerts list the stalled slices and nothing else', () => {
  const quiet = slice(2, { claimed: true, updatedAt: 0 })
  const e = epic([quiet, slice(3, { claimed: true, updatedAt: STALE_MS }), slice(4)])
  expect(alerts(e, STALE_MS + 1)).toEqual([{ ref: { label: '#2', href: 'u/2' }, text: 'no activity for 3h' }])
  expect(alerts(epic([slice(2)]), 0)).toEqual([])
})

const BRIEF = `# Webhook retries
Status: sharpening
Source: demo/repo#12

## Problem
Failed webhooks are dropped.

## Open questions
- How many retries?
- Who gets paged?
1. Backoff curve?

## Out of scope
- Dashboards
`

test('parseBrief reads title, source and counts the open questions, not the sections after them', () => {
  expect(parseBrief('retries', BRIEF, 5)).toEqual({
    name: 'retries', title: 'Webhook retries', source: 'demo/repo#12', writtenAt: 5, openQuestions: 3,
  })
  const bare = parseBrief('x', 'Status: sharpening\n', undefined)
  expect(bare).toEqual({ name: 'x', title: 'x', source: undefined, writtenAt: undefined, openQuestions: 0 })
  // The section runs to the end of the file when nothing follows it.
  expect(parseBrief('x', '## Open questions\n- one\n- two\n', 0).openQuestions).toBe(2)
})

test('a brief walks the same route: sharpen is where it stands, the rest wait', () => {
  const stations = briefRoute(brief('idea'))
  expect(stations.map(s => `${s.name}:${s.state}`)).toEqual([
    'sharpen:now', 'to-spec:todo', 'to-tickets:todo', 'ship:todo', 'land:todo',
  ])
  expect(stations[0]).toMatchObject({ mark: '▶', text: 'brief ready, waiting for to-spec', when: 1000 })
  expect(briefCommand(brief('idea'))).toBe('/solve:to-spec docs/specs/idea.md')
})

test('brief header lines say when it was written, where from, and what is still open', () => {
  expect(briefLines(brief('a', { writtenAt: 0 }), 2 * H)).toEqual(['brief written 2h ago', 'no open questions'])
  const busy = brief('a', { writtenAt: 0, source: 'o/r#12', openQuestions: 1, adrs: 2, glossary: true })
  expect(briefLines(busy, 2 * H)).toEqual(['brief written 2h ago · from o/r#12', '1 open question · +2 ADRs · glossary edited'])
  expect(briefLines(brief('a', { writtenAt: undefined }), 0)[0]).toBe('brief written')
})

test('items: epics by number, then briefs by name; an epic leads when there is one, a brief when there is not', () => {
  const flow: Flow = { briefs: [brief('b'), brief('a')], epics: [epic([], { number: 9, updatedAt: 999 }), epic([], { number: 3 })], at: 0 }
  expect(itemsOf(flow).map(i => i.key)).toEqual(['epic:3', 'epic:9', 'brief:a', 'brief:b'])
  expect(firstItem(itemsOf(flow))?.key).toBe('epic:9')
  expect(firstItem(itemsOf({ ...flow, epics: [] }))?.key).toBe('brief:a')
  expect(firstItem([])).toBeUndefined()
})

test('describe says when the data it shows is the last that loaded', () => {
  const flow: Flow = { briefs: [], epics: [epic([slice(2)])], at: 0, failed: { message: 'boom', at: 5 } }
  expect(describe(flow)).toContain('(gh failed: boom; this is the last data that loaded)')
  expect(describe({ ...flow, epics: [], failed: undefined })).toBe('No briefs or open epics. Start with sharpen.')
})
