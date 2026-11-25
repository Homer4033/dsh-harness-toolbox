import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { APPEARANCE_MOTIONS, APPEARANCE_PALETTES, defaultAppearance, normalizeAppearance, normalizeRepoName, normalizeSessionRepos, readSettings, settingsPaths, writeJson, writeSettings, writeText } from '../src/store.js'

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

test('appearance defaults to the host theme, full motion and companions on', () => {
  assert.deepEqual(defaultAppearance(), { palette: 'host', motion: 'full', mascots: true })
  assert.deepEqual(normalizeAppearance(undefined), defaultAppearance())
  assert.deepEqual(normalizeAppearance(null), defaultAppearance())
  assert.deepEqual(normalizeAppearance('warm'), defaultAppearance())
  assert.deepEqual(APPEARANCE_PALETTES, ['host', 'obsidian', 'warm', 'crystal', 'alabaster'])
  assert.deepEqual(APPEARANCE_MOTIONS, ['full', 'subtle', 'off'])
})

test('appearance drops unknown palettes and keeps explicit booleans', () => {
  assert.deepEqual(normalizeAppearance({ palette: 'obsidian', motion: 'subtle', mascots: false }), {
    palette: 'obsidian',
    motion: 'subtle',
    mascots: false,
  })
  assert.deepEqual(normalizeAppearance({ palette: 'neon', motion: 'warp', mascots: 'yes' }), defaultAppearance())
  assert.equal(normalizeAppearance({ mascots: 0 }).mascots, true, 'only false disables the companions')
})

test('appearance is persisted, merged and tolerated when an old file lacks it', () => {
  const home = tempHome()
  try {
    const paths = settingsPaths(home)
    writeJson(paths.settings, { level: 'max', modelRoutes: [] })
    assert.deepEqual(readSettings(home).settings.appearance, defaultAppearance())
    const saved = writeSettings(home, {
      settings: { appearance: { palette: 'crystal', motion: 'off', mascots: false } },
    })
    assert.deepEqual(saved.settings.appearance, { palette: 'crystal', motion: 'off', mascots: false })
    assert.equal(saved.settings.level, 'max')
    // A later partial write keeps the other appearance fields.
    const merged = writeSettings(home, { settings: { appearance: { ...saved.settings.appearance, motion: 'full' } } })
    assert.deepEqual(merged.settings.appearance, { palette: 'crystal', motion: 'full', mascots: false })
    assert.equal(readSettings(home).settings.appearance.palette, 'crystal')
  } finally {
    rmSync(home, { recursive: true, force: true })
  }
})
