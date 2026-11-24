import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { isAbsolute, join } from 'node:path'
import { MAX_RULES_CHARS } from '../src/rules.js'
import {
  MAX_WORKSPACES,
  findWorkspace,
  listWorkspaces,
  readWorkspaceRules,
  saveWorkspaceRules,
  workspaceRegistryPath,
  workspaceRulesPath,
  workspacesPayload,
} from '../src/workspace-rules.js'

function tempHome() {
  return mkdtempSync(join(tmpdir(), 'compression-tiers-workspaces-'))
}

/** Write the official registry shape with one row per workspace. */
function writeRegistry(home, ids, rows) {
  mkdirSync(join(home, 'storages'), { recursive: true })
  writeFileSync(workspaceRegistryPath(home), JSON.stringify({
    unit: { name: 'workspace', version: 2 },
    global: { initialized: true, workspaceIds: ids },
    tables: { workspaces: rows },
  }))
}

function workspaceDir(root, name) {
  const dir = join(root, name)
  mkdirSync(dir, { recursive: true })
  return dir
}

test('the registry names the only editable workspaces, in registry order', () => {
  const home = tempHome()
  const root = tempHome()
  try {
    const alpha = workspaceDir(root, 'alpha')
    const beta = workspaceDir(root, 'beta')
    writeRegistry(home, ['w2', 'w1', 'w3', 'w4'], {
      w1: { path: alpha, title: 'Alpha' },
      // No title: the path is the readable fallback.
      w2: { path: beta },
      // A relative path cannot be edited safely and is skipped.
      w3: { path: 'relative/dir', title: 'Relative' },
      // Same directory as w1: one editor per directory.
      w4: { path: alpha, title: 'Alpha again' },
    })
    const list = listWorkspaces(home)
    assert.deepEqual(list.map((item) => item.id), ['w2', 'w1'])
    assert.deepEqual(list.map((item) => item.title), [beta, 'Alpha'])
    assert.equal(findWorkspace(home, 'w1').path, alpha)
    assert.equal(findWorkspace(home, 'w9'), undefined)
    assert.equal(findWorkspace(home, undefined), undefined)
  } finally {
    rmSync(home, { recursive: true, force: true })
    rmSync(root, { recursive: true, force: true })
  }
})

test('a missing or broken registry lists no workspace instead of throwing', () => {
  const home = tempHome()
  try {
    assert.deepEqual(listWorkspaces(home), [])
    assert.deepEqual(workspacesPayload(home).workspaces, [])
    mkdirSync(join(home, 'storages'), { recursive: true })
    writeFileSync(workspaceRegistryPath(home), '{oops')
    assert.deepEqual(listWorkspaces(home), [])
  } finally {
    rmSync(home, { recursive: true, force: true })
  }
})

test('the registry is bounded so a bad file cannot flood the panel', () => {
  const home = tempHome()
  const root = tempHome()
  try {
    const ids = []
    const rows = {}
    for (let index = 0; index < MAX_WORKSPACES + 5; index++) {
      const id = `w${index}`
      ids.push(id)
      rows[id] = { path: workspaceDir(root, `dir-${index}`), title: id }
    }
    writeRegistry(home, ids, rows)
    assert.equal(listWorkspaces(home).length, MAX_WORKSPACES)
  } finally {
    rmSync(home, { recursive: true, force: true })
    rmSync(root, { recursive: true, force: true })
  }
})

test('workspace rules read with the BOM stripped and default to an empty file', () => {
  const home = tempHome()
  const root = tempHome()
  try {
    const dir = workspaceDir(root, 'space')
    writeRegistry(home, ['w1'], { w1: { path: dir, title: 'Space' } })
    const workspace = findWorkspace(home, 'w1')
    assert.equal(workspaceRulesPath(workspace), join(dir, 'AGENTS.md'))
    assert.ok(isAbsolute(workspaceRulesPath(workspace)))
    assert.deepEqual(readWorkspaceRules(workspace), {
      exists: false,
      file: join(dir, 'AGENTS.md'),
      text: '',
      chars: 0,
    })
    writeFileSync(join(dir, 'AGENTS.md'), '\uFEFFread me\r\n')
    const read = readWorkspaceRules(workspace)
    assert.equal(read.exists, true)
    assert.equal(read.text, 'read me\r\n')
  } finally {
    rmSync(home, { recursive: true, force: true })
    rmSync(root, { recursive: true, force: true })
  }
})

test('saving a registered workspace normalizes the text and reports the file', () => {
  const home = tempHome()
  const root = tempHome()
  try {
    const dir = workspaceDir(root, 'space')
    writeRegistry(home, ['w1'], { w1: { path: dir, title: 'Space', sessionIds: [] } })
    const saved = saveWorkspaceRules(home, 'w1', '\uFEFFone\r\ntwo  ')
    assert.equal(saved.id, 'w1')
    assert.equal(saved.file, join(dir, 'AGENTS.md'))
    assert.equal(saved.exists, true)
    assert.equal(saved.text, 'one\ntwo  \n')
    assert.equal(readFileSync(join(dir, 'AGENTS.md'), 'utf8'), 'one\ntwo  \n')
    // The write is atomic: no temp file survives beside the rules.
    assert.deepEqual(readdirSync(dir), ['AGENTS.md'])
    // An empty save clears the file rather than leaving a lone newline.
    assert.equal(saveWorkspaceRules(home, 'w1', '').text, '')
    assert.equal(readFileSync(join(dir, 'AGENTS.md'), 'utf8'), '')
  } finally {
    rmSync(home, { recursive: true, force: true })
    rmSync(root, { recursive: true, force: true })
  }
})

test('an unregistered workspace is refused before any path is touched', () => {
  const home = tempHome()
  const root = tempHome()
  try {
    const dir = workspaceDir(root, 'space')
    writeRegistry(home, ['w1'], { w1: { path: dir, title: 'Space' } })
    assert.throws(
      () => saveWorkspaceRules(home, 'nope', 'anything'),
      (error) => error.status === 404 && /unknown workspace/.test(error.message),
    )
    assert.throws(() => saveWorkspaceRules(home, '../escape', 'anything'), (error) => error.status === 404)
    assert.deepEqual(readdirSync(dir), [])
  } finally {
    rmSync(home, { recursive: true, force: true })
    rmSync(root, { recursive: true, force: true })
  }
})

test('an oversized draft is rejected with 413 and leaves the file alone', () => {
  const home = tempHome()
  const root = tempHome()
  try {
    const dir = workspaceDir(root, 'space')
    writeRegistry(home, ['w1'], { w1: { path: dir, title: 'Space' } })
    writeFileSync(join(dir, 'AGENTS.md'), 'keep me\n')
    assert.throws(
      () => saveWorkspaceRules(home, 'w1', 'x'.repeat(MAX_RULES_CHARS + 1)),
      (error) => error.status === 413,
    )
    assert.equal(readFileSync(join(dir, 'AGENTS.md'), 'utf8'), 'keep me\n')
  } finally {
    rmSync(home, { recursive: true, force: true })
    rmSync(root, { recursive: true, force: true })
  }
})

test('the payload reports every registered workspace with its text', () => {
  const home = tempHome()
  const root = tempHome()
  try {
    const alpha = workspaceDir(root, 'alpha')
    const beta = workspaceDir(root, 'beta')
    writeRegistry(home, ['w1', 'w2'], {
      w1: { path: alpha, title: 'Alpha' },
      w2: { path: beta, title: 'Beta' },
    })
    writeFileSync(join(alpha, 'AGENTS.md'), 'alpha rules\n')
    const payload = workspacesPayload(home)
    assert.equal(payload.ok, true)
    assert.equal(payload.maxChars, MAX_RULES_CHARS)
    assert.deepEqual(payload.workspaces.map((item) => item.id), ['w1', 'w2'])
    assert.equal(payload.workspaces[0].text, 'alpha rules\n')
    assert.equal(payload.workspaces[0].exists, true)
    assert.equal(payload.workspaces[0].file, join(alpha, 'AGENTS.md'))
    assert.equal(payload.workspaces[1].exists, false)
    assert.equal(payload.workspaces[1].text, '')
  } finally {
    rmSync(home, { recursive: true, force: true })
    rmSync(root, { recursive: true, force: true })
  }
})
