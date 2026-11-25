import test from 'node:test'
import assert from 'node:assert/strict'
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, renameSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import {
  TOOL_DIRS,
  defaultToolsPath,
  migrateTools,
  normalizeToolsPath,
  parseToolsPath,
  resolveToolsPath,
  toolsStatus,
} from '../src/tools-path.js'

function tempDir() {
  return mkdtempSync(join(tmpdir(), 'compression-tiers-tools-'))
}

/** A root with one file in each managed component's `bin` directory. */
function plantedRoot(root) {
  for (const name of TOOL_DIRS) {
    mkdirSync(join(root, name, 'bin'), { recursive: true })
    writeFileSync(join(root, name, 'bin', `${name}.txt`), name)
  }
  return root
}

test('the default root is the plugin directory inside the DSH home', () => {
  const home = tempDir()
  try {
    assert.equal(defaultToolsPath(home), join(home, 'compression-tiers'))
    assert.equal(resolveToolsPath(home, {}), defaultToolsPath(home))
    assert.equal(resolveToolsPath(home, { toolsPath: '' }), defaultToolsPath(home))
    // A hand-edited relative path falls back instead of resolving against CWD.
    assert.equal(resolveToolsPath(home, { toolsPath: 'tools' }), defaultToolsPath(home))
    assert.equal(resolveToolsPath(home, { toolsPath: 42 }), defaultToolsPath(home))
  } finally {
    rmSync(home, { recursive: true, force: true })
  }
})

test('an absolute toolsPath wins and is normalized', () => {
  const home = tempDir()
  const target = tempDir()
  try {
    const configured = resolveToolsPath(home, { toolsPath: ` ${target}${process.platform === 'win32' ? '\\' : '/'} ` })
    assert.equal(configured, target)
    assert.equal(normalizeToolsPath(target), target)
    assert.equal(normalizeToolsPath('relative/dir'), '')
    assert.equal(normalizeToolsPath(''), '')
    assert.equal(normalizeToolsPath(null), '')
    assert.throws(() => parseToolsPath('relative/dir'), /absolute/)
    assert.throws(() => parseToolsPath(''), /empty/)
  } finally {
    rmSync(home, { recursive: true, force: true })
    rmSync(target, { recursive: true, force: true })
  }
})

test('toolsStatus names every component directory and the running jobs', () => {
  const home = tempDir()
  try {
    const empty = toolsStatus(home, {})
    assert.equal(empty.path, defaultToolsPath(home))
    assert.equal(empty.isDefault, true)
    assert.deepEqual(empty.components.map((item) => item.id), TOOL_DIRS)
    for (const item of empty.components) {
      assert.equal(item.path, join(defaultToolsPath(home), item.id))
      assert.equal(item.exists, false)
    }
    assert.deepEqual(empty.running, { gh: false, git: false, ffmpeg: false, python: false, models: false })
    // Models share the root but get their own folder and never a PATH entry.
    assert.equal(empty.models.path, join(defaultToolsPath(home), 'models'))
    assert.equal(empty.models.exists, false)

    plantedRoot(defaultToolsPath(home))
    const planted = toolsStatus(home, {}, { running: { ffmpeg: true } })
    for (const item of planted.components) assert.equal(item.exists, true, `${item.id} exists`)
    assert.deepEqual(planted.running, { gh: false, git: false, ffmpeg: true, python: false, models: false })
  } finally {
    rmSync(home, { recursive: true, force: true })
  }
})

test('migration moves both components and leaves the old root empty', () => {
  const home = tempDir()
  const target = tempDir()
  try {
    const from = plantedRoot(defaultToolsPath(home))
    const report = migrateTools({ home, settings: {}, target })
    assert.deepEqual(report.moved.sort(), TOOL_DIRS.slice().sort())
    assert.deepEqual(report.failed, [])
    assert.equal(report.from, from)
    assert.equal(report.to, target)
    for (const name of TOOL_DIRS) {
      assert.equal(existsSync(join(target, name, 'bin', `${name}.txt`)), true)
      assert.equal(existsSync(join(from, name)), false)
    }
  } finally {
    rmSync(home, { recursive: true, force: true })
    rmSync(target, { recursive: true, force: true })
  }
})

test('migrating to the current root is a no-op', () => {
  const home = tempDir()
  try {
    const root = plantedRoot(defaultToolsPath(home))
    const report = migrateTools({ home, settings: {}, target: root })
    assert.deepEqual(report.moved, [])
    assert.equal(existsSync(join(root, 'gh', 'bin', 'gh.txt')), true)
  } finally {
    rmSync(home, { recursive: true, force: true })
  }
})

test('a running download blocks the move', () => {
  const home = tempDir()
  const target = tempDir()
  try {
    plantedRoot(defaultToolsPath(home))
    for (const running of [{ gh: true }, { git: true }, { ffmpeg: true }, { python: true }]) {
      assert.throws(
        () => migrateTools({ home, settings: {}, target, running }),
        (error) => error.status === 409 && /is downloading/.test(error.message),
      )
    }
    // Nothing moved.
    assert.equal(existsSync(join(target, 'gh')), false)
  } finally {
    rmSync(home, { recursive: true, force: true })
    rmSync(target, { recursive: true, force: true })
  }
})

test('an existing component at the target is refused before anything moves', () => {
  const home = tempDir()
  const target = tempDir()
  try {
    const from = plantedRoot(defaultToolsPath(home))
    plantedRoot(target)
    assert.throws(
      () => migrateTools({ home, settings: {}, target }),
      (error) => error.status === 409 && /already exists/.test(error.message),
    )
    // Pre-flight refused, so the source tree is untouched.
    assert.equal(existsSync(join(from, 'gh', 'bin', 'gh.txt')), true)
    assert.equal(existsSync(join(from, 'ffmpeg', 'bin', 'ffmpeg.txt')), true)
  } finally {
    rmSync(home, { recursive: true, force: true })
    rmSync(target, { recursive: true, force: true })
  }
})

test('a cross-volume move falls back to copy and delete', () => {
  const home = tempDir()
  const target = tempDir()
  try {
    const from = plantedRoot(defaultToolsPath(home))
    const renamed = []
    const report = migrateTools({
      home,
      settings: {},
      target,
      fs: {
        renameSync(source, destination) {
          renamed.push(source)
          const error = new Error('EXDEV: cross-device link not permitted')
          error.code = 'EXDEV'
          throw error
        },
        cpSync,
        rmSync,
        existsSync,
        mkdirSync,
      },
    })
    assert.equal(renamed.length, TOOL_DIRS.length, 'both components were tried with rename first')
    assert.deepEqual(report.moved.sort(), TOOL_DIRS.slice().sort())
    assert.deepEqual(report.failed, [])
    for (const name of TOOL_DIRS) {
      assert.equal(readFileSync(join(target, name, 'bin', `${name}.txt`), 'utf8'), name)
      assert.equal(existsSync(join(from, name)), false)
    }
  } finally {
    rmSync(home, { recursive: true, force: true })
    rmSync(target, { recursive: true, force: true })
  }
})

test('a copy that dies halfway is rolled back so the retry is not blocked', () => {
  const home = tempDir()
  const target = tempDir()
  try {
    const from = plantedRoot(defaultToolsPath(home))
    const exdev = () => {
      const error = new Error('EXDEV: cross-device link not permitted')
      error.code = 'EXDEV'
      throw error
    }
    // The copy dies after writing part of the tree, so the destination exists.
    const failingCopy = (source, destination) => {
      mkdirSync(join(destination, 'bin'), { recursive: true })
      writeFileSync(join(destination, 'bin', 'half.txt'), 'half')
      throw new Error('ENOSPC: no space left on device')
    }
    assert.throws(
      () => migrateTools({
        home,
        settings: {},
        target,
        fs: { renameSync: exdev, cpSync: failingCopy, rmSync, existsSync, mkdirSync },
      }),
      /could not move/,
    )
    for (const name of TOOL_DIRS) {
      // The half-copied tree is gone, the source is intact, so the next run's
      // pre-flight no longer refuses with "destination already exists".
      assert.equal(existsSync(join(target, name)), false, `${name}: the partial copy was rolled back`)
      assert.equal(existsSync(join(from, name)), true, `${name}: the source survived`)
    }
    const report = migrateTools({ home, settings: {}, target })
    assert.deepEqual(report.moved.sort(), TOOL_DIRS.slice().sort())
  } finally {
    rmSync(home, { recursive: true, force: true })
    rmSync(target, { recursive: true, force: true })
  }
})

test('a second run over half-migrated directories finishes the job', () => {
  const home = tempDir()
  const target = tempDir()
  try {
    const from = plantedRoot(defaultToolsPath(home))
    // The first run moved gh and then failed on ffmpeg.
    renameSync(join(from, 'gh'), join(target, 'gh'))
    const report = migrateTools({ home, settings: {}, target })
    assert.deepEqual(report.moved, ['git', 'ffmpeg', 'python'])
    assert.equal(existsSync(join(target, 'gh', 'bin', 'gh.txt')), true)
    assert.equal(existsSync(join(target, 'ffmpeg', 'bin', 'ffmpeg.txt')), true)
    // A third run has nothing left to do and still succeeds.
    assert.deepEqual(migrateTools({ home, settings: {}, target }).moved, [])
  } finally {
    rmSync(home, { recursive: true, force: true })
    rmSync(target, { recursive: true, force: true })
  }
})
