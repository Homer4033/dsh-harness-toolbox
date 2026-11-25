import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import {
  MAX_RULES_CHARS,
  PROMPT_CLIP_CHARS,
  clipRules,
  normalizeRulesText,
  readRules,
  rulesPath,
  rulesPromptBlock,
  saveRules,
} from '../src/rules.js'

function tempHome() {
  return mkdtempSync(join(tmpdir(), 'compression-tiers-rules-'))
}

test('a missing rules file reads as empty and names the official path', () => {
  const home = tempHome()
  try {
    assert.equal(rulesPath(home), join(home, 'AGENTS.md'))
    const rules = readRules(home)
    assert.equal(rules.exists, false)
    assert.equal(rules.text, '')
    assert.equal(rules.chars, 0)
    assert.equal(rules.lines, 0)
    assert.equal(rules.updatedAt, null)
  } finally {
    rmSync(home, { recursive: true, force: true })
  }
})

test('saving normalizes the text, writes exactly one trailing newline and reads it back', () => {
  const home = tempHome()
  try {
    const saved = saveRules(home, '\uFEFFline one\r\nline two  ')
    assert.equal(saved.exists, true)
    assert.equal(saved.text, 'line one\nline two  \n')
    assert.equal(saved.chars, saved.text.length)
    assert.equal(saved.lines, 2)
    assert.match(saved.updatedAt, /^\d{4}-\d{2}-\d{2}T/)
    assert.equal(readFileSync(rulesPath(home), 'utf8'), 'line one\nline two  \n')
  } finally {
    rmSync(home, { recursive: true, force: true })
  }
})

test('a hand-edited BOM/CRLF file reads back normalized so the editor is not dirty', () => {
  const home = tempHome()
  try {
    writeFileSync(rulesPath(home), '\uFEFFone\r\ntwo\r\n')
    const rules = readRules(home)
    assert.equal(rules.exists, true)
    assert.equal(rules.text, 'one\ntwo\n')
    assert.equal(rules.chars, rules.text.length)
    assert.equal(rules.lines, 2)
  } finally {
    rmSync(home, { recursive: true, force: true })
  }
})

test('an empty save writes an empty file instead of a lone newline', () => {
  const home = tempHome()
  try {
    saveRules(home, 'something')
    const saved = saveRules(home, '')
    assert.equal(saved.text, '')
    assert.equal(saved.chars, 0)
    assert.equal(saved.lines, 0)
    assert.equal(readFileSync(rulesPath(home), 'utf8'), '')
  } finally {
    rmSync(home, { recursive: true, force: true })
  }
})

test('a read leaves no temp file and replaces the previous content atomically', () => {
  const home = tempHome()
  try {
    writeFileSync(rulesPath(home), 'old rules\n')
    saveRules(home, 'new rules')
    assert.deepEqual(readdirSync(home), ['AGENTS.md'])
    assert.equal(readFileSync(rulesPath(home), 'utf8'), 'new rules\n')
  } finally {
    rmSync(home, { recursive: true, force: true })
  }
})

test('non-string and oversized writes are rejected with a status for the route', () => {
  assert.throws(() => normalizeRulesText(null), /must be a string/)
  assert.throws(() => normalizeRulesText(42), /must be a string/)
  const huge = 'x'.repeat(MAX_RULES_CHARS + 1)
  assert.throws(() => normalizeRulesText(huge), (error) => error.status === 413 && /at most/.test(error.message))
  assert.equal(normalizeRulesText('x'.repeat(MAX_RULES_CHARS)).length, MAX_RULES_CHARS + 1)
})

test('the prompt clip trims, bounds and marks truncation', () => {
  assert.equal(clipRules(''), '')
  assert.equal(clipRules('   \n  '), '')
  assert.equal(clipRules('  keep me  '), 'keep me')
  const long = 'a'.repeat(PROMPT_CLIP_CHARS + 50)
  const clipped = clipRules(long)
  assert.ok(clipped.length > PROMPT_CLIP_CHARS)
  assert.match(clipped, /\n…$/)
  assert.equal(clipRules(long, 10), `${'a'.repeat(10)}\n…`)
})

test('the prompt block points at the file and stays bounded', () => {
  const home = tempHome()
  try {
    const empty = rulesPromptBlock(home)
    assert.match(empty, /none yet/)
    assert.ok(empty.includes(rulesPath(home)))
    saveRules(home, 'Answer in Chinese.')
    const filled = rulesPromptBlock(home)
    assert.ok(filled.includes(rulesPath(home)))
    assert.match(filled, /Answer in Chinese\./)
    saveRules(home, 'a'.repeat(PROMPT_CLIP_CHARS + 10))
    const clipped = rulesPromptBlock(home)
    assert.ok(clipped.length < PROMPT_CLIP_CHARS + 600)
  } finally {
    rmSync(home, { recursive: true, force: true })
  }
})
