/**
 * Agent memory for one project directory.
 *
 * The store lives inside the project so it is versioned, reviewable and
 * diffable: `<root>/memory/*.jsonl` are append-only records, `MEMORY.md` is an
 * index the plugin regenerates and never a hand-edited document. Nothing here
 * talks to a model: retrieval is deterministic term overlap, consolidation is
 * deterministic merging, so the whole module is unit-testable and a tool call
 * costs no tokens beyond its own arguments.
 *
 * The write path is gated, because every memory entry is a prediction that a
 * later session will rely on it (see the plugin contract): exact duplicates are
 * returned instead of stored, near-duplicates need `supersedes` or `force`,
 * contradicting rules need to supersede the old one, and anything whose source
 * is `external` is quarantined and can never become a rule.
 */

import { existsSync, mkdirSync, readFileSync, renameSync, statSync, writeFileSync, appendFileSync, rmSync } from 'node:fs'
import { basename, dirname, isAbsolute, join, relative, resolve } from 'node:path'
import { randomBytes } from 'node:crypto'

export const MEMORY_DIR = 'memory'
export const ENTRIES_FILE = 'entries.jsonl'
export const QUARANTINE_FILE = 'quarantine.jsonl'
export const INDEX_FILE = 'MEMORY.md'

/** The index is injected at session start; going over it silently truncates. */
export const MAX_INDEX_LINES = 200
export const MAX_INDEX_BYTES = 25_000
export const INDEX_MARKER = '<!-- compression-tiers:memory:index -->'

export const MEMORY_KINDS = ['rule', 'decision', 'fact', 'question', 'promise', 'episode', 'skill']
export const MEMORY_SOURCES = ['self', 'human', 'external']
export const MEMORY_CONFIDENCE = ['low', 'medium', 'high']
export const PROMISE_STATUS = ['open', 'done', 'dropped']

/** A rule or decision may only be written by the agent or by a human. */
const TRUSTED_KINDS = new Set(['rule', 'decision'])

const MAX_CLAIM = 400
const MAX_WHY = 800
const MAX_EVIDENCE = 8
const MAX_EVIDENCE_CHARS = 300
const MAX_RECORD_BYTES = 8_000
const MAX_ENTRIES = 5_000
/** Token-set Jaccard at or above this counts as the same memory. */
export const NEAR_DUPLICATE = 0.8
/** Claims shorter than this are never merged: "ok" is not a memory. */
const MIN_MERGE_CHARS = 12

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/
const INTERNAL_TYPES = new Set(['entry', 'tombstone'])

function memoryError(status, message) {
  const error = new Error(message)
  error.status = status
  return error
}

/** Absolute project root, or a 400. Directories are never created for a caller. */
export function memoryRoot(root) {
  const value = typeof root === 'string' ? root.trim() : ''
  if (!value || !isAbsolute(value)) throw memoryError(400, 'the memory store needs an absolute project directory')
  if (!existsSync(value)) throw memoryError(400, `project directory does not exist: ${value}`)
  return resolve(value)
}

export function memoryDir(root) {
  return join(memoryRoot(root), MEMORY_DIR)
}

function fileOf(root, name) {
  return join(memoryDir(root), name)
}

function readText(file) {
  try {
    return readFileSync(file, 'utf8').replace(/^\uFEFF/, '')
  } catch {
    return ''
  }
}

/** Records are JSON lines; a corrupt line is counted, never thrown away whole. */
function parseLines(text) {
  const records = []
  let bad = 0
  for (const line of text.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed) continue
    try {
      const record = JSON.parse(trimmed)
      if (!record || typeof record !== 'object' || !INTERNAL_TYPES.has(record.type)) {
        bad += 1
        continue
      }
      records.push(record)
    } catch {
      bad += 1
    }
  }
  return { records, bad }
}

function readRecords(root, name) {
  return parseLines(readText(fileOf(root, name)))
}

function appendRecord(root, name, record) {
  const body = JSON.stringify(record)
  if (Buffer.byteLength(body) > MAX_RECORD_BYTES) {
    throw memoryError(413, `memory record is larger than ${MAX_RECORD_BYTES} bytes`)
  }
  mkdirSync(memoryDir(root), { recursive: true })
  appendFileSync(fileOf(root, name), body + '\n', 'utf8')
  return record
}

function sleepSync(ms) {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms)
}

/**
 * Windows keeps the destination locked while an indexer or the antivirus scans
 * the fresh temp file, and `rename` then reports EPERM even though the name is
 * free. Retry with a short backoff, then fall back to an in-place write so a
 * scan can never turn one memory write into a hard failure.
 */
function atomicWrite(file, text) {
  mkdirSync(dirname(file), { recursive: true })
  const tmp = `${file}.tmp-${process.pid}-${Date.now().toString(36)}`
  writeFileSync(tmp, text, 'utf8')
  for (let attempt = 0; attempt < 6; attempt += 1) {
    try {
      renameSync(tmp, file)
      return
    } catch (error) {
      const code = error && error.code
      if (code !== 'EPERM' && code !== 'EBUSY' && code !== 'EACCES') break
      sleepSync(15 * (attempt + 1))
    }
  }
  writeFileSync(file, text, 'utf8')
  try {
    rmSync(tmp, { force: true })
  } catch {
    // A leftover temp file is harmless; the next rebuild overwrites the index.
  }
}

/**
 * Every entry, with tombstones applied. `active` is what index, search and the
 * counts use; `entries` keeps superseded rows so an audit can follow the chain.
 */
export function readMemory(root) {
  const entriesFile = readRecords(root, ENTRIES_FILE)
  const quarantineFile = readRecords(root, QUARANTINE_FILE)
  const entries = entriesFile.records.filter((record) => record.type === 'entry')
  const tombstones = entriesFile.records.filter((record) => record.type === 'tombstone')
  const byId = new Map()
  for (const entry of entries) byId.set(entry.id, entry)
  for (const tombstone of tombstones) {
    const entry = byId.get(tombstone.id)
    if (!entry) continue
    entry.invalid = true
    entry.supersededBy = tombstone.supersededBy || tombstone.by || null
    entry.invalidReason = tombstone.reason || 'superseded'
  }
  const active = entries.filter((entry) => entry.invalid !== true)
  return {
    root: memoryRoot(root),
    dir: memoryDir(root),
    entries,
    active,
    tombstones,
    badLines: entriesFile.bad + quarantineFile.bad,
    quarantine: quarantineFile.records.filter((record) => record.type === 'entry'),
  }
}

/** Normalized text for comparisons: NFKC, lowercase, punctuation dropped. */
export function normalizeText(value) {
  return String(value === undefined || value === null ? '' : value)
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[\s\p{P}\p{S}]+/gu, '')
}

function asciiTokens(text) {
  const words = String(text).match(/[a-z0-9][a-z0-9_-]*/g)
  return words ? words : []
}

/** CJK runs contribute character bigrams; ASCII contributes whole words. */
export function tokensOf(value) {
  const normalized = String(value === undefined || value === null ? '' : value)
    .normalize('NFKC')
    .toLowerCase()
  const out = new Set(asciiTokens(normalized))
  const runs = normalized.match(/[\u3400-\u9fff]+/g) || []
  for (const run of runs) {
    const chars = Array.from(run)
    if (chars.length === 1) out.add(chars[0])
    for (let i = 0; i < chars.length - 1; i += 1) out.add(chars[i] + chars[i + 1])
  }
  return out
}

/** Jaccard overlap of the two token sets, in [0, 1]. */
export function similarity(a, b) {
  const left = tokensOf(a)
  const right = tokensOf(b)
  if (left.size === 0 || right.size === 0) return 0
  let shared = 0
  for (const token of left) if (right.has(token)) shared += 1
  return shared / (left.size + right.size - shared)
}

const NEGATIONS = ['不要', '不得', '禁止', '别', '不能', '不可', '避免', 'never', 'not', 'avoid', "don't", 'dont', 'no']
/** Modal words are stripped before the body comparison, so "必须做 X" and "不要做 X" meet. */
const MODALS = ['必须', '务必', '一定要', '可能需要', '需要', 'must', 'should', 'always', '须']

function negationHits(normalized) {
  return NEGATIONS.filter((word) => normalized.includes(word))
}

function stripWords(body) {
  let rest = body
  for (const word of NEGATIONS.concat(MODALS)) rest = rest.split(word).join('')
  return rest
}

/** Overlap relative to the smaller side: a containment test, not Jaccard. */
function containment(a, b) {
  const left = tokensOf(a)
  const right = tokensOf(b)
  if (left.size === 0 || right.size === 0) return 0
  let shared = 0
  for (const token of left) if (right.has(token)) shared += 1
  return shared / Math.min(left.size, right.size)
}

/**
 * Two claims contradict when they say the same thing with the opposite
 * polarity ("必须用 X" vs "不要用 X"). Stripping the negation words before the
 * comparison is crude but deterministic, and it only ever asks the writer to
 * supersede — it never silently rewrites a rule.
 */
export function contradicting(a, b) {
  const left = normalizeText(a)
  const right = normalizeText(b)
  if (!left || !right || left === right) return false
  const leftHits = negationHits(left)
  const rightHits = negationHits(right)
  if (leftHits.length === rightHits.length) return false
  const leftBody = stripWords(left)
  const rightBody = stripWords(right)
  if (!leftBody || !rightBody) return false
  return leftBody === rightBody || containment(leftBody, rightBody) >= 0.85
}

function entryId(kind, taken) {
  const prefix = kind.slice(0, 4)
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const id = `${prefix}-${Date.now().toString(36)}-${randomBytes(2).toString('hex')}`
    if (!taken.has(id)) return id
  }
  return `${prefix}-${Date.now().toString(36)}-${randomBytes(3).toString('hex')}`
}

function asStringList(value) {
  if (value === undefined || value === null || value === '') return []
  const list = Array.isArray(value) ? value : [value]
  return list
    .filter((item) => typeof item === 'string')
    .map((item) => item.trim())
    .filter(Boolean)
}

export function normalizeScope(value) {
  const scope = String(value === undefined || value === null || value === '' ? 'project' : value).trim()
  if (scope === 'project' || scope === 'session') return scope
  const role = /^role:([a-z0-9][a-z0-9-]{0,31})$/.exec(scope)
  if (role) return `role:${role[1]}`
  throw memoryError(400, 'scope must be project, session or role:<name> (lowercase, 1-32 chars)')
}

/** Everything a write has to satisfy before it may touch the store. */
export function validateEntryInput(input) {
  const source = input && typeof input === 'object' ? input : {}
  const rawKind = String(source.kind || '').trim()
  if (!MEMORY_KINDS.includes(rawKind)) {
    throw memoryError(400, `kind must be one of ${MEMORY_KINDS.join(', ')}`)
  }
  const claim = typeof source.claim === 'string' ? source.claim.trim() : ''
  if (!claim) throw memoryError(400, 'claim is required: one sentence a later session can act on')
  if (claim.length > MAX_CLAIM) throw memoryError(400, `claim is longer than ${MAX_CLAIM} characters`)
  const why = typeof source.why === 'string' ? source.why.trim() : ''
  if (why.length > MAX_WHY) throw memoryError(400, `why is longer than ${MAX_WHY} characters`)
  const evidence = asStringList(source.evidence)
  if (evidence.length > MAX_EVIDENCE) throw memoryError(400, `evidence accepts at most ${MAX_EVIDENCE} items`)
  for (const item of evidence) {
    if (item.length > MAX_EVIDENCE_CHARS) throw memoryError(400, `an evidence item is longer than ${MAX_EVIDENCE_CHARS} characters`)
  }
  const scope = normalizeScope(source.scope)
  const origin = String(source.source || 'self').trim()
  if (!MEMORY_SOURCES.includes(origin)) throw memoryError(400, `source must be one of ${MEMORY_SOURCES.join(', ')}`)
  const confidence = String(source.confidence || 'medium').trim()
  if (!MEMORY_CONFIDENCE.includes(confidence)) throw memoryError(400, `confidence must be one of ${MEMORY_CONFIDENCE.join(', ')}`)
  const deadline = source.deadline === undefined || source.deadline === null || source.deadline === '' ? '' : String(source.deadline).trim()
  if (deadline && !DATE_RE.test(deadline)) throw memoryError(400, 'deadline must be YYYY-MM-DD')
  const expiresAt = source.expiresAt === undefined || source.expiresAt === null || source.expiresAt === '' ? '' : String(source.expiresAt).trim()
  if (expiresAt && !DATE_RE.test(expiresAt)) throw memoryError(400, 'expiresAt must be YYYY-MM-DD')
  const status = rawKind === 'promise' ? String(source.status || 'open').trim() : ''
  if (rawKind === 'promise' && !PROMISE_STATUS.includes(status)) {
    throw memoryError(400, `a promise needs status ${PROMISE_STATUS.join(' / ')}`)
  }
  if (TRUSTED_KINDS.has(rawKind) && origin === 'external') {
    throw memoryError(403, `an external source cannot write a ${rawKind}: record it as a fact or have a human promote it`)
  }
  return {
    kind: rawKind,
    claim,
    why,
    evidence,
    scope,
    source: origin,
    confidence,
    deadline,
    expiresAt,
    status,
    supersedes: asStringList(source.supersedes),
    force: source.force === true,
  }
}

function duplicateOf(active, claim) {
  const normalized = normalizeText(claim)
  if (!normalized) return null
  let best = null
  let bestScore = 0
  for (const entry of active) {
    if (normalizeText(entry.claim) === normalized) return { entry, exact: true, score: 1 }
    if (String(entry.claim).length < MIN_MERGE_CHARS) continue
    const score = similarity(entry.claim, claim)
    if (score > bestScore) {
      bestScore = score
      best = entry
    }
  }
  return bestScore >= NEAR_DUPLICATE ? { entry: best, exact: false, score: Number(bestScore.toFixed(3)) } : null
}

function contradictionOf(active, input) {
  if (!TRUSTED_KINDS.has(input.kind)) return null
  for (const entry of active) {
    if (!TRUSTED_KINDS.has(entry.kind)) continue
    if (contradicting(entry.claim, input.claim)) return entry
  }
  return null
}

/**
 * Store one memory. Returns `{status}` instead of throwing for the three gates
 * that are advice to the writer rather than errors: duplicate, near-duplicate
 * and conflict; only invalid input, an unknown supersedes target and a full
 * store throw.
 */
export function writeMemory(root, input, options = {}) {
  const projectRoot = memoryRoot(root)
  const now = options.now instanceof Date ? options.now : new Date()
  const normalized = validateEntryInput(input)
  const store = readMemory(projectRoot)
  if (store.active.length >= MAX_ENTRIES) {
    throw memoryError(409, `the memory store already holds ${MAX_ENTRIES} active entries; run dreaming before adding more`)
  }
  const taken = new Set(store.entries.map((entry) => entry.id))
  const supersedes = []
  for (const id of normalized.supersedes) {
    const previous = store.entries.find((entry) => entry.id === id)
    if (!previous) throw memoryError(404, `unknown supersedes target: ${id}`)
    supersedes.push(previous.id)
  }
  const duplicate = duplicateOf(store.active, normalized.claim)
  if (duplicate && duplicate.exact) {
    return { status: 'duplicate', entry: duplicate.entry, text: `memory already holds this claim (${duplicate.entry.id}); nothing written` }
  }
  if (duplicate && supersedes.length === 0 && normalized.force !== true) {
    return {
      status: 'near-duplicate',
      entry: duplicate.entry,
      score: duplicate.score,
      text: `near-duplicate of ${duplicate.entry.id} (overlap ${duplicate.score}); pass supersedes to replace it, or force to keep both`,
    }
  }
  if (TRUSTED_KINDS.has(normalized.kind) && supersedes.length === 0) {
    const conflict = contradictionOf(store.active, normalized)
    if (conflict) {
      return {
        status: 'conflict',
        entry: conflict,
        text: `contradicts ${conflict.id}: "${conflict.claim}"; pass supersedes: ['${conflict.id}'] to replace it`,
      }
    }
  }
  const record = {
    type: 'entry',
    id: entryId(normalized.kind, taken),
    at: now.toISOString(),
    kind: normalized.kind,
    scope: normalized.scope,
    claim: normalized.claim,
    why: normalized.why,
    evidence: normalized.evidence,
    source: normalized.source,
    confidence: normalized.confidence,
    deadline: normalized.deadline,
    expiresAt: normalized.expiresAt,
    status: normalized.status,
    session: typeof options.sessionId === 'string' ? options.sessionId : '',
    trust: normalized.source === 'external' ? 'untrusted' : 'trusted',
  }
  if (supersedes.length) record.supersedes = supersedes
  const target = record.trust === 'untrusted' ? QUARANTINE_FILE : ENTRIES_FILE
  appendRecord(projectRoot, target, record)
  if (supersedes.length) {
    for (const id of supersedes) {
      appendRecord(projectRoot, ENTRIES_FILE, {
        type: 'tombstone',
        id,
        by: record.id,
        at: record.at,
        reason: 'superseded',
      })
    }
  }
  const index = record.trust === 'untrusted' ? indexStatus(projectRoot) : rebuildIndex(projectRoot, { now })
  return {
    status: record.trust === 'untrusted' ? 'quarantined' : 'created',
    entry: record,
    index,
    text: record.trust === 'untrusted'
      ? `stored in quarantine as ${record.id}; external content never becomes a rule and is not indexed`
      : `stored ${record.id}${index && index.over ? ' (index is over budget: run memory_dream)' : ''}`,
  }
}

/** Mark one promise done or dropped without writing a second claim. */
export function settlePromise(root, id, status, options = {}) {
  const projectRoot = memoryRoot(root)
  if (!PROMISE_STATUS.includes(status) || status === 'open') {
    throw memoryError(400, `status must be done or dropped`)
  }
  const store = readMemory(projectRoot)
  const promise = store.entries.find((entry) => entry.id === id)
  if (!promise) throw memoryError(404, `unknown promise: ${id}`)
  if (promise.invalid === true) throw memoryError(404, `promise is already settled: ${id}`)
  if (promise.kind !== 'promise') throw memoryError(400, `${id} is a ${promise.kind}, not a promise`)
  const now = options.now instanceof Date ? options.now : new Date()
  appendRecord(projectRoot, ENTRIES_FILE, {
    type: 'tombstone',
    id: promise.id,
    at: now.toISOString(),
    reason: status,
    note: typeof options.note === 'string' ? options.note : '',
  })
  const replacement = {
    type: 'entry',
    id: entryId('promise', new Set(store.entries.map((entry) => entry.id))),
    at: now.toISOString(),
    kind: 'promise',
    scope: promise.scope,
    claim: promise.claim,
    why: promise.why || '',
    evidence: promise.evidence || [],
    source: promise.source || 'self',
    confidence: promise.confidence || 'medium',
    deadline: promise.deadline || '',
    expiresAt: promise.expiresAt || '',
    status,
    session: typeof options.sessionId === 'string' ? options.sessionId : '',
    trust: promise.trust || 'trusted',
    supersedes: [promise.id],
  }
  appendRecord(projectRoot, ENTRIES_FILE, replacement)
  const index = rebuildIndex(projectRoot, { now })
  return { status, entry: replacement, index }
}

function entryLine(entry) {
  const claim = String(entry.claim || '').replace(/\s+/g, ' ').trim()
  const short = claim.length > 110 ? `${claim.slice(0, 109)}…` : claim
  const bits = [`- [${entry.id}] ${short}`]
  if (entry.kind === 'promise' && entry.deadline) bits.push(` · 截止 ${entry.deadline}`)
  if (entry.kind === 'promise' && entry.status) bits.push(` · ${entry.status}`)
  if (entry.confidence === 'low') bits.push(' · 低置信')
  return bits.join('')
}

const INDEX_SECTIONS = [
  { title: '规则与不变量', kinds: ['rule'] },
  { title: '决策', kinds: ['decision'] },
  { title: '待决问题', kinds: ['question'] },
  { title: '承诺', kinds: ['promise'] },
  { title: '事实', kinds: ['fact'] },
  { title: '经验与方法', kinds: ['episode', 'skill'] },
]

function sortForIndex(entries) {
  const confidenceRank = { high: 0, medium: 1, low: 2 }
  return entries.slice().sort((a, b) => {
    const left = confidenceRank[a.confidence] === undefined ? 1 : confidenceRank[a.confidence]
    const right = confidenceRank[b.confidence] === undefined ? 1 : confidenceRank[b.confidence]
    if (left !== right) return left - right
    return String(b.at || '').localeCompare(String(a.at || ''))
  })
}

/** Today's local calendar date, the comparable form of a deadline. */
function today(now) {
  const date = now instanceof Date ? now : new Date()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${date.getFullYear()}-${month}-${day}`
}

export function promiseBuckets(active, now) {
  const current = today(now)
  const buckets = { open: [], overdue: [], done: [], dropped: [] }
  for (const entry of active) {
    if (entry.kind !== 'promise') continue
    if (entry.status === 'done') buckets.done.push(entry)
    else if (entry.status === 'dropped') buckets.dropped.push(entry)
    else if (entry.deadline && entry.deadline < current) buckets.overdue.push(entry)
    else buckets.open.push(entry)
  }
  return buckets
}

/**
 * Regenerate the injected index. The file is ours: a file without our marker is
 * treated as foreign, moved aside once and reported, so a hand-written
 * MEMORY.md is never silently overwritten.
 */
export function rebuildIndex(root, options = {}) {
  const projectRoot = memoryRoot(root)
  const now = options.now instanceof Date ? options.now : new Date()
  const store = readMemory(projectRoot)
  const trusted = store.active.filter((entry) => entry.trust !== 'untrusted')
  const buckets = promiseBuckets(trusted, now)
  const lines = []
  lines.push(INDEX_MARKER)
  lines.push(`# MEMORY · ${basename(projectRoot) || projectRoot}`)
  lines.push(`更新于 ${now.toISOString()} · ${trusted.length} 条记忆 · 承诺 未决 ${buckets.open.length} / 逾期 ${buckets.overdue.length} / 完成 ${buckets.done.length} / 放弃 ${buckets.dropped.length}`)
  lines.push('')
  let listed = 0
  let omitted = 0
  for (const section of INDEX_SECTIONS) {
    const rows = sortForIndex(trusted.filter((entry) => section.kinds.includes(entry.kind)))
    if (rows.length === 0) continue
    const header = `## ${section.title}`
    lines.push(header)
    for (const entry of rows) {
      const line = entryLine(entry)
      // 200 lines is the read limit; keep two lines of slack for the trailer.
      if (lines.length >= MAX_INDEX_LINES - 2) {
        omitted += 1
        continue
      }
      lines.push(line)
      listed += 1
    }
    lines.push('')
  }
  if (omitted > 0) lines.push(`… 另有 ${omitted} 条未列出（索引超限，运行 dreaming 归并）`)
  lines.push('<!-- 本文件由插件生成；手改会被下一次重建覆盖。条目在 memory/entries.jsonl。 -->')
  let text = `${lines.join('\n')}\n`
  let over = lines.length > MAX_INDEX_LINES || Buffer.byteLength(text) > MAX_INDEX_BYTES
  if (Buffer.byteLength(text) > MAX_INDEX_BYTES) {
    // Hard byte cap: drop from the tail until the file fits, and say so.
    const kept = []
    let size = 0
    for (const line of lines) {
      const cost = Buffer.byteLength(line) + 1
      if (size + cost > MAX_INDEX_BYTES) break
      kept.push(line)
      size += cost
    }
    kept.push(`… 索引超出 ${MAX_INDEX_BYTES} 字节上限，已截断；运行 dreaming 归并。`)
    text = `${kept.join('\n')}\n`
    over = true
  }
  const file = fileOf(projectRoot, INDEX_FILE)
  let foreign = null
  if (existsSync(file)) {
    const existing = readText(file)
    if (existing.trim() && !existing.startsWith(INDEX_MARKER)) {
      foreign = `${file}.foreign-${Date.now().toString(36)}`
      renameSync(file, foreign)
    }
  }
  atomicWrite(file, text)
  return {
    path: file,
    lines: text.split('\n').length - 1,
    bytes: Buffer.byteLength(text),
    listed,
    omitted,
    over,
    foreign,
    maxLines: MAX_INDEX_LINES,
    maxBytes: MAX_INDEX_BYTES,
  }
}

export function indexStatus(root) {
  const file = fileOf(root, INDEX_FILE)
  if (!existsSync(file)) {
    return { path: file, exists: false, lines: 0, bytes: 0, over: false, foreign: false }
  }
  const text = readText(file)
  const lines = text ? text.split('\n').length - 1 : 0
  const bytes = Buffer.byteLength(text)
  return {
    path: file,
    exists: true,
    lines,
    bytes,
    over: lines > MAX_INDEX_LINES || bytes > MAX_INDEX_BYTES,
    foreign: Boolean(text.trim()) && !text.startsWith(INDEX_MARKER),
    maxLines: MAX_INDEX_LINES,
    maxBytes: MAX_INDEX_BYTES,
  }
}

function evidenceDrift(projectRoot, active) {
  const missing = []
  for (const entry of active) {
    for (const item of entry.evidence || []) {
      const raw = String(item).trim()
      if (!raw || /^(https?:|commit:|session:|mailto:)/i.test(raw)) continue
      const path = raw.split('#')[0].split('@')[0].trim()
      if (!path) continue
      const absolute = isAbsolute(path) ? path : resolve(projectRoot, path)
      if (!existsSync(absolute)) missing.push({ id: entry.id, path: (relative(projectRoot, absolute) || path).replace(/\\/g, '/') })
    }
  }
  return missing
}

function expiredEntries(active, now) {
  const current = today(now)
  return active.filter((entry) => entry.expiresAt && entry.expiresAt < current)
}

function duplicateClusters(active) {
  const clusters = []
  const seen = new Set()
  for (const entry of active) {
    if (seen.has(entry.id)) continue
    const cluster = [entry]
    for (const other of active) {
      if (other.id === entry.id || seen.has(other.id)) continue
      if (similarity(entry.claim, other.claim) >= NEAR_DUPLICATE) cluster.push(other)
    }
    if (cluster.length > 1) {
      cluster.forEach((item) => seen.add(item.id))
      clusters.push(cluster)
    }
  }
  return clusters
}

function conflictPairs(active) {
  const trusted = active.filter((entry) => TRUSTED_KINDS.has(entry.kind))
  const pairs = []
  for (let i = 0; i < trusted.length; i += 1) {
    for (let j = i + 1; j < trusted.length; j += 1) {
      if (contradicting(trusted[i].claim, trusted[j].claim)) pairs.push([trusted[i], trusted[j]])
    }
  }
  return pairs
}

/** Read-only health report: promises, budget, drift, duplicates. */
export function reconcile(root, options = {}) {
  const projectRoot = memoryRoot(root)
  const now = options.now instanceof Date ? options.now : new Date()
  const store = readMemory(projectRoot)
  const trusted = store.active.filter((entry) => entry.trust !== 'untrusted')
  const buckets = promiseBuckets(trusted, now)
  const index = indexStatus(projectRoot)
  const drift = evidenceDrift(projectRoot, trusted)
  const expired = expiredEntries(trusted, now)
  const clusters = duplicateClusters(trusted)
  const conflicts = conflictPairs(trusted)
  const byKind = {}
  for (const entry of trusted) byKind[entry.kind] = (byKind[entry.kind] || 0) + 1
  return {
    root: projectRoot,
    dir: memoryDir(projectRoot),
    entries: trusted.length,
    byKind,
    promises: {
      open: buckets.open.map((entry) => ({ id: entry.id, claim: entry.claim, deadline: entry.deadline || '' })),
      overdue: buckets.overdue.map((entry) => ({ id: entry.id, claim: entry.claim, deadline: entry.deadline })),
      done: buckets.done.length,
      dropped: buckets.dropped.length,
    },
    index,
    drift: {
      missingEvidence: drift,
      expired: expired.map((entry) => ({ id: entry.id, claim: entry.claim, expiresAt: entry.expiresAt })),
    },
    duplicates: clusters.map((cluster) => cluster.map((entry) => ({ id: entry.id, claim: entry.claim }))),
    conflicts: conflicts.map((pair) => pair.map((entry) => ({ id: entry.id, claim: entry.claim }))),
    quarantine: store.quarantine.length,
    invalid: store.entries.length - store.active.length,
    badLines: store.badLines,
    limits: { maxEntries: MAX_ENTRIES, maxIndexLines: MAX_INDEX_LINES, maxIndexBytes: MAX_INDEX_BYTES },
  }
}

export function reconcileText(report) {
  const lines = []
  lines.push(`记忆对账 · ${report.dir}`)
  lines.push(`条目 ${report.entries} · 承诺 未决 ${report.promises.open.length} / 逾期 ${report.promises.overdue.length} / 完成 ${report.promises.done} / 放弃 ${report.promises.dropped}`)
  lines.push(`索引 ${report.index.exists ? `${report.index.lines} 行 / ${report.index.bytes} 字节` : '尚未生成'}${report.index.over ? `（超出 ${report.index.maxLines} 行 / ${report.index.maxBytes} 字节）` : ''}${report.index.foreign ? '（含非本插件写入的内容）' : ''}`)
  if (report.promises.overdue.length) {
    lines.push('逾期承诺：')
    for (const item of report.promises.overdue) lines.push(`- ${item.id} · ${item.claim} · 截止 ${item.deadline}`)
  }
  if (report.promises.open.length) {
    lines.push('未决承诺：')
    for (const item of report.promises.open) lines.push(`- ${item.id} · ${item.claim}${item.deadline ? ` · 截止 ${item.deadline}` : ''}`)
  }
  if (report.drift.missingEvidence.length) {
    lines.push('证据漂移（路径已不存在）：')
    for (const item of report.drift.missingEvidence) lines.push(`- ${item.id} → ${item.path}`)
  }
  if (report.drift.expired.length) {
    lines.push('已过期（expiresAt 已过）：')
    for (const item of report.drift.expired) lines.push(`- ${item.id} · ${item.claim}`)
  }
  if (report.conflicts.length) {
    lines.push('矛盾：')
    for (const pair of report.conflicts) lines.push(`- ${pair[0].id} ⟷ ${pair[1].id}：${pair[0].claim} / ${pair[1].claim}`)
  }
  if (report.duplicates.length) lines.push(`近重复簇 ${report.duplicates.length} 组（运行 memory_dream 归并）`)
  if (report.quarantine) lines.push(`隔离区 ${report.quarantine} 条（外部来源，不进入索引）`)
  if (report.badLines) lines.push(`损坏行 ${report.badLines} 条（已跳过）`)
  if (!report.promises.open.length && !report.promises.overdue.length && !report.drift.missingEvidence.length && !report.drift.expired.length && !report.conflicts.length && !report.duplicates.length) {
    lines.push('没有发现需要处理的项。')
  }
  return lines.filter(Boolean).join('\n')
}

/**
 * Consolidation. Without `apply` it only reports what it would do; with it,
 * duplicate clusters keep the newest claim, expired entries are superseded and
 * the index is rebuilt. No model is called, so the result is reproducible.
 */
export function dream(root, options = {}) {
  const projectRoot = memoryRoot(root)
  const now = options.now instanceof Date ? options.now : new Date()
  const apply = options.apply === true
  const store = readMemory(projectRoot)
  const trusted = store.active.filter((entry) => entry.trust !== 'untrusted')
  const clusters = duplicateClusters(trusted)
  const expired = expiredEntries(trusted, now)
  const conflicts = conflictPairs(trusted)
  const superseded = []
  if (apply) {
    for (const cluster of clusters) {
      const ordered = sortForIndex(cluster)
      const keep = ordered[0]
      for (const entry of ordered.slice(1)) {
        appendRecord(projectRoot, ENTRIES_FILE, {
          type: 'tombstone',
          id: entry.id,
          by: keep.id,
          at: now.toISOString(),
          reason: 'duplicate',
        })
        superseded.push(entry.id)
      }
    }
    for (const entry of expired) {
      appendRecord(projectRoot, ENTRIES_FILE, {
        type: 'tombstone',
        id: entry.id,
        at: now.toISOString(),
        reason: 'expired',
      })
      superseded.push(entry.id)
    }
  }
  const index = apply ? rebuildIndex(projectRoot, { now }) : indexStatus(projectRoot)
  return {
    applied: apply,
    merged: clusters.reduce((total, cluster) => total + cluster.length - 1, 0),
    expired: expired.length,
    conflicts: conflicts.length,
    superseded,
    index,
    text: [
      apply ? '整理完成' : '整理预览（未写入；传 apply: true 执行）',
      `近重复 ${clusters.length} 组 → 归并 ${clusters.reduce((total, cluster) => total + cluster.length - 1, 0)} 条`,
      `过期 ${expired.length} 条`,
      `矛盾 ${conflicts.length} 组${conflicts.length ? '（需要人来裁决，做梦不会自动改写规则）' : ''}`,
      `索引 ${index.exists === false ? '尚未生成' : `${index.lines} 行 / ${index.bytes} 字节`}${index.over ? '（超限）' : ''}`,
    ].join('\n'),
  }
}

function matchStats(entry, queryTokens, normalizedQuery) {
  const text = `${entry.claim} ${entry.why || ''} ${(entry.evidence || []).join(' ')}`
  const hit = tokensOf(text)
  let overlap = 0
  for (const token of queryTokens) if (hit.has(token)) overlap += 1
  const phrase = normalizedQuery && normalizeText(entry.claim).includes(normalizedQuery) ? 1 : 0
  return { overlap, phrase }
}

/** A hit must share a term or contain the query phrase; recency is not relevance. */
function entryMatches(entry, queryTokens, normalizedQuery) {
  const stats = matchStats(entry, queryTokens, normalizedQuery)
  return stats.phrase === 1 || stats.overlap > 0
}

function scoreEntry(entry, queryTokens, normalizedQuery, now) {
  const { overlap, phrase } = matchStats(entry, queryTokens, normalizedQuery)
  const ratio = queryTokens.size === 0 ? 0 : overlap / queryTokens.size
  const ageDays = Math.max(0, (now.getTime() - new Date(entry.at || now).getTime()) / 86_400_000)
  const recency = Math.exp(-ageDays / 180)
  const confidence = entry.confidence === 'high' ? 0.3 : entry.confidence === 'low' ? 0 : 0.15
  return Number((phrase * 3 + ratio * 2 + recency + confidence).toFixed(4))
}

/** Deterministic hybrid search: phrase, term overlap, recency, confidence. */
export function searchMemory(root, query, options = {}) {
  const projectRoot = memoryRoot(root)
  const text = typeof query === 'string' ? query.trim() : ''
  if (!text) throw memoryError(400, 'query is required')
  const now = options.now instanceof Date ? options.now : new Date()
  const limit = Math.min(Math.max(Number(options.limit) || 8, 1), 50)
  const store = readMemory(projectRoot)
  const pool = options.untrusted === true
    ? store.active.concat(store.quarantine)
    : store.active.filter((entry) => entry.trust !== 'untrusted')
  const queryTokens = tokensOf(text)
  const normalizedQuery = normalizeText(text)
  const kind = typeof options.kind === 'string' && options.kind ? options.kind : ''
  const scope = typeof options.scope === 'string' && options.scope ? options.scope : ''
  const rows = []
  for (const entry of pool) {
    if (kind && entry.kind !== kind) continue
    if (scope && entry.scope !== scope) continue
    const scored = scoreEntry(entry, queryTokens, normalizedQuery, now)
    // Recency and confidence alone must not make an unrelated memory a hit.
    if (!entryMatches(entry, queryTokens, normalizedQuery)) continue
    rows.push({ entry, score: scored })
  }
  rows.sort((a, b) => (b.score - a.score) || String(b.entry.at || '').localeCompare(String(a.entry.at || '')))
  return rows.slice(0, limit)
}

export function searchText(rows, query) {
  if (!rows.length) return `没有命中「${query}」的记忆。`
  return rows.map((row) => {
    const entry = row.entry
    const bits = [`[${entry.id}] ${entry.kind}${entry.scope !== 'project' ? ` · ${entry.scope}` : ''} · ${row.score}`]
    bits.push(entry.claim)
    if (entry.why) bits.push(`为什么：${entry.why}`)
    if (entry.evidence && entry.evidence.length) bits.push(`证据：${entry.evidence.join(' · ')}`)
    if (entry.kind === 'promise') bits.push(`承诺：${entry.status}${entry.deadline ? ` · 截止 ${entry.deadline}` : ''}`)
    return bits.join('\n')
  }).join('\n\n')
}

/** Panel payload for one project root; never throws for a missing store. */
export function memoryStatus(root, options = {}) {
  const projectRoot = memoryRoot(root)
  const report = reconcile(projectRoot, options)
  const store = readMemory(projectRoot)
  const trusted = store.active.filter((entry) => entry.trust !== 'untrusted')
  const recent = sortForIndex(trusted).slice(0, 6).map((entry) => ({
    id: entry.id,
    kind: entry.kind,
    claim: entry.claim,
    at: entry.at,
  }))
  return {
    ...report,
    exists: existsSync(memoryDir(projectRoot)),
    entriesFile: fileOf(projectRoot, ENTRIES_FILE),
    quarantineFile: fileOf(projectRoot, QUARANTINE_FILE),
    recent,
    questions: trusted.filter((entry) => entry.kind === 'question').map((entry) => ({ id: entry.id, claim: entry.claim })),
    generatedAt: new Date().toISOString(),
  }
}
