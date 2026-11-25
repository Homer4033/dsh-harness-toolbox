import { existsSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { writeText } from './store.js'

/**
 * Global rules. The official `dsh-agent-instructions` plugin injects
 * `$DSH_HOME/AGENTS.md` into every session, so the settings page edits that
 * same file instead of keeping a second copy. This module owns the path, a
 * defensive read, a validated atomic write, and the bounded prompt clip.
 *
 * Merged in from `homerdsh-workbench`, which exposed the same textarea; the
 * workbench's separate `homerdsh/settings.json` copy never existed, the file
 * is the state.
 */

export const RULES_FILE = 'AGENTS.md'
/** Hard ceiling for one settings write; this file is human-authored rules. */
export const MAX_RULES_CHARS = 100_000
/** How much of the file the system prompt repeats; the official loader has the rest. */
export const PROMPT_CLIP_CHARS = 2000

export function rulesPath(home) {
  return join(home, RULES_FILE)
}

function countLines(text) {
  if (!text) return 0
  return text.replace(/\n$/, '').split('\n').length
}

/**
 * Missing, unreadable or unparseable files all read as empty rules so the
 * settings page stays usable; saving replaces the content.
 */
export function readRules(home) {
  const path = rulesPath(home)
  if (!existsSync(path)) {
    return { path, exists: false, text: '', chars: 0, lines: 0, updatedAt: null }
  }
  let text
  try {
    // Hand edits often carry a UTF-8 BOM; hide it instead of showing it. Line
    // endings are normalized on read as well: the panel compares the editor to
    // this text, and a textarea hands back LF, so a CRLF file would otherwise
    // look edited the moment it is loaded.
    text = readFileSync(path, 'utf8').replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n')
  } catch {
    return { path, exists: false, text: '', chars: 0, lines: 0, updatedAt: null, unreadable: true }
  }
  let updatedAt = null
  try {
    updatedAt = statSync(path).mtime.toISOString()
  } catch {
    // The file can disappear between the read and the stat; the text still counts.
  }
  return { path, exists: true, text, chars: text.length, lines: countLines(text), updatedAt }
}

/**
 * Strict input parser for the HTTP write: only a string is accepted, a BOM is
 * dropped, CRLF is normalized to LF (the repository standard), the size is
 * capped, and exactly one trailing newline is kept so git diffs stay quiet.
 */
export function normalizeRulesText(value) {
  if (typeof value !== 'string') throw new Error('rules must be a string')
  const text = value.replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n')
  if (text.length > MAX_RULES_CHARS) {
    const error = new Error(`rules must be at most ${MAX_RULES_CHARS} characters (got ${text.length})`)
    error.status = 413
    throw error
  }
  if (text === '') return ''
  return text.endsWith('\n') ? text : `${text}\n`
}

export function saveRules(home, value) {
  writeText(rulesPath(home), normalizeRulesText(value))
  return readRules(home)
}

/** Bounded, trimmed excerpt for the system prompt; empty rules yield ''. */
export function clipRules(text, limit = PROMPT_CLIP_CHARS) {
  const clean = String(text === undefined || text === null ? '' : text).trim()
  if (!clean) return ''
  if (clean.length <= limit) return clean
  return `${clean.slice(0, limit).trimEnd()}\n…`
}

/** Agent-facing prompt section: where the file is and the newest clip. */
export function rulesPromptBlock(home) {
  const rules = readRules(home)
  const clip = clipRules(rules.text)
  if (!clip) {
    return `Global rules: none yet. The file is ${rules.path}; edit it under Settings → Context compression → Global rules.`
  }
  return `Global rules (human-authored contract at ${rules.path}). The official instruction loader injects this file; the bounded clip below keeps a just-saved rule visible before the next session reloads it:\n${clip}`
}
