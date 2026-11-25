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

test('a CRLF supplement reads with LF so the editor is not dirty on load', () => {
  const home = tempHome()
  const root = tempHome()
  try {
    const dir = workspaceDir(root, 'space')
    writeRegistry(home, ['w1'], { w1: { path: dir, title: 'Space' } })
    writeFileSync(
      join(dir, 'AGENTS.md'),
      `${WORKSPACE_BLOCK_START}\r\none\r\ntwo\r\n${WORKSPACE_BLOCK_END}\r\n\r\n# Space\r\n`,
    )
    const row = readWorkspaceRules(findWorkspace(home, 'w1'))
    assert.equal(row.text, 'one\ntwo')
    assert.equal(row.chars, 'one\ntwo'.length)
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

test('only a marker on a line of its own at the top of the file is a fence', () => {
  // This repository's own AGENTS.md mentions both markers while describing the
  // managed block; a mention sharing its line with other text is prose. Treating
  // it as a fence would put somebody else's contract in the editor and let a
  // save cut that contract out of the file.
  const prose = [
    '# Contract',
    '',
    `- the panel owns the block between ${WORKSPACE_BLOCK_START} and`,
    `  ${WORKSPACE_BLOCK_END}, kept at the top of the file;`,
    '',
    'The rest of this file belongs to the workspace.',
    '',
  ].join('\n')
  assert.equal(extractWorkspaceBlock(prose), '')
  assert.equal(stripWorkspaceBlock(prose), prose)
  assert.equal(composeWorkspaceFile(prose, ''), prose)
  // A whole-line fence further down is not ours either: the block only ever
  // lives at the top, where the instruction loader reads it first.
  const lower = `# Contract\n\n${WORKSPACE_BLOCK_START}\nours?\n${WORKSPACE_BLOCK_END}\n`
  assert.equal(extractWorkspaceBlock(lower), '')
  assert.equal(stripWorkspaceBlock(lower), lower)
  // Blank lines above the fence are fine: it is still the first real line.
  assert.equal(extractWorkspaceBlock(`\n\n${WORKSPACE_BLOCK_START}\nmine\n${WORKSPACE_BLOCK_END}\n`), 'mine')
})

test('saving into a file that only mentions the markers keeps its body verbatim', () => {
  const home = tempHome()
  const root = tempHome()
  try {
    const dir = workspaceDir(root, 'space')
    writeRegistry(home, ['w1'], { w1: { path: dir, title: 'Space' } })
    const prose = [
      '# Contract',
      '',
      `Fence: ${WORKSPACE_BLOCK_START} … ${WORKSPACE_BLOCK_END}`,
      '',
      'The rest of this file belongs to the workspace.',
      '',
    ].join('\n')
    writeFileSync(join(dir, 'AGENTS.md'), prose)
    // The editor shows the supplement only — here, nothing at all.
    const read = readWorkspaceRules(findWorkspace(home, 'w1'))
    assert.equal(read.exists, true)
    assert.equal(read.text, '')
    const saved = saveWorkspaceRules(home, 'w1', 'supplement')
    assert.equal(saved.text, 'supplement')
    // The prose below the new fence survives byte for byte, markers included.
    assert.equal(
      readFileSync(join(dir, 'AGENTS.md'), 'utf8'),
      `${WORKSPACE_BLOCK_START}\nsupplement\n${WORKSPACE_BLOCK_END}\n\n${prose}`,
    )
    // Clearing takes the fence away and leaves the file exactly as it was.
    saveWorkspaceRules(home, 'w1', '')
    assert.equal(readFileSync(join(dir, 'AGENTS.md'), 'utf8'), prose)
  } finally {
    rmSync(home, { recursive: true, force: true })
    rmSync(root, { recursive: true, force: true })
  }
})

test('a lone START at the top is an empty block, so a save never leaves two', () => {
  const orphan = `${WORKSPACE_BLOCK_START}\nleft over\n`
  assert.equal(extractWorkspaceBlock(orphan), '')
  assert.equal(stripWorkspaceBlock(orphan), 'left over\n')
  // The text below a half-written fence is foreign, so it is kept; the new block
  // goes above it and the orphan marker is gone: one START, one END.
  assert.equal(
    composeWorkspaceFile(orphan, 'fresh'),
    `${WORKSPACE_BLOCK_START}\nfresh\n${WORKSPACE_BLOCK_END}\n\nleft over\n`,
  )
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

test('a registry written with a BOM still lists its workspaces', () => {
  const home = tempHome()
  const root = tempHome()
  try {
    const dir = workspaceDir(root, 'space')
    mkdirSync(join(home, 'storages'), { recursive: true })
    // Hand-edited registries often carry a UTF-8 BOM; it must not hide them.
    writeFileSync(workspaceRegistryPath(home), '\uFEFF' + JSON.stringify({
      global: { initialized: true, workspaceIds: ['w1'] },
      tables: { workspaces: { w1: { path: dir, title: 'Space' } } },
    }))
    const list = listWorkspaces(home)
    assert.equal(list.length, 1)
    assert.equal(list[0].path, dir)
  } finally {
    rmSync(home, { recursive: true, force: true })
    rmSync(root, { recursive: true, force: true })
  }
})

test('a supplement with a whole-line fence marker is refused and the file untouched', () => {
  const home = tempHome()
  const root = tempHome()
  try {
    const dir = workspaceDir(root, 'space')
    writeRegistry(home, ['w1'], { w1: { path: dir, title: 'Space' } })
    const before = '# Space\n\nmine\n'
    writeFileSync(join(dir, 'AGENTS.md'), before)
    for (const marker of [WORKSPACE_BLOCK_START, WORKSPACE_BLOCK_END]) {
      assert.throws(
        () => saveWorkspaceRules(home, 'w1', `one\n  ${marker}  \ntwo`),
        (error) => error.status === 400 && /fence marker/.test(error.message),
      )
    }
    assert.equal(readFileSync(join(dir, 'AGENTS.md'), 'utf8'), before, 'nothing was written')
    // A mention inside a line cannot close the fence, so it stays allowed.
    const saved = saveWorkspaceRules(home, 'w1', `mention ${WORKSPACE_BLOCK_START} inline`)
    assert.equal(saved.text, `mention ${WORKSPACE_BLOCK_START} inline`)
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
