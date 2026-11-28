import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import {
  DREAM_DEFAULT_INTERVAL_HOURS,
  DREAM_MAX_INTERVAL_HOURS,
  DREAM_MIN_INTERVAL_HOURS,
  MAX_REPORT_CHARS,
  MAX_REPORT_ROOTS,
  compactReport,
  defaultDreamSettings,
  dreamDue,
  dreamProjects,
  dreamReportText,
  dreamStatus,
  nextDreamAt,
  normalizeDreamSettings,
} from '../src/memory-dream.js'
import { writeMemory } from '../src/memory.js'

const NOW = new Date('2026-11-28T12:00:00.000Z')

function tempProject() {
  return mkdtempSync(join(tmpdir(), 'compression-tiers-dream-'))
}

test('dream settings default off, clamp the interval and keep only a bounded report', () => {
  assert.deepEqual(defaultDreamSettings(), {
    enabled: false,
    intervalHours: DREAM_DEFAULT_INTERVAL_HOURS,
    lastRunAt: null,
    lastReport: null,
  })
  assert.equal(normalizeDreamSettings({}).enabled, false)
  assert.equal(normalizeDreamSettings({ enabled: 'yes' }).enabled, false)
  assert.equal(normalizeDreamSettings({ enabled: true }).enabled, true)
  assert.equal(normalizeDreamSettings({ intervalHours: 0 }).intervalHours, DREAM_MIN_INTERVAL_HOURS)
  assert.equal(normalizeDreamSettings({ intervalHours: 999 }).intervalHours, DREAM_MAX_INTERVAL_HOURS)
  assert.equal(normalizeDreamSettings({ intervalHours: 2.6 }).intervalHours, 3)
  assert.equal(normalizeDreamSettings({ intervalHours: 'abc' }).intervalHours, DREAM_DEFAULT_INTERVAL_HOURS)
  assert.equal(normalizeDreamSettings({ lastRunAt: 'not-a-date' }).lastRunAt, null)
  assert.equal(normalizeDreamSettings({ lastRunAt: '2026-11-27T00:00:00.000Z' }).lastRunAt, '2026-11-27T00:00:00.000Z')
  assert.equal(normalizeDreamSettings({ lastReport: { ranAt: 'nope' } }).lastReport.ranAt, new Date(0).toISOString())
})

test('due and next-run arithmetic never runs more often than the interval', () => {
  assert.equal(dreamDue(null, 24, NOW), true)
  assert.equal(dreamDue(NOW.toISOString(), 24, new Date(NOW.getTime() + 23 * 3_600_000)), false)
  assert.equal(dreamDue(NOW.toISOString(), 24, new Date(NOW.getTime() + 24 * 3_600_000)), true)
  assert.equal(nextDreamAt(null, 24, NOW), NOW.toISOString())
  assert.equal(nextDreamAt(NOW.toISOString(), 24, NOW), new Date(NOW.getTime() + 24 * 3_600_000).toISOString())
  // A stale last run clamps the next date to "now" instead of inventing a past one.
  assert.equal(nextDreamAt('2020-01-01T00:00:00.000Z', 1, NOW), NOW.toISOString())
})

test('a batch consolidates every healthy project and isolates the broken one', async () => {
  const good = tempProject()
  const bad = join(tmpdir(), 'compression-tiers-dream-missing-does-not-exist')
  try {
    writeMemory(good, { kind: 'fact', claim: '美术命名一律小写加下划线' }, { now: NOW })
    writeMemory(good, { kind: 'fact', claim: '美术命名一律小写加下划线（重复）', force: true }, { now: NOW })
    writeMemory(good, { kind: 'fact', claim: '季度评审临时事实', expiresAt: '2026-11-01' }, { now: NOW })
    const report = await dreamProjects([
      { id: 'good', title: 'Good', path: good },
      { id: 'bad', title: 'Missing', path: bad },
    ], { now: NOW, trigger: 'schedule' })
    assert.equal(report.trigger, 'schedule')
    assert.equal(report.totals.roots, 2)
    assert.equal(report.totals.ok, 1)
    assert.equal(report.totals.failed, 1)
    assert.equal(report.totals.merged, 1)
    assert.equal(report.totals.expired, 1)
    const goodEntry = report.roots.find((root) => root.id === 'good')
    const badEntry = report.roots.find((root) => root.id === 'bad')
    assert.equal(goodEntry.ok, true)
    assert.equal(goodEntry.merged, 1)
    assert.equal(goodEntry.expired, 1)
    assert.ok(goodEntry.indexLines > 0)
    assert.equal(badEntry.ok, false)
    assert.match(badEntry.error, /does not exist/)
    const text = dreamReportText(report)
    assert.match(text, /工作区 2 · 成功 1 \/ 失败 1/)
    assert.match(text, /归并 1 条 · 退役 1 条/)
    assert.match(text, /失败 Missing/)
  } finally {
    rmSync(good, { recursive: true, force: true })
  }
})

test('shouldStop cancels the rest of the batch without touching the current project', async () => {
  const first = tempProject()
  const second = tempProject()
  try {
    let calls = 0
    const report = await dreamProjects([
      { id: 'a', title: 'A', path: first },
      { id: 'b', title: 'B', path: second },
    ], {
      now: NOW,
      shouldStop: () => {
        calls += 1
        return calls > 1
      },
    })
    assert.equal(report.stopped, true)
    assert.equal(report.totals.roots, 1)
    assert.match(dreamReportText(report), /手动取消/)
  } finally {
    rmSync(first, { recursive: true, force: true })
    rmSync(second, { recursive: true, force: true })
  }
})

test('a cancel that arrives between projects stops the rest of the pass', async () => {
  const first = tempProject()
  const second = tempProject()
  const third = tempProject()
  try {
    // The gap between two projects is exactly where a cancel POST is served, so
    // the pause is where the test arms it — the project already running must not
    // be interrupted, and the two behind it must not start.
    let cancel = false
    let pauses = 0
    const report = await dreamProjects([
      { id: 'a', title: 'A', path: first },
      { id: 'b', title: 'B', path: second },
      { id: 'c', title: 'C', path: third },
    ], {
      now: NOW,
      shouldStop: () => cancel,
      pause: async () => {
        pauses += 1
        await new Promise((resolve) => { setImmediate(resolve) })
        cancel = true
      },
    })
    assert.equal(pauses, 1, 'the pass pauses only while another project is left')
    assert.equal(report.stopped, true)
    assert.equal(report.totals.roots, 1)
    assert.equal(report.roots[0].id, 'a', 'the project in flight still finished')
    assert.equal(report.totals.failed, 0)
  } finally {
    for (const dir of [first, second, third]) rmSync(dir, { recursive: true, force: true })
  }
})

test('the default pause really hands the event loop back between projects', async () => {
  const first = tempProject()
  const second = tempProject()
  try {
    const order = []
    setImmediate(() => { order.push('host') })
    const report = await dreamProjects([
      { id: 'a', title: 'A', path: first },
      { id: 'b', title: 'B', path: second },
    ], { now: NOW })
    assert.deepEqual(order, ['host'], 'a scheduled host task runs before the pass ends')
    assert.equal(report.totals.ok, 2)
  } finally {
    rmSync(first, { recursive: true, force: true })
    rmSync(second, { recursive: true, force: true })
  }
})

test('a report is truncated to the root cap and the byte budget', () => {
  const roots = Array.from({ length: MAX_REPORT_ROOTS + 10 }, (_, index) => ({
    id: `p${index}`,
    title: `Project ${index}`,
    path: `C:/projects/${index}`,
    ok: true,
    merged: index,
    expired: 0,
    conflicts: 0,
    indexLines: 10,
    over: false,
    foreign: false,
    missing: 0,
    error: '',
  }))
  const report = compactReport({ ranAt: NOW.toISOString(), totals: { roots: roots.length }, roots })
  assert.ok(report.roots.length <= MAX_REPORT_ROOTS)
  assert.ok(report.truncated >= 10)
  assert.ok(Buffer.byteLength(JSON.stringify(report)) <= MAX_REPORT_CHARS)
  const longError = compactReport({
    ranAt: NOW.toISOString(),
    roots: [{ id: 'x', title: 'X', path: 'C:/x', ok: false, error: 'e'.repeat(5000) }],
  })
  assert.ok(Buffer.byteLength(JSON.stringify(longError)) <= MAX_REPORT_CHARS)
  assert.ok(longError.roots[0].error.length <= 300)
  writeFileSync(join(tmpdir(), 'compression-tiers-dream-size.tmp'), JSON.stringify(longError))
  rmSync(join(tmpdir(), 'compression-tiers-dream-size.tmp'), { force: true })
})

test('status payload reports schedule, next run and the last report text', () => {
  const disabled = dreamStatus({ enabled: false }, { now: NOW })
  assert.equal(disabled.enabled, false)
  assert.equal(disabled.nextAt, null)
  assert.match(disabled.reportText, /还没有运行过/)
  const enabled = dreamStatus({ enabled: true, lastRunAt: NOW.toISOString(), intervalHours: 12 }, { now: NOW, running: true })
  assert.equal(enabled.running, true)
  assert.equal(enabled.cancelRequested, false)
  assert.equal(enabled.nextAt, new Date(NOW.getTime() + 12 * 3_600_000).toISOString())
  assert.equal(enabled.limits.maxIntervalHours, DREAM_MAX_INTERVAL_HOURS)
  const cancelling = dreamStatus({ enabled: true }, { now: NOW, running: true, cancelRequested: true })
  assert.equal(cancelling.cancelRequested, true)
  // The flag alone is not a state: an idle pass cannot be "cancelling".
  assert.equal(dreamStatus({ enabled: true }, { now: NOW, cancelRequested: true }).cancelRequested, false)
})
