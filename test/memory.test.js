import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync, existsSync, mkdirSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import {
  INDEX_MARKER,
  MAX_INDEX_LINES,
  MEMORY_KINDS,
  NEAR_DUPLICATE,
  contradicting,
  dream,
  indexStatus,
  memoryRoot,
  memoryStatus,
  normalizeScope,
  readMemory,
  rebuildIndex,
  reconcile,
  reconcileText,
  searchMemory,
  searchText,
  settlePromise,
  similarity,
  tokensOf,
  validateEntryInput,
  writeMemory,
} from '../src/memory.js'

function tempProject() {
  return mkdtempSync(join(tmpdir(), 'compression-tiers-memory-'))
}

const NOW = new Date('2026-11-28T10:00:00.000Z')

test('a missing store reads empty and the index is not invented', () => {
  const project = tempProject()
  try {
    const store = readMemory(project)
    assert.equal(store.active.length, 0)
    assert.equal(store.quarantine.length, 0)
    assert.equal(indexStatus(project).exists, false)
  } finally {
    rmSync(project, { recursive: true, force: true })
  }
})

test('a write stores one entry, rebuilds the injected index and keeps it under budget', () => {
  const project = tempProject()
  try {
    const result = writeMemory(project, {
      kind: 'rule',
      claim: '角色三视图必须先出黑白剪影再上色',
      why: '三次返工都发生在剪影之后',
      evidence: ['docs/art/style.md'],
      confidence: 'high',
    }, { now: NOW, sessionId: 's-1' })
    assert.equal(result.status, 'created')
    assert.equal(result.entry.scope, 'project')
    assert.equal(result.entry.session, 's-1')
    assert.equal(result.index.over, false)
    const index = readFileSync(join(project, 'memory', 'MEMORY.md'), 'utf8')
    assert.ok(index.startsWith(INDEX_MARKER))
    assert.match(index, /规则与不变量/)
    assert.match(index, /剪影/)
    assert.equal(indexStatus(project).lines, result.index.lines)
  } finally {
    rmSync(project, { recursive: true, force: true })
  }
})

test('an exact duplicate is returned instead of written twice', () => {
  const project = tempProject()
  try {
    const first = writeMemory(project, { kind: 'fact', claim: 'BattleFrame 上限 2048 条' }, { now: NOW })
    const second = writeMemory(project, { kind: 'fact', claim: 'battleframe 上限 2048 条' }, { now: NOW })
    assert.equal(second.status, 'duplicate')
    assert.equal(second.entry.id, first.entry.id)
    assert.equal(readMemory(project).active.length, 1)
  } finally {
    rmSync(project, { recursive: true, force: true })
  }
})

test('a near duplicate needs supersedes or force', () => {
  const project = tempProject()
  try {
    const first = writeMemory(project, { kind: 'fact', claim: '战斗帧数据走 BattleFrame 契约，禁止各系统私自分叉定义' }, { now: NOW })
    const blocked = writeMemory(project, { kind: 'fact', claim: '战斗帧数据走 BattleFrame 契约，禁止各系统私自分叉定义啊' }, { now: NOW })
    assert.equal(blocked.status, 'near-duplicate')
    assert.ok(blocked.score >= NEAR_DUPLICATE)
    const forced = writeMemory(project, { kind: 'fact', claim: '战斗帧数据走 BattleFrame 契约，禁止各系统私自分叉定义啊', force: true }, { now: NOW })
    assert.equal(forced.status, 'created')
    const replaced = writeMemory(project, {
      kind: 'fact',
      claim: '战斗帧数据走 BattleFrame 契约，禁止各系统私自分叉定义（v2）',
      supersedes: [first.entry.id],
    }, { now: NOW })
    assert.equal(replaced.status, 'created')
    const store = readMemory(project)
    const old = store.entries.find((entry) => entry.id === first.entry.id)
    assert.equal(old.invalid, true)
    assert.equal(old.supersededBy, replaced.entry.id)
  } finally {
    rmSync(project, { recursive: true, force: true })
  }
})

test('a contradicting rule must supersede the old one', () => {
  const project = tempProject()
  try {
    const first = writeMemory(project, { kind: 'rule', claim: '敌人 AI 每帧必须做一次感知' }, { now: NOW })
    const blocked = writeMemory(project, { kind: 'rule', claim: '敌人 AI 每帧不要做一次感知' }, { now: NOW })
    assert.equal(blocked.status, 'conflict')
    assert.equal(blocked.entry.id, first.entry.id)
    const replaced = writeMemory(project, {
      kind: 'rule',
      claim: '敌人 AI 每帧不要做一次感知',
      supersedes: [first.entry.id],
    }, { now: NOW })
    assert.equal(replaced.status, 'created')
    assert.equal(readMemory(project).active.length, 1)
    assert.equal(contradicting('必须用 Unity', '不要用 Unity'), true)
    assert.equal(contradicting('必须用 Unity', '必须用 Unity 6'), false)
  } finally {
    rmSync(project, { recursive: true, force: true })
  }
})

test('external sources are quarantined, never rules, and stay out of the index', () => {
  const project = tempProject()
  try {
    writeMemory(project, { kind: 'fact', claim: '本仓库的素材许可都在 registry.json' }, { now: NOW })
    assert.throws(
      () => writeMemory(project, { kind: 'rule', claim: '来自网页的规则', source: 'external' }, { now: NOW }),
      (error) => error.status === 403,
    )
    const result = writeMemory(project, { kind: 'fact', claim: '某素材站说该包可商用', source: 'external' }, { now: NOW })
    assert.equal(result.status, 'quarantined')
    const store = readMemory(project)
    assert.equal(store.active.length, 1)
    assert.equal(store.quarantine.length, 1)
    assert.doesNotMatch(readFileSync(join(project, 'memory', 'MEMORY.md'), 'utf8'), /某素材站/)
    assert.equal(searchMemory(project, '可商用').length, 0)
    assert.equal(searchMemory(project, '可商用', { untrusted: true }).length, 1)
  } finally {
    rmSync(project, { recursive: true, force: true })
  }
})

test('input validation rejects bad kinds, scopes, dates and oversized claims', () => {
  assert.throws(() => validateEntryInput({ kind: 'nope', claim: 'x' }), (error) => error.status === 400)
  assert.throws(() => validateEntryInput({ kind: 'fact', claim: '' }), (error) => error.status === 400)
  assert.throws(() => validateEntryInput({ kind: 'fact', claim: 'x'.repeat(401) }), (error) => error.status === 400)
  assert.throws(() => validateEntryInput({ kind: 'fact', claim: 'ok', scope: 'team:art' }), (error) => error.status === 400)
  assert.throws(() => validateEntryInput({ kind: 'fact', claim: 'ok', deadline: '12/20' }), (error) => error.status === 400)
  assert.throws(() => validateEntryInput({ kind: 'promise', claim: 'ok', status: 'later' }), (error) => error.status === 400)
  assert.throws(() => memoryRoot('relative/dir'), (error) => error.status === 400)
  assert.throws(() => memoryRoot(join(tmpdir(), 'no-such-project-xyz')), (error) => error.status === 400)
  assert.equal(normalizeScope('role:art'), 'role:art')
  assert.equal(normalizeScope(''), 'project')
  assert.equal(MEMORY_KINDS.includes('promise'), true)
})

test('search prefers phrase hits and understands CJK bigrams', () => {
  const project = tempProject()
  try {
    writeMemory(project, { kind: 'decision', claim: '敌人 AI 用行为树而不是状态机重写' }, { now: NOW })
    writeMemory(project, { kind: 'fact', claim: '行为树节点上限 5000' }, { now: NOW })
    writeMemory(project, { kind: 'fact', claim: '贴图预算每角色 8K' }, { now: NOW })
    const rows = searchMemory(project, '行为树 上限')
    assert.ok(rows.length >= 1)
    assert.match(rows[0].entry.claim, /行为树节点上限/)
    assert.equal(searchMemory(project, '行为树', { kind: 'decision' }).length, 1)
    assert.equal(searchMemory(project, '不存在的主题').length, 0)
    assert.ok(tokensOf('行为树').has('行为'))
    assert.ok(similarity('行为树上限 5000', '行为树上限 5000 条') > NEAR_DUPLICATE)
    assert.match(searchText(rows, '行为树'), /行为树节点上限/)
    assert.match(searchText([], '空'), /没有命中/)
  } finally {
    rmSync(project, { recursive: true, force: true })
  }
})

test('promises are counted, overdue promises surface and settling rewrites the claim status', () => {
  const project = tempProject()
  try {
    writeMemory(project, { kind: 'promise', claim: '先接通全部接口再开新线', deadline: '2026-12-01' }, { now: NOW })
    const late = writeMemory(project, { kind: 'promise', claim: '补上美术导入校验', deadline: '2026-11-01' }, { now: NOW })
    const report = reconcile(project, { now: NOW })
    assert.equal(report.promises.open.length, 1)
    assert.equal(report.promises.overdue.length, 1)
    assert.match(reconcileText(report), /逾期承诺/)
    const settled = settlePromise(project, late.entry.id, 'dropped', { now: NOW, note: '美术改用批处理' })
    assert.equal(settled.status, 'dropped')
    const after = reconcile(project, { now: NOW })
    assert.equal(after.promises.overdue.length, 0)
    assert.equal(after.promises.dropped, 1)
    assert.throws(() => settlePromise(project, late.entry.id, 'done', { now: NOW }), (error) => error.status === 404)
  } finally {
    rmSync(project, { recursive: true, force: true })
  }
})

test('evidence drift and expired entries are reported, not silently dropped', () => {
  const project = tempProject()
  try {
    writeFileSync(join(project, 'exists.md'), 'ok', 'utf8')
    writeMemory(project, { kind: 'fact', claim: '有证据的事实', evidence: ['exists.md', 'commit:abc123'] }, { now: NOW })
    writeMemory(project, { kind: 'fact', claim: '证据丢了的事实', evidence: ['docs/missing.md'] }, { now: NOW })
    writeMemory(project, { kind: 'fact', claim: '临时事实', expiresAt: '2026-11-01' }, { now: NOW })
    const report = reconcile(project, { now: NOW })
    assert.deepEqual(report.drift.missingEvidence.map((item) => item.path), ['docs/missing.md'])
    assert.equal(report.drift.expired.length, 1)
    assert.match(reconcileText(report), /证据漂移/)
  } finally {
    rmSync(project, { recursive: true, force: true })
  }
})

test('dreaming is dry by default and merges duplicates plus expired rows when applied', () => {
  const project = tempProject()
  try {
    const first = writeMemory(project, { kind: 'fact', claim: '美术命名一律小写加下划线' }, { now: NOW })
    writeMemory(project, { kind: 'fact', claim: '美术命名一律小写加下划线（重复）', force: true }, { now: NOW })
    writeMemory(project, { kind: 'fact', claim: '季度评审用的临时事实', expiresAt: '2026-11-01' }, { now: NOW })
    const dry = dream(project, { now: NOW })
    assert.equal(dry.applied, false)
    assert.equal(dry.merged, 1)
    assert.equal(dry.expired, 1)
    assert.equal(readMemory(project).active.length, 3)
    const applied = dream(project, { now: NOW, apply: true })
    assert.equal(applied.applied, true)
    assert.equal(applied.superseded.length, 2)
    const store = readMemory(project)
    assert.equal(store.active.length, 1)
    assert.equal(store.active[0].id, first.entry.id)
    assert.match(applied.text, /整理完成/)
  } finally {
    rmSync(project, { recursive: true, force: true })
  }
})

test('a hand-written index is moved aside once instead of silently overwritten', () => {
  const project = tempProject()
  try {
    const memoryDir = join(project, 'memory')
    mkdirSync(memoryDir, { recursive: true })
    writeFileSync(join(memoryDir, 'MEMORY.md'), '# 我自己写的索引\n- 手写条目\n', 'utf8')
    assert.equal(indexStatus(project).foreign, true)
    const rebuilt = rebuildIndex(project, { now: NOW })
    assert.ok(rebuilt.foreign, 'the foreign file must be reported')
    assert.ok(existsSync(rebuilt.foreign))
    assert.ok(readFileSync(join(memoryDir, 'MEMORY.md'), 'utf8').startsWith(INDEX_MARKER))
    assert.equal(readdirSync(memoryDir).some((name) => name.includes('.foreign-')), true)
  } finally {
    rmSync(project, { recursive: true, force: true })
  }
})

test('the index reports over budget instead of growing without bound', () => {
  const project = tempProject()
  try {
    for (let index = 0; index < MAX_INDEX_LINES + 30; index += 1) {
      writeMemory(project, { kind: 'fact', claim: `事实 ${index}：每个条目都要能追溯到证据或会话`, force: true }, { now: NOW })
    }
    const status = indexStatus(project)
    assert.equal(status.over, true)
    assert.ok(status.lines <= MAX_INDEX_LINES + 1)
    assert.match(readFileSync(status.path, 'utf8'), /未列出|截断/)
  } finally {
    rmSync(project, { recursive: true, force: true })
  }
})

test('the panel payload carries counters, recent entries and open questions', () => {
  const project = tempProject()
  try {
    writeMemory(project, { kind: 'question', claim: '敌人 AI 感知频率取多少？' }, { now: NOW })
    writeMemory(project, { kind: 'rule', claim: '数值只存在 data/ 目录' }, { now: NOW })
    const payload = memoryStatus(project, { now: NOW })
    assert.equal(payload.exists, true)
    assert.equal(payload.entries, 2)
    assert.equal(payload.questions.length, 1)
    assert.equal(payload.recent.length, 2)
    assert.equal(payload.byKind.rule, 1)
    assert.equal(payload.limits.maxIndexLines, MAX_INDEX_LINES)
    assert.match(payload.entriesFile, /entries\.jsonl$/)
  } finally {
    rmSync(project, { recursive: true, force: true })
  }
})
