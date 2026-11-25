import { existsSync, readFileSync } from 'node:fs'
import { isAbsolute, join } from 'node:path'
import { MAX_RULES_CHARS, normalizeRulesText } from './rules.js'
import { writeText } from './store.js'

/**
 * Workspace rules. Each registered workspace keeps its own `AGENTS.md` at the
 * workspace root, which the official instruction loader reads for sessions in
 * that workspace. The block only ever touches a workspace the registry already
 * names: the registry is the allow list, so no path from the client is trusted.
 *
 * The panel does not own that whole file. It owns one fenced supplement, which
 * it keeps at the very top of the file so the reader and the loader both see it
 * first; everything below the fence is somebody else's text and stays byte for
 * byte (modulo the CRLF/BOM normalization both rules writers share). Reading
 * strips the fence and returns only the supplement, so a workspace's own
 * `AGENTS.md` never shows up in the panel.
 *
 * The registry itself belongs to the official workspace service
 * (`$DSH_HOME/storages/workspace.json`); this module only reads it and never
 * writes it.
 */

/** Registry file of the official workspace service, relative to the DSH home. */
export const WORKSPACE_REGISTRY = ['storages', 'workspace.json']
/** Rules file inside one workspace root. */
export const WORKSPACE_RULES_FILE = 'AGENTS.md'
/** A typo in the registry must not turn the panel into an endless list. */
export const MAX_WORKSPACES = 50
/**
 * Fence of the supplement the panel owns. The markers are HTML comments, so
 * they render as nothing in every Markdown viewer while staying greppable.
 */
export const WORKSPACE_BLOCK_START = '<!-- compression-tiers:workspace-rules:start -->'
export const WORKSPACE_BLOCK_END = '<!-- compression-tiers:workspace-rules:end -->'

export function workspaceRegistryPath(home) {
  return join(home, ...WORKSPACE_REGISTRY)
}

function readRegistry(home) {
  const path = workspaceRegistryPath(home)
  if (!existsSync(path)) return null
  try {
    const parsed = JSON.parse(readFileSync(path, 'utf8'))
    return parsed && typeof parsed === 'object' ? parsed : null
  } catch {
    // A hand-edited registry reads as "no workspaces": the block stays hidden
    // instead of the plugin throwing on every request.
    return null
  }
}

function workspaceRows(registry) {
  const tables = registry && typeof registry.tables === 'object' && registry.tables !== null
    ? registry.tables
    : null
  return tables && typeof tables.workspaces === 'object' && tables.workspaces !== null
    ? tables.workspaces
    : {}
}

/**
 * Registered workspaces in registry order, one entry per directory. Rows
 * without an absolute path are skipped: they cannot be edited safely, and the
 * sidebar would not show them either.
 */
export function listWorkspaces(home) {
  const registry = readRegistry(home)
  if (registry === null) return []
  const rows = workspaceRows(registry)
  const global = registry.global && typeof registry.global === 'object' ? registry.global : {}
  const ids = Array.isArray(global.workspaceIds) ? global.workspaceIds : Object.keys(rows)
  const list = []
  const seen = new Set()
  for (const id of ids) {
    const row = rows[String(id)]
    if (!row || typeof row !== 'object') continue
    const dir = typeof row.path === 'string' ? row.path.trim() : ''
    if (!dir || !isAbsolute(dir)) continue
    const key = process.platform === 'win32' ? dir.toLowerCase() : dir
    if (seen.has(key)) continue
    seen.add(key)
    list.push({
      id: String(id),
      title: typeof row.title === 'string' && row.title.trim() ? row.title.trim() : dir,
      path: dir,
    })
    if (list.length >= MAX_WORKSPACES) break
  }
  return list
}

/** The registered workspace with this id, or undefined when it is not listed. */
export function findWorkspace(home, id) {
  const wanted = String(id === undefined || id === null ? '' : id)
  if (!wanted) return undefined
  return listWorkspaces(home).find((workspace) => workspace.id === wanted)
}

export function workspaceRulesPath(workspace) {
  return join(workspace.path, WORKSPACE_RULES_FILE)
}

/** The shared reading normalization: no BOM, no CR, so offsets line up. */
function asSource(text) {
  return String(text === undefined || text === null ? '' : text)
    .replace(/^\uFEFF/, '')
    .replace(/\r\n?/g, '\n')
}

/** The supplement between the fences; empty when the file carries no block. */
export function extractWorkspaceBlock(text) {
  const source = asSource(text)
  const start = source.indexOf(WORKSPACE_BLOCK_START)
  if (start === -1) return ''
  const end = source.indexOf(WORKSPACE_BLOCK_END, start + WORKSPACE_BLOCK_START.length)
  if (end === -1) return ''
  return source
    .slice(start + WORKSPACE_BLOCK_START.length, end)
    .replace(/^\n+/, '')
    .replace(/\n+$/, '')
}

/** Everything the panel does not own: the file with the fenced block removed. */
export function stripWorkspaceBlock(text) {
  const source = asSource(text)
  const start = source.indexOf(WORKSPACE_BLOCK_START)
  if (start === -1) return source
  const end = source.indexOf(WORKSPACE_BLOCK_END, start + WORKSPACE_BLOCK_START.length)
  if (end === -1) return source
  const head = source.slice(0, start).replace(/\n+$/, '')
  const tail = source.slice(end + WORKSPACE_BLOCK_END.length).replace(/^\n+/, '')
  if (!head) return tail
  if (!tail) return head
  return `${head}\n\n${tail}`
}

/**
 * The file the panel would write: its fenced supplement first, then whatever
 * the file already carried. An empty supplement drops the fence, so clearing
 * the panel never leaves an empty marker pair behind.
 */
export function composeWorkspaceFile(text, supplement) {
  const body = String(supplement === undefined || supplement === null ? '' : supplement)
    .replace(/^\n+/, '')
    .replace(/\n+$/, '')
  const rest = stripWorkspaceBlock(text)
  const block = body ? `${WORKSPACE_BLOCK_START}\n${body}\n${WORKSPACE_BLOCK_END}` : ''
  const parts = [block, rest]
    .map((part) => part.replace(/\n+$/, ''))
    .filter((part) => part !== '')
  return parts.length === 0 ? '' : `${parts.join('\n\n')}\n`
}

/** Raw file text, for the read-modify-write of a save. */
function readWorkspaceFile(workspace) {
  const file = workspaceRulesPath(workspace)
  if (!existsSync(file)) return { exists: false, text: '' }
  return { exists: true, text: readFileSync(file, 'utf8') }
}

/**
 * Missing or unreadable files read as an empty supplement, exactly like the
 * global file; a file without the fence reads as an empty supplement too, even
 * though it may hold a lot of text the panel must not show.
 */
export function readWorkspaceRules(workspace) {
  const file = workspaceRulesPath(workspace)
  let text = ''
  let exists = false
  if (existsSync(file)) {
    try {
      text = extractWorkspaceBlock(readFileSync(file, 'utf8'))
      exists = true
    } catch {
      exists = false
      text = ''
    }
  }
  return { exists, file, text, chars: text.length }
}

/** One workspace as the panel renders it: identity, rules path and the text. */
export function workspacePayload(workspace) {
  const rules = readWorkspaceRules(workspace)
  return {
    id: workspace.id,
    title: workspace.title,
    path: workspace.path,
    file: rules.file,
    exists: rules.exists,
    text: rules.text,
    chars: rules.chars,
  }
}

/** Every registered workspace, read in registry order; empty hides the block. */
export function workspacesPayload(home) {
  return {
    ok: true,
    maxChars: MAX_RULES_CHARS,
    workspaces: listWorkspaces(home).map(workspacePayload),
  }
}

/**
 * Save the panel's supplement for one registered workspace. The rest of the
 * file is preserved: the old fenced block is removed and the new one goes in at
 * the top, and a workspace without an `AGENTS.md` gets the file created.
 */
export function saveWorkspaceRules(home, id, value) {
  const workspace = findWorkspace(home, id)
  if (workspace === undefined) {
    const error = new Error('unknown workspace: it is not in the workspace registry')
    error.status = 404
    throw error
  }
  // Validation happens before the read and the write, so an oversized draft
  // leaves the file untouched and the route answers 413.
  const supplement = normalizeRulesText(value).replace(/\n+$/, '')
  const current = readWorkspaceFile(workspace)
  const next = composeWorkspaceFile(current.text, supplement)
  // Clearing an editor for a workspace that has no file creates nothing: there
  // is no reason to leave an empty contract behind.
  if (next !== '' || current.exists) {
    writeText(workspaceRulesPath(workspace), next)
  }
  return workspacePayload(workspace)
}
