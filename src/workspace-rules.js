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

/** Missing or unreadable files read as empty rules, exactly like the global file. */
export function readWorkspaceRules(workspace) {
  const file = workspaceRulesPath(workspace)
  let text = ''
  let exists = false
  if (existsSync(file)) {
    try {
      text = readFileSync(file, 'utf8').replace(/^\uFEFF/, '')
      exists = true
    } catch {
      exists = false
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
 * Save one registered workspace's rules. Returns the refreshed workspace
 * payload so the client can clear its dirty state without a second read.
 */
export function saveWorkspaceRules(home, id, value) {
  const workspace = findWorkspace(home, id)
  if (workspace === undefined) {
    const error = new Error('unknown workspace: it is not in the workspace registry')
    error.status = 404
    throw error
  }
  // Validation happens before the write, so an oversized draft leaves the
  // file untouched and the route answers 413.
  writeText(workspaceRulesPath(workspace), normalizeRulesText(value))
  return workspacePayload(workspace)
}
