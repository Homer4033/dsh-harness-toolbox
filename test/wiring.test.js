import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, readdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { join } from 'node:path'

/**
 * The host entry (`index.js`) names helpers from every `src/*.js` module. A name
 * it forgot to import is not a type error and no unit test touches `index.js`
 * (it needs host packages), so it only shows up as "… is not defined" the first
 * time the matching tool or route runs — which is exactly how `memory_reconcile`
 * shipped broken in 2.9.0. This test is the missing link: every exported name the
 * entry uses must be in an import list (or declared locally).
 */
const ROOT = fileURLToPath(new URL('..', import.meta.url))

const EXPORTED = /export\s+(?:async\s+)?(?:function|const|class|let)\s+([A-Za-z_$][\w$]*)/g
const IMPORTED = /import\s*\{([^}]*)\}\s*from\s*'\.\/src\/[^']+'/g
const DECLARED = /(?:^|\n)\s*(?:async\s+)?(?:function|const|let|class)\s+([A-Za-z_$][\w$]*)/g

function namesFrom(text, pattern) {
  const names = new Set()
  let match
  while ((match = pattern.exec(text))) {
    for (const raw of match[1].split(',')) {
      const name = raw.trim().split(/\s+as\s+/).pop().trim()
      if (name) names.add(name)
    }
  }
  return names
}

test('every src export index.js uses is imported there', () => {
  const entry = readFileSync(join(ROOT, 'index.js'), 'utf8')
  const available = new Set([...namesFrom(entry, IMPORTED), ...namesFrom(entry, DECLARED)])
  const offenders = []
  for (const file of readdirSync(join(ROOT, 'src')).sort()) {
    if (!file.endsWith('.js')) continue
    const exported = new Set()
    let match
    const pattern = new RegExp(EXPORTED.source, 'g')
    const text = readFileSync(join(ROOT, 'src', file), 'utf8')
    while ((match = pattern.exec(text))) exported.add(match[1])
    for (const name of exported) {
      const escaped = name.replace(/\$/g, '\\$')
      // Only a call site counts: a bare mention can be a comment, a string or an
      // object key, and pinning those would make this test noisy instead of useful.
      const used = new RegExp(`(?<![.\\w$])${escaped}\\s*\\(`).test(entry)
      if (used && !available.has(name)) {
        offenders.push(`index.js calls ${name}() (from src/${file}) without importing it`)
      }
    }
  }
  assert.deepEqual(offenders, [])
})
