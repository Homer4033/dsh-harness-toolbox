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
/** A runaway cache directory must not turn one request into a scan of thousands. */
export const MAX_USAGE_FILES = 5000

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
    entries.push({
      createdAt,
      tokens,
      cwd: typeof identity.cwd === 'string' ? identity.cwd : '',
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
 */
export function buildUsageHeatmap(entries, { today = new Date(), weeks = HEATMAP_WEEKS } = {}) {
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

  let max = 0
  for (const bucket of perDay.values()) max = Math.max(max, bucket.tokens)

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
      days.push({
        date: key,
        tokens,
        sessions: bucket ? bucket.sessions : 0,
        level: levelOf(tokens, max),
        future: day.getTime() > today.getTime(),
      })
    }
    columns.push({ start: dayKey(start), days })
  }

  let totalTokens = 0
  let activeDays = 0
  let sessions = 0
  for (const column of columns) {
    for (const day of column.days) {
      totalTokens += day.tokens
      if (day.tokens > 0) activeDays += 1
      sessions += day.sessions
    }
  }

  const first = columns[0] ? columns[0].days[0].date : null
  const last = columns[columns.length - 1] ? columns[columns.length - 1].days[6].date : null
  return {
    weeks,
    firstDay: first,
    lastDay: last,
    totalTokens,
    maxDayTokens: max,
    activeDays,
    sessions,
    columns,
  }
}

/** Read the cache and fold it into the grid payload the client renders. */
export function usageHeatmap(home, options = {}) {
  return buildUsageHeatmap(readSessionUsage(home), options)
}
