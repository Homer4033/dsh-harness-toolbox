import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { isAbsolute, join } from 'node:path'
import { MAX_RULES_CHARS } from '../src/rules.js'
import {
  MAX_WORKSPACES,
  WORKSPACE_BLOCK_END,
  WORKSPACE_BLOCK_START,
  composeWorkspaceFile,
  extractWorkspaceBlock,
  findWorkspace,
  listWorkspaces,
  readWorkspaceRules,
  saveWorkspaceRules,
  stripWorkspaceBlock,
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

test('a workspace reads only its fenced supplement, never the rest of the file', () => {
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
    // A file the panel never wrote is somebody else's contract: the editor
    // reads as empty instead of echoing the whole file back.
    writeFileSync(join(dir, 'AGENTS.md'), '\uFEFF# Space\r\n\r\nread me\r\n')
    const foreign = readWorkspaceRules(workspace)
    assert.equal(foreign.exists, true)
    assert.equal(foreign.text, '')
    // The supplement comes back without BOM, CRLF or the fence itself.
    writeFileSync(
      join(dir, 'AGENTS.md'),
      `\uFEFF${WORKSPACE_BLOCK_START}\r\nkeep it\r\n${WORKSPACE_BLOCK_END}\r\n\r\nrest\r\n`,
    )
    const read = readWorkspaceRules(workspace)
    assert.equal(read.text, 'keep it')
    assert.equal(read.chars, 'keep it'.length)
  } finally {
    rmSync(home, { recursive: true, force: true })
    rmSync(root, { recursive: true, force: true })
  }
})

test('the fenced block round-trips: extract, strip and compose agree', () => {
  const block = `${WORKSPACE_BLOCK_START}\nsupplement line\n${WORKSPACE_BLOCK_END}`
  assert.equal(extractWorkspaceBlock(`${block}\n\nrest`), 'supplement line')
  assert.equal(stripWorkspaceBlock(`${block}\n\nrest`), 'rest')
  assert.equal(extractWorkspaceBlock('no fence here'), '')
  assert.equal(stripWorkspaceBlock('no fence here'), 'no fence here')
  // compose puts the fence on top of whatever the file already carried.
  assert.equal(composeWorkspaceFile('\uFEFF# Space\r\n\r\nmine\r\n', 'supplement line'), `${block}\n\n# Space\n\nmine\n`)
  // An empty supplement drops the fence but keeps the file's own text.
  assert.equal(composeWorkspaceFile(`${block}\n\n# Space\n`, ''), '# Space\n')
  assert.equal(composeWorkspaceFile('', ''), '')
})

test('saving a workspace puts the supplement at the top and keeps the rest', () => {
  const home = tempHome()
  const root = tempHome()
  try {
    const dir = workspaceDir(root, 'space')
    writeRegistry(home, ['w1'], { w1: { path: dir, title: 'Space', sessionIds: [] } })
    const saved = saveWorkspaceRules(home, 'w1', '\uFEFFone\r\ntwo  ')
    assert.equal(saved.id, 'w1')
    assert.equal(saved.file, join(dir, 'AGENTS.md'))
    assert.equal(saved.exists, true)
    assert.equal(saved.text, 'one\ntwo  ')
    assert.equal(
      readFileSync(join(dir, 'AGENTS.md'), 'utf8'),
      `${WORKSPACE_BLOCK_START}\none\ntwo  \n${WORKSPACE_BLOCK_END}\n`,
    )
    // The write is atomic: no temp file survives beside the rules.
    assert.deepEqual(readdirSync(dir), ['AGENTS.md'])
    // A second save replaces the block instead of appending a second one, and
    // the workspace's own text below the fence is untouched.
    writeFileSync(
      join(dir, 'AGENTS.md'),
      `${WORKSPACE_BLOCK_START}\nold\n${WORKSPACE_BLOCK_END}\n\n# Space\n\nmine\n`,
    )
    const again = saveWorkspaceRules(home, 'w1', 'new\n')
    assert.equal(again.text, 'new')
    assert.equal(
      readFileSync(join(dir, 'AGENTS.md'), 'utf8'),
      `${WORKSPACE_BLOCK_START}\nnew\n${WORKSPACE_BLOCK_END}\n\n# Space\n\nmine\n`,
    )
    // An empty save clears the supplement and leaves the file's own text.
    assert.equal(saveWorkspaceRules(home, 'w1', '').text, '')
    assert.equal(readFileSync(join(dir, 'AGENTS.md'), 'utf8'), '# Space\n\nmine\n')
  } finally {
    rmSync(home, { recursive: true, force: true })
    rmSync(root, { recursive: true, force: true })
  }
})

test('a workspace without AGENTS.md gets one created on save', () => {
  const home = tempHome()
  const root = tempHome()
  try {
    const dir = workspaceDir(root, 'space')
    writeRegistry(home, ['w1'], { w1: { path: dir, title: 'Space' } })
    // Clearing an empty editor creates nothing: no empty contract is left behind.
    assert.equal(saveWorkspaceRules(home, 'w1', '').exists, false)
    assert.deepEqual(readdirSync(dir), [])
    const saved = saveWorkspaceRules(home, 'w1', 'first rule')
    assert.equal(saved.exists, true)
    assert.equal(saved.text, 'first rule')
    assert.equal(
      readFileSync(join(dir, 'AGENTS.md'), 'utf8'),
      `${WORKSPACE_BLOCK_START}\nfirst rule\n${WORKSPACE_BLOCK_END}\n`,
    )
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

test('the payload reports every registered workspace with its supplement', () => {
  const home = tempHome()
  const root = tempHome()
  try {
    const alpha = workspaceDir(root, 'alpha')
    const beta = workspaceDir(root, 'beta')
    writeRegistry(home, ['w1', 'w2'], {
      w1: { path: alpha, title: 'Alpha' },
      w2: { path: beta, title: 'Beta' },
    })
    writeFileSync(
      join(alpha, 'AGENTS.md'),
      `${WORKSPACE_BLOCK_START}\nalpha supplement\n${WORKSPACE_BLOCK_END}\n\n# Alpha\n\nthe rest\n`,
    )
    const payload = workspacesPayload(home)
    assert.equal(payload.ok, true)
    assert.equal(payload.maxChars, MAX_RULES_CHARS)
    assert.deepEqual(payload.workspaces.map((item) => item.id), ['w1', 'w2'])
    // The payload carries the supplement only: the rest never leaves the disk.
    assert.equal(payload.workspaces[0].text, 'alpha supplement')
    assert.equal(payload.workspaces[0].chars, 'alpha supplement'.length)
    assert.equal(payload.workspaces[0].exists, true)
    assert.equal(payload.workspaces[0].file, join(alpha, 'AGENTS.md'))
    assert.equal(payload.workspaces[1].exists, false)
    assert.equal(payload.workspaces[1].text, '')
  } finally {
    rmSync(home, { recursive: true, force: true })
    rmSync(root, { recursive: true, force: true })
  }
})
