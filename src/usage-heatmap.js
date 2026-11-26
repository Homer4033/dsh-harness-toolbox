import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

/**
 * Local token heatmap. Obsidian Prism paints an "active trail" grid on its home
 * board (26 columns of 7 days, five intensity steps); DSH has no such board, so
 * this module feeds the same idea from data the host already keeps on disk.
 *
 * Source: the official session projection cache, one JSON per session, which
 * carries `record.identity.createdAt` and `record.rows.tokenUsage.val.totals`
 * (uncached input / output / cache read / cache write). It is read-only — this
 * plugin never writes it — and a session only counts when both fields are
 * present, so a half-written cache entry cannot invent usage.
 *
 * Counting rule: a session's whole token total lands on the local day it was
 * created. The cache has no per-turn timestamps, so a session that spans
 * midnight is attributed to its start day; the panel says so instead of
 * pretending to a precision the data does not have.
 */

/** Projection cache below the DSH home, one JSON file per session. */
export const USAGE_CACHE_DIR = ['storages', 'session_projcache', 'sessions']
/** Columns of the grid: half a year of weeks, like the upstream board. */
export const HEATMAP_WEEKS = 26
/** Range tabs on the card, mirroring the upstream "7天 / 30天 / 全部" control. */
export const USAGE_RANGES = { '7d': 7, '30d': 30, all: 0 }
/** A runaway cache directory must not turn one request into a scan of thousands. */
export const MAX_USAGE_FILES = 5000

/** Unknown or missing range values fall back to the full board rather than 500. */
export function normalizeUsageRange(value) {
  return Object.prototype.hasOwnProperty.call(USAGE_RANGES, value) ? value : 'all'
}

export function usageCacheDir(home) {
  return join(home, ...USAGE_CACHE_DIR)
}

/** `YYYY-MM-DD` in local time — the cache timestamps are offsets, the grid is local. */
export function dayKey(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function localMidnight(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

/** Monday of the week the date falls in; the grid's columns are weeks. */
function mondayOf(date) {
  const monday = localMidnight(date)
  monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7))
  return monday
}

/**
 * One session's total from its projection cache record, or null when the record
 * has no usage row yet (a brand new session writes one only after its first
 * measurement).
 */
export function sessionTokens(record) {
  const rows = record && record.rows
  const value = rows && rows.tokenUsage && rows.tokenUsage.val
  const totals = value && value.totals
  if (!totals || typeof totals !== 'object') return null
  const fields = ['uncachedInputTokens', 'outputTokens', 'cacheReadTokens', 'cacheWriteTokens']
  let total = 0
  for (const field of fields) {
    const number = Number(totals[field])
    if (Number.isFinite(number) && number > 0) total += number
  }
  return total
}

/** Every readable session entry in the cache; bad files are skipped, never fatal. */
/**
 * The model a session ran on, from its own `modelSelection` row. A session can
 * switch models mid-flight and the cache only keeps the last choice, so the
 * whole session's tokens are attributed to that last model — the card says so.
 */
export function sessionModel(record) {
  const rows = record && record.rows
  const value = rows && rows.modelSelection && rows.modelSelection.val
  const last = value && value.lastUsed
  if (!last || typeof last !== 'object') return null
  const provider = typeof last.provider === 'string' ? last.provider : ''
  const model = typeof last.model === 'string' ? last.model : ''
  if (!provider && !model) return null
  return { provider, model }
}

export function readSessionUsage(home) {
  const dir = usageCacheDir(home)
  if (!existsSync(dir)) return []
  let names
  try {
    names = readdirSync(dir).filter((name) => name.endsWith('.json')).slice(0, MAX_USAGE_FILES)
  } catch {
    return []
  }
  const entries = []
  for (const name of names) {
    let parsed
    try {
      parsed = JSON.parse(readFileSync(join(dir, name), 'utf8'))
    } catch {
      continue
    }
    const record = parsed && parsed.record
    const identity = record && record.identity
    const createdAt = identity && identity.createdAt
    const tokens = sessionTokens(record)
    if (!Number.isFinite(createdAt) || tokens === null) continue
    const model = sessionModel(record)
    entries.push({
      createdAt,
      tokens,
      cwd: typeof identity.cwd === 'string' ? identity.cwd : '',
      provider: model ? model.provider : '',
      model: model ? model.model : '',
    })
  }
  return entries
}

/**
 * Five intensity steps on a log curve: a 1.5B day must not make every other day
 * invisible, and the busiest day always reaches the darkest step.
 */
export function levelOf(tokens, max) {
  if (!(tokens > 0)) return 0
  if (!(max > 0)) return 0
  const scaled = Math.floor((4 * Math.log1p(tokens)) / Math.log1p(max)) + 1
  return Math.min(5, Math.max(1, scaled))
}

/**
 * Grid payload for the client: `columns[w].days[d]`, oldest week first, Monday
 * at the top. Days after today are flagged so the client can leave them blank
 * rather than paint a misleading empty day.
 *
 * `range` mirrors the upstream card's 7天 / 30天 / 全部 tabs: the grid keeps all
 * 26 weeks, but only days inside the window stay lit, and the intensity steps
 * are computed against the window's own peak so a quiet week still reads.
 */
export function buildUsageHeatmap(entries, { today = new Date(), weeks = HEATMAP_WEEKS, range = 'all' } = {}) {
  const selected = normalizeUsageRange(range)
  const rangeDays = USAGE_RANGES[selected]
  const cutoff = rangeDays > 0 ? localMidnight(today) : null
  if (cutoff) cutoff.setDate(cutoff.getDate() - (rangeDays - 1))

  const perDay = new Map()
  for (const entry of Array.isArray(entries) ? entries : []) {
    if (!entry || !Number.isFinite(entry.createdAt)) continue
    const key = dayKey(new Date(entry.createdAt))
    const bucket = perDay.get(key) || { tokens: 0, sessions: 0 }
    const tokens = Number(entry.tokens)
    bucket.tokens += Number.isFinite(tokens) && tokens > 0 ? tokens : 0
    bucket.sessions += 1
    perDay.set(key, bucket)
  }

  const inWindow = (day) => {
    if (!cutoff) return true
    return day.getTime() >= cutoff.getTime()
  }

  const columns = []
  const lastMonday = mondayOf(today)
  const firstMonday = new Date(lastMonday)
  firstMonday.setDate(firstMonday.getDate() - (weeks - 1) * 7)

  for (let week = 0; week < weeks; week += 1) {
    const start = new Date(firstMonday)
    start.setDate(start.getDate() + week * 7)
    const days = []
    for (let offset = 0; offset < 7; offset += 1) {
      const day = new Date(start)
      day.setDate(day.getDate() + offset)
      const key = dayKey(day)
      const bucket = perDay.get(key)
      const tokens = bucket ? bucket.tokens : 0
      const future = day.getTime() > today.getTime()
      days.push({
        date: key,
        tokens,
        sessions: bucket ? bucket.sessions : 0,
        level: 0,
        future,
        active: !future && inWindow(day),
      })
    }
    columns.push({ start: dayKey(start), days })
  }

  let max = 0
  let totalTokens = 0
  let activeDays = 0
  let sessions = 0
  let peakDay = null
  for (const column of columns) {
    for (const day of column.days) {
      if (!day.active) continue
      if (day.tokens > 0) activeDays += 1
      totalTokens += day.tokens
      sessions += day.sessions
      if (day.tokens > max) {
        max = day.tokens
        peakDay = day.date
      }
    }
  }
  for (const column of columns) {
    for (const day of column.days) {
      day.level = day.active ? levelOf(day.tokens, max) : 0
    }
  }

  // "连续活跃 N 天" under the card: walk back from the newest day that actually
  // carries tokens (today may still be empty) while days stay active. No data
  // means 0, never a guess.
  let streak = 0
  const flat = columns.flatMap((column) => column.days).filter((day) => day.active)
  let cursor = flat.length - 1
  while (cursor >= 0 && flat[cursor].tokens <= 0) cursor -= 1
  for (; cursor >= 0; cursor -= 1) {
    if (flat[cursor].tokens <= 0) break
    streak += 1
  }

  // Right column of the card, mirroring upstream's quota pools: which models
  // wrote those tokens. The cache keeps only each session's last model, so the
  // whole session lands under that one — the card labels the split as such.
  const gridStart = firstMonday.getTime()
  const gridEnd = localMidnight(today).getTime() + 24 * 60 * 60 * 1000 - 1
  const modelBuckets = new Map()
  for (const entry of Array.isArray(entries) ? entries : []) {
    if (!entry || !Number.isFinite(entry.createdAt)) continue
    const created = entry.createdAt
    if (created < gridStart || created > gridEnd) continue
    if (cutoff && created < cutoff.getTime()) continue
    const provider = typeof entry.provider === 'string' ? entry.provider : ''
    const model = typeof entry.model === 'string' ? entry.model : ''
    const key = provider + '|' + model
    const bucket = modelBuckets.get(key) || { provider, model, tokens: 0, sessions: 0 }
    const tokens = Number(entry.tokens)
    bucket.tokens += Number.isFinite(tokens) && tokens > 0 ? tokens : 0
    bucket.sessions += 1
    modelBuckets.set(key, bucket)
  }
  const models = [...modelBuckets.values()]
    .filter((bucket) => bucket.tokens > 0)
    .sort((left, right) => right.tokens - left.tokens)
    .slice(0, 6)
    .map((bucket) => ({
      id: bucket.provider + '/' + bucket.model,
      provider: bucket.provider,
      model: bucket.model,
      tokens: bucket.tokens,
      sessions: bucket.sessions,
      share: totalTokens > 0 ? bucket.tokens / totalTokens : 0,
    }))

  const first = columns[0] ? columns[0].days[0].date : null
  const last = columns[columns.length - 1] ? columns[columns.length - 1].days[6].date : null
  return {
    weeks,
    range: selected,
    firstDay: first,
    lastDay: last,
    totalTokens,
    maxDayTokens: max,
    activeDays,
    sessions,
    streak,
    models,
    peakDay,
    columns,
  }
}

/** Read the cache and fold it into the grid payload the client renders. */
export function usageHeatmap(home, options = {}) {
  return buildUsageHeatmap(readSessionUsage(home), options)
}
