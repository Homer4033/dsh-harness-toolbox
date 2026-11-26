import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import {
  HEATMAP_WEEKS,
  buildUsageHeatmap,
  dayKey,
  levelOf,
  readSessionUsage,
  sessionTokens,
  usageCacheDir,
  usageHeatmap,
} from '../src/usage-heatmap.js'

function tempHome() {
  return mkdtempSync(join(tmpdir(), 'compression-tiers-usage-'))
}

/** One projection-cache file in the shape the host writes it. */
function writeSession(home, id, createdAt, tokens) {
  const dir = usageCacheDir(home)
  mkdirSync(dir, { recursive: true })
  const totals = {
    uncachedInputTokens: tokens ? tokens.uncached : 0,
    outputTokens: tokens ? tokens.output : 0,
    cacheReadTokens: tokens ? tokens.read : 0,
    cacheWriteTokens: tokens ? tokens.write : 0,
  }
  writeFileSync(join(dir, `${id}.json`), JSON.stringify({
    version: 7,
    record: tokens
      ? { identity: { createdAt, cwd: '/tmp/ws' }, rows: { tokenUsage: { ver: 2, val: { totals } } } }
      : { identity: { createdAt, cwd: '/tmp/ws' }, rows: {} },
  }))
}

const LOCAL_NOON = (year, month, day) => new Date(year, month - 1, day, 12, 0, 0).getTime()

test('a session total adds every token bucket and ignores junk fields', () => {
  assert.equal(sessionTokens({ rows: { tokenUsage: { val: { totals: {
    uncachedInputTokens: 10, outputTokens: 20, cacheReadTokens: 100, cacheWriteTokens: 7,
  } } } } }), 137)
  // Missing buckets are zero; a negative or non-numeric bucket must not subtract.
  assert.equal(sessionTokens({ rows: { tokenUsage: { val: { totals: {
    uncachedInputTokens: 10, outputTokens: -5, cacheReadTokens: 'no', cacheWriteTokens: null,
  } } } } }), 10)
  // No usage row yet (a brand new session) is "unknown", not zero.
  assert.equal(sessionTokens({ rows: {} }), null)
  assert.equal(sessionTokens(null), null)
})

test('the cache reader keeps complete sessions and skips everything else', () => {
  const home = tempHome()
  try {
    writeSession(home, 'good', LOCAL_NOON(2026, 11, 20), { uncached: 5, output: 15, read: 80, write: 0 })
    writeSession(home, 'no-usage', LOCAL_NOON(2026, 11, 21), null)
    writeFileSync(join(usageCacheDir(home), 'broken.json'), '{ not json')
    const entries = readSessionUsage(home)
    assert.equal(entries.length, 1, 'only the readable, measured session counts')
    assert.equal(entries[0].tokens, 100)
    assert.equal(entries[0].cwd, '/tmp/ws')
  } finally {
    rmSync(home, { recursive: true, force: true })
  }
})

test('a missing cache directory is empty usage, not an error', () => {
  const home = tempHome()
  try {
    assert.deepEqual(readSessionUsage(home), [])
    const payload = usageHeatmap(home, { today: new Date(2026, 10, 26, 12) })
    assert.equal(payload.totalTokens, 0)
    assert.equal(payload.activeDays, 0)
    assert.equal(payload.columns.length, HEATMAP_WEEKS)
  } finally {
    rmSync(home, { recursive: true, force: true })
  }
})

test('the grid is 26 Monday-first weeks with a future flag on the tail', () => {
  const entries = [
    { createdAt: LOCAL_NOON(2026, 11, 16), tokens: 1000 },
    { createdAt: LOCAL_NOON(2026, 11, 17), tokens: 3000 },
    { createdAt: LOCAL_NOON(2026, 11, 17), tokens: 2000 },
    { createdAt: LOCAL_NOON(2026, 11, 26), tokens: 500 },
  ]
  const payload = buildUsageHeatmap(entries, { today: new Date(2026, 10, 26, 12) })

  assert.equal(payload.columns.length, HEATMAP_WEEKS)
  assert.equal(payload.columns.reduce((sum, column) => sum + column.days.length, 0), 182)
  // 2026-11-26 is a Thursday; its column starts on Monday the 23rd.
  const last = payload.columns[payload.columns.length - 1]
  assert.equal(last.start, '2026-11-23')
  assert.equal(last.days[0].date, '2026-11-23')
  assert.equal(last.days[6].date, '2026-11-29')
  // Monday..Thursday are real, the rest of that week has not happened yet.
  assert.deepEqual(last.days.map((day) => day.future), [false, false, false, false, true, true, true])
  assert.equal(last.days[3].tokens, 500, 'the 26th is the fourth day of its week')
  // Two sessions on the same Tuesday are summed, not overwritten.
  const previous = payload.columns[payload.columns.length - 2]
  assert.equal(previous.start, '2026-11-16')
  assert.equal(previous.days[0].tokens, 1000)
  assert.equal(previous.days[1].tokens, 5000)
  assert.equal(previous.days[1].sessions, 2)
  assert.equal(payload.totalTokens, 6500)
  assert.equal(payload.activeDays, 3)
  assert.equal(payload.maxDayTokens, 5000)
  // The busiest day is the darkest step, an untouched day has none.
  assert.equal(previous.days[1].level, 5)
  assert.equal(previous.days[2].tokens, 0)
  assert.equal(previous.days[2].level, 0)
})

test('intensity steps grow with usage and always reach five at the peak', () => {
  assert.equal(levelOf(0, 100), 0)
  assert.equal(levelOf(-5, 100), 0)
  assert.equal(levelOf(100, 0), 0)
  assert.equal(levelOf(100, 100), 5)
  let previous = 0
  for (const tokens of [1, 10, 100, 1000, 10000, 100000]) {
    const level = levelOf(tokens, 100000)
    assert.ok(level >= previous, `level must not fall at ${tokens}`)
    assert.ok(level >= 1 && level <= 5)
    previous = level
  }
  // A 1.5B day must not flatten a 30M day into the same colour.
  assert.ok(levelOf(30_000_000, 1_500_000_000) < levelOf(1_500_000_000, 1_500_000_000))
})

test('days are bucketed in local time, not UTC', () => {
  // 2026-11-20 00:30 local is still the 19th in UTC for +08:00 hosts; the grid
  // must follow the human calendar the panel shows.
  const lateNight = new Date(2026, 10, 20, 0, 30).getTime()
  assert.equal(dayKey(new Date(lateNight)), '2026-11-20')
  const payload = buildUsageHeatmap([{ createdAt: lateNight, tokens: 42 }], { today: new Date(2026, 10, 26, 12) })
  const flat = payload.columns.flatMap((column) => column.days)
  const day = flat.find((cell) => cell.date === '2026-11-20')
  assert.equal(day.tokens, 42)
})

test('the 7天 / 30天 / 全部 windows damp the grid and rescale the steps', () => {
  const entries = [
    { createdAt: LOCAL_NOON(2026, 10, 1), tokens: 9_000_000 },
    { createdAt: LOCAL_NOON(2026, 11, 20), tokens: 1_000_000 },
    { createdAt: LOCAL_NOON(2026, 11, 24), tokens: 5_000_000 },
    { createdAt: LOCAL_NOON(2026, 11, 25), tokens: 2_000_000 },
  ]
  const today = new Date(2026, 10, 26, 12)
  const all = buildUsageHeatmap(entries, { today })
  const month = buildUsageHeatmap(entries, { today, range: '30d' })
  const week = buildUsageHeatmap(entries, { today, range: '7d' })
  const dayAt = (payload, date) => payload.columns.flatMap((column) => column.days).find((day) => day.date === date)

  // 全部 keeps all four days lit; 30天 drops the October day; 7天 keeps only the
  // last seven days (20th onward), so the 24th/25th still count.
  assert.equal(all.activeDays, 4)
  assert.equal(dayAt(all, '2026-10-01').active, true)
  assert.equal(dayAt(month, '2026-10-01').active, false)
  assert.equal(dayAt(month, '2026-10-01').level, 0, 'out-of-window days go dark')
  assert.equal(month.totalTokens, 8_000_000)
  assert.equal(month.sessions, 3)
  assert.equal(month.maxDayTokens, 5_000_000)
  assert.equal(week.range, '7d')
  assert.equal(week.totalTokens, 8_000_000, 'the 20th is seven days before the 26th')
  assert.equal(week.activeDays, 3)

  // Steps are scaled to the window's own peak: the 5M day is the darkest of its
  // window even though the whole board has a 9M day outside it.
  assert.equal(dayAt(month, '2026-11-24').level, 5)
  assert.equal(dayAt(all, '2026-10-01').level, 5)
  assert.ok(dayAt(month, '2026-11-25').level < 5)

  // The headline numbers follow the window, and an unknown range is the board.
  assert.equal(month.peakDay, '2026-11-24')
  assert.equal(all.peakDay, '2026-10-01')
  assert.equal(buildUsageHeatmap(entries, { today, range: 'bogus' }).range, 'all')
  assert.equal(all.streak, 2, 'the 24th and 25th are active; today is still empty')
})
