/**
 * Nightly memory maintenance across every registered workspace.
 *
 * Consolidation itself lives in `memory.js` (deterministic merge, retire and
 * index rebuild). This module adds the three things a scheduled pass needs and
 * a single project does not: a due-time calculation, a batch runner that keeps
 * going when one project is broken, and a bounded report that can be persisted
 * into `settings.json` and painted in the panel without growing forever.
 *
 * No model is called and nothing is written outside the projects' own
 * `memory/` directories; the report is the only new state.
 */

import { dream, memoryRoot, reconcile } from './memory.js'

export const DREAM_DEFAULT_INTERVAL_HOURS = 24
export const DREAM_MIN_INTERVAL_HOURS = 1
export const DREAM_MAX_INTERVAL_HOURS = 168
/** How often the host half re-checks whether a pass is due. */
export const DREAM_CHECK_MS = 5 * 60_000
/** The report is injected into the panel and stored in settings.json. */
export const MAX_REPORT_CHARS = 8_000
export const MAX_REPORT_ROOTS = 50

const HOUR_MS = 3_600_000
const ISO_DATE = /^\d{4}-\d{2}-\d{2}T/

export function defaultDreamSettings() {
  return {
    enabled: false,
    intervalHours: DREAM_DEFAULT_INTERVAL_HOURS,
    lastRunAt: null,
    lastReport: null,
  }
}

function clampInterval(value) {
  const hours = Number(value)
  if (!Number.isFinite(hours)) return DREAM_DEFAULT_INTERVAL_HOURS
  return Math.min(DREAM_MAX_INTERVAL_HOURS, Math.max(DREAM_MIN_INTERVAL_HOURS, Math.round(hours)))
}

function isoOrNull(value) {
  if (typeof value !== 'string' || !ISO_DATE.test(value)) return null
  const time = Date.parse(value)
  return Number.isNaN(time) ? null : new Date(time).toISOString()
}

/** Trim a stored report so one runaway pass cannot bloat settings.json. */
export function compactReport(report) {
  if (!report || typeof report !== 'object') return null
  const roots = Array.isArray(report.roots) ? report.roots.slice(0, MAX_REPORT_ROOTS) : []
  const compact = {
    ranAt: isoOrNull(report.ranAt) || new Date(0).toISOString(),
    trigger: typeof report.trigger === 'string' ? report.trigger : 'manual',
    stopped: report.stopped === true,
    totals: report.totals && typeof report.totals === 'object' ? report.totals : {},
    roots: roots.map((root) => ({
      id: typeof root.id === 'string' ? root.id : '',
      title: typeof root.title === 'string' ? root.title : '',
      path: typeof root.path === 'string' ? root.path : '',
      ok: root.ok === true,
      merged: Number(root.merged) || 0,
      expired: Number(root.expired) || 0,
      conflicts: Number(root.conflicts) || 0,
      indexLines: Number(root.indexLines) || 0,
      over: root.over === true,
      foreign: root.foreign === true,
      missing: Number(root.missing) || 0,
      error: typeof root.error === 'string' ? root.error.slice(0, 300) : '',
    })),
  }
  if (report.roots && report.roots.length > MAX_REPORT_ROOTS) {
    compact.truncated = report.roots.length - MAX_REPORT_ROOTS
  }
  let text = JSON.stringify(compact)
  while (Buffer.byteLength(text) > MAX_REPORT_CHARS && compact.roots.length > 0) {
    compact.roots.pop()
    compact.truncated = (compact.truncated || 0) + 1
    text = JSON.stringify(compact)
  }
  return compact
}

export function normalizeDreamSettings(value) {
  const raw = value && typeof value === 'object' && !Array.isArray(value) ? value : {}
  return {
    enabled: raw.enabled === true,
    intervalHours: clampInterval(raw.intervalHours),
    lastRunAt: isoOrNull(raw.lastRunAt),
    lastReport: compactReport(raw.lastReport),
  }
}

/** Whether a pass is due now; never-run counts as due. */
export function dreamDue(lastRunAt, intervalHours, now = new Date()) {
  const last = isoOrNull(lastRunAt)
  if (!last) return true
  const interval = clampInterval(intervalHours) * HOUR_MS
  return now.getTime() - Date.parse(last) >= interval
}

/** When the next pass is due, or null while a never-run schedule is unknown. */
export function nextDreamAt(lastRunAt, intervalHours, now = new Date()) {
  const last = isoOrNull(lastRunAt)
  const interval = clampInterval(intervalHours) * HOUR_MS
  if (!last) return new Date(now.getTime()).toISOString()
  const next = Date.parse(last) + interval
  return new Date(Math.max(next, now.getTime())).toISOString()
}

function entryOf(project, outcome, error) {
  const base = {
    id: project && typeof project.id === 'string' ? project.id : '',
    title: project && typeof project.title === 'string' ? project.title : '',
    path: project && typeof project.path === 'string' ? project.path : '',
    ok: !error,
    merged: 0,
    expired: 0,
    conflicts: 0,
    indexLines: 0,
    over: false,
    foreign: false,
    missing: 0,
    expiredEntries: 0,
    overduePromises: 0,
    error: error ? String(error instanceof Error ? error.message : error).slice(0, 300) : '',
  }
  if (!outcome) return base
  return {
    ...base,
    merged: outcome.applied === true ? outcome.merged || 0 : 0,
    expired: outcome.applied === true ? outcome.expired || 0 : 0,
    conflicts: outcome.conflicts || 0,
    indexLines: outcome.index && Number.isFinite(outcome.index.lines) ? outcome.index.lines : 0,
    over: Boolean(outcome.index && outcome.index.over),
    foreign: Boolean(outcome.index && outcome.index.foreign),
    missing: outcome.report && outcome.report.drift ? outcome.report.drift.missingEvidence.length : 0,
    expiredEntries: outcome.report && outcome.report.drift ? outcome.report.drift.expired.length : 0,
    overduePromises: outcome.report && outcome.report.promises ? outcome.report.promises.overdue.length : 0,
  }
}

/**
 * One maintenance pass over many projects. A missing directory or a corrupt
 * store fails that project alone; the rest still run. `shouldStop` is checked
 * between projects so a manual cancel stops the remaining work without
 * interrupting the project currently being consolidated.
 */
export function dreamProjects(projects, options = {}) {
  const now = options.now instanceof Date ? options.now : new Date()
  const list = Array.isArray(projects) ? projects.filter((item) => item && typeof item === 'object') : []
  const entries = []
  let stopped = false
  for (const project of list.slice(0, MAX_REPORT_ROOTS * 2)) {
    if (typeof options.shouldStop === 'function' && options.shouldStop()) {
      stopped = true
      break
    }
    try {
      memoryRoot(project.path)
      const outcome = dream(project.path, { apply: true, now })
      const report = reconcile(project.path, { now })
      entries.push(entryOf(project, { ...outcome, report }))
    } catch (error) {
      entries.push(entryOf(project, null, error))
    }
  }
  const totals = entries.reduce((acc, entry) => {
    acc.roots += 1
    if (entry.ok) acc.ok += 1
    else acc.failed += 1
    acc.merged += entry.merged
    acc.expired += entry.expired
    acc.conflicts += entry.conflicts
    acc.missing += entry.missing
    acc.expiredEntries += entry.expiredEntries
    acc.overduePromises += entry.overduePromises
    if (entry.over) acc.overIndex += 1
    if (entry.foreign) acc.foreignIndex += 1
    return acc
  }, {
    roots: 0,
    ok: 0,
    failed: 0,
    merged: 0,
    expired: 0,
    conflicts: 0,
    missing: 0,
    expiredEntries: 0,
    overduePromises: 0,
    overIndex: 0,
    foreignIndex: 0,
  })
  return compactReport({
    ranAt: now.toISOString(),
    trigger: typeof options.trigger === 'string' ? options.trigger : 'manual',
    stopped,
    totals,
    roots: entries.map((entry) => ({ ...entry })),
  })
}

export function dreamReportText(report) {
  if (!report) return '还没有运行过夜间做梦。'
  const totals = report.totals || {}
  const lines = []
  lines.push(`夜间做梦 · ${report.ranAt || ''}（${report.trigger || 'manual'}）`)
  lines.push(`工作区 ${totals.roots || 0} · 成功 ${totals.ok || 0} / 失败 ${totals.failed || 0}`)
  lines.push(`归并 ${totals.merged || 0} 条 · 退役 ${totals.expired || 0} 条 · 矛盾 ${totals.conflicts || 0} 组`)
  lines.push(`索引超限 ${totals.overIndex || 0} · 外部写入 ${totals.foreignIndex || 0} · 证据漂移 ${totals.missing || 0} · 过期条目 ${totals.expiredEntries || 0} · 逾期承诺 ${totals.overduePromises || 0}`)
  for (const root of report.roots || []) {
    const name = root.title || root.id || root.path
    if (!root.ok) {
      lines.push(`- 失败 ${name}: ${root.error || 'unknown error'}`)
      continue
    }
    const flags = []
    if (root.merged) flags.push(`归并 ${root.merged}`)
    if (root.expired) flags.push(`退役 ${root.expired}`)
    if (root.conflicts) flags.push(`矛盾 ${root.conflicts}`)
    if (root.missing) flags.push(`漂移 ${root.missing}`)
    if (root.over) flags.push('索引超限')
    if (root.foreign) flags.push('外部写入')
    lines.push(`- ${name}${flags.length ? ` · ${flags.join(' / ')}` : ' · 无需处理'}（索引 ${root.indexLines || 0} 行）`)
  }
  if (report.stopped) lines.push('（手动取消：剩余工作区本轮未处理）')
  if (report.truncated) lines.push(`… 另有 ${report.truncated} 个工作区未列出`)
  return lines.join('\n')
}

/** Panel/route payload: schedule, next run and the last bounded report. */
export function dreamStatus(settings, options = {}) {
  const normalized = normalizeDreamSettings(settings)
  const now = options.now instanceof Date ? options.now : new Date()
  return {
    enabled: normalized.enabled,
    intervalHours: normalized.intervalHours,
    lastRunAt: normalized.lastRunAt,
    nextAt: normalized.enabled ? nextDreamAt(normalized.lastRunAt, normalized.intervalHours, now) : null,
    running: options.running === true,
    lastReport: normalized.lastReport,
    reportText: dreamReportText(normalized.lastReport),
    limits: {
      minIntervalHours: DREAM_MIN_INTERVAL_HOURS,
      maxIntervalHours: DREAM_MAX_INTERVAL_HOURS,
      checkMs: DREAM_CHECK_MS,
    },
  }
}
