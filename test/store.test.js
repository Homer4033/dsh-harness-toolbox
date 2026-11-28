import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { normalizeRepoName, normalizeSessionRepos, readSettings, settingsPaths, writeJson, writeSettings, writeText } from '../src/store.js'

function tempHome() {
  return mkdtempSync(join(tmpdir(), 'compression-tiers-'))
}

test('a missing settings file reports exists=false and the default tier', () => {
  const home = tempHome()
  try {
    const state = readSettings(home)
    assert.equal(state.exists, false)
    assert.equal(state.settings.level, 'standard')
    assert.deepEqual(state.settings.modelRoutes, [])
    assert.equal(state.paths.settings, join(home, 'compression-tiers', 'settings.json'))
  } finally {
    rmSync(home, { recursive: true, force: true })
  }
})

test('writes are normalized, persisted and read back', () => {
  const home = tempHome()
  try {
    const saved = writeSettings(home, {
      settings: {
        level: 'aggressive',
        modelRoutes: [{ provider: 'p', model: 'm', headroomTokens: 8192 }],
      },
    })
    assert.equal(saved.exists, true)
    assert.equal(saved.settings.level, 'aggressive')
    const again = readSettings(home)
    assert.deepEqual(again.settings.modelRoutes, [{ provider: 'p', model: 'm', headroomTokens: 8192 }])
    assert.equal(settingsPaths(home).settings, again.paths.settings)
  } finally {
    rmSync(home, { recursive: true, force: true })
  }
})

test('hand-edited values are tolerated', () => {
  const home = tempHome()
  try {
    writeSettings(home, { settings: { level: 'off', modelRoutes: 'bad line' } })
    const state = readSettings(home)
    assert.equal(state.settings.level, 'gentle')
    assert.deepEqual(state.settings.modelRoutes, [])
  } finally {
    rmSync(home, { recursive: true, force: true })
  }
})

test('a corrupt JSON file falls back to defaults without throwing', () => {
  const home = tempHome()
  try {
    writeSettings(home, { settings: { level: 'max' } })
    writeFileSync(settingsPaths(home).settings, '{ broken')
    const state = readSettings(home)
    assert.equal(state.exists, false)
    assert.equal(state.settings.level, 'standard')
  } finally {
    rmSync(home, { recursive: true, force: true })
  }
})

test('atomic text writes create missing directories and leave no temp file', () => {
  const home = tempHome()
  try {
    const path = join(home, 'nested', 'AGENTS.md')
    writeText(path, 'first\n')
    writeText(path, 'second\n')
    assert.equal(readFileSync(path, 'utf8'), 'second\n')
    assert.deepEqual(readdirSync(join(home, 'nested')), ['AGENTS.md'])
  } finally {
    rmSync(home, { recursive: true, force: true })
  }
})

test('github settings keep the remote and drop the retired repository fields', () => {
  const home = tempHome()
  try {
    const empty = readSettings(home)
    assert.equal(empty.settings.github.remote, 'origin')
    assert.equal('repoPath' in empty.settings.github, false)
    assert.equal('repos' in empty.settings.github, false)

    writeSettings(home, {
      settings: { github: { repoPath: 'D:/repo', repos: ['D:/a'], remote: 'upstream', branch: 'main' } },
    })
    const state = readSettings(home)
    assert.equal(state.settings.github.remote, 'upstream')
    assert.equal(state.settings.github.branch, 'main')
    assert.equal('repos' in state.settings.github, false)
    // The retired fields are also gone from the file on disk, not only in memory.
    const persisted = readFileSync(settingsPaths(home).settings, 'utf8')
    assert.equal(persisted.includes('"repos"'), false)
    assert.equal(persisted.includes('"repoPath"'), false)
  } finally {
    rmSync(home, { recursive: true, force: true })
  }
})

test('writeJson is a thin atomic text write', () => {
  const home = tempHome()
  try {
    const path = join(home, 'state.json')
    writeJson(path, { level: 'max' })
    assert.equal(readFileSync(path, 'utf8'), '{\n  "level": "max"\n}\n')
    assert.deepEqual(readdirSync(home), ['state.json'])
  } finally {
    rmSync(home, { recursive: true, force: true })
  }
})

test('the shared download root is persisted and a relative one is dropped', () => {
  const home = tempHome()
  try {
    assert.equal(readSettings(home).settings.toolsPath, '')
    const saved = writeSettings(home, { settings: { toolsPath: join(home, 'shared-tools') } })
    assert.equal(saved.settings.toolsPath, join(home, 'shared-tools'))
    assert.equal(readSettings(home).settings.toolsPath, join(home, 'shared-tools'))
    // A hand-edited relative path would resolve against the process CWD.
    const dropped = writeSettings(home, { settings: { toolsPath: 'shared-tools' } })
    assert.equal(dropped.settings.toolsPath, '')
    assert.equal(readFileSync(settingsPaths(home).settings, 'utf8').includes('shared-tools"'), false)
  } finally {
    rmSync(home, { recursive: true, force: true })
  }
})

test('session repository bindings are normalized and invalid entries dropped', () => {
  const home = tempHome()
  try {
    const saved = writeSettings(home, {
      settings: {
        sessionRepos: {
          'session-a': 'Homer4033/dsh-compression-tiers',
          ' session-b ': 'Homer4033/ok',
          'session-c': 'not a repo',
          'session-d': 'too/many/slashes',
          '': 'Homer4033/x',
          'session-e': 42,
        },
      },
    })
    assert.deepEqual(saved.settings.sessionRepos, {
      'session-a': 'Homer4033/dsh-compression-tiers',
      'session-b': 'Homer4033/ok',
    })
    assert.equal(readSettings(home).settings.sessionRepos['session-a'], 'Homer4033/dsh-compression-tiers')
  } finally {
    rmSync(home, { recursive: true, force: true })
  }
})

test('normalizeRepoName accepts owner/name only', () => {
  assert.equal(normalizeRepoName('Homer4033/dsh-compression-tiers'), 'Homer4033/dsh-compression-tiers')
  assert.equal(normalizeRepoName('  Homer4033/ok  '), 'Homer4033/ok')
  assert.equal(normalizeRepoName('Homer4033'), null)
  assert.equal(normalizeRepoName('https://github.com/a/b'), null)
  assert.equal(normalizeRepoName('a/b/c'), null)
  assert.equal(normalizeRepoName(''), null)
  assert.equal(normalizeRepoName(null), null)
  assert.equal(normalizeRepoName(`${'x'.repeat(100)}/${'y'.repeat(100)}`), null)
})

test('session repository bindings keep the last 200 entries', () => {
  const input = {}
  for (let index = 0; index < 205; index += 1) input[`session-${index}`] = `owner/repo-${index}`
  const kept = normalizeSessionRepos(input)
  assert.equal(Object.keys(kept).length, 200)
  assert.equal('session-0' in kept, false)
  assert.equal(kept['session-204'], 'owner/repo-204')
  assert.deepEqual(normalizeSessionRepos(null), {})
  assert.deepEqual(normalizeSessionRepos(['owner/repo']), {})
})

test('appearance is gone from the schema and dropped on read', () => {
  const home = tempHome()
  try {
    const paths = settingsPaths(home)
    // A 2.8.1 install may still carry the old palette / motion / art object. It
    // must not fail the read, and the next write must drop it instead of
    // resurrecting a control that no longer exists.
    writeJson(paths.settings, {
      level: 'max',
      modelRoutes: [],
      appearance: { palette: 'crystal', motion: 'off', art: false },
    })
    const state = readSettings(home)
    assert.equal('appearance' in state.settings, false)
    assert.equal(state.settings.level, 'max')
    const saved = writeSettings(home, { settings: { level: 'aggressive' } })
    assert.equal('appearance' in saved.settings, false)
    assert.equal(saved.settings.level, 'aggressive')
    assert.equal(readFileSync(paths.settings, 'utf8').includes('appearance'), false)
  } finally {
    rmSync(home, { recursive: true, force: true })
  }
})

test('nightly dream settings are stored, normalized and default to disabled', () => {
  const home = tempHome()
  try {
    const fresh = readSettings(home)
    assert.equal(fresh.settings.memory.dream.enabled, false)
    assert.equal(fresh.settings.memory.dream.intervalHours, 24)
    assert.equal(fresh.settings.memory.dream.lastReport, null)
    const saved = writeSettings(home, {
      settings: {
        memory: {
          dream: {
            enabled: true,
            intervalHours: 999,
            lastRunAt: '2026-11-28T00:00:00.000Z',
            lastReport: { ranAt: '2026-11-28T00:00:00.000Z', totals: { roots: 1 }, roots: [] },
          },
        },
      },
    })
    assert.equal(saved.settings.memory.dream.enabled, true)
    assert.equal(saved.settings.memory.dream.intervalHours, 168)
    assert.equal(saved.settings.memory.dream.lastRunAt, '2026-11-28T00:00:00.000Z')
    assert.equal(saved.settings.memory.dream.lastReport.totals.roots, 1)
    // An upgraded settings file written before 2.10.0 has no `memory` block.
    writeFileSync(settingsPaths(home).settings, JSON.stringify({ level: 'max' }))
    const legacy = readSettings(home)
    assert.equal(legacy.settings.level, 'max')
    assert.equal(legacy.settings.memory.dream.enabled, false)
    assert.equal(legacy.settings.memory.dream.intervalHours, 24)
  } finally {
    rmSync(home, { recursive: true, force: true })
  }
})
