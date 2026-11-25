import test from 'node:test'
import assert from 'node:assert/strict'
import { join } from 'node:path'
import {
  COMPONENT_ORDER,
  componentRows,
  ffmpegComponentRow,
  ghComponentRow,
  managedComponentRow,
} from '../src/component-rows.js'

const ROOT = 'D:/tools'

function ghStatus(overrides) {
  return {
    id: 'gh',
    name: 'GitHub CLI',
    version: '2.76.2',
    supported: true,
    state: 'installed',
    installed: true,
    system: false,
    systemPath: null,
    binaryPath: join(ROOT, 'gh', 'bin', 'gh.exe'),
    sourceKind: 'managed',
    received: 0,
    total: null,
    percent: null,
    error: null,
    installDir: join(ROOT, 'gh'),
    ...(overrides || {}),
  }
}

function managedStatus(id, overrides) {
  const source = id === 'comfyui' || id === 'comfy-mcp'
  const version = id === 'python' ? '3.11.18' : id === 'comfyui' ? '0.46.0' : id === 'comfy-mcp' ? 'commit 6c43880' : '2.56.1'
  return {
    id,
    name: id === 'python' ? 'Python' : id === 'comfyui' ? 'ComfyUI' : id === 'comfy-mcp' ? 'ComfyUI MCP' : 'git',
    version,
    state: 'installed',
    supported: true,
    installed: true,
    system: false,
    systemPath: null,
    // A source tree reports its install root; a compiled component its binary.
    binaryPath: source
      ? join(ROOT, id)
      : id === 'python' ? join(ROOT, 'python', 'python.exe') : join(ROOT, 'git', 'cmd', 'git.exe'),
    sourceKind: 'managed',
    toolVersion: source ? null : id === 'python' ? '3.11.18' : '2.56.1.windows.1',
    received: 0,
    total: null,
    percent: null,
    error: null,
    installDir: join(ROOT, id),
    ...(overrides || {}),
  }
}

function ffmpegStatus(overrides) {
  return {
    supported: true,
    platform: 'win32',
    arch: 'x64',
    state: 'installed',
    version: '7.1.1',
    ffmpeg: { path: join(ROOT, 'ffmpeg', 'bin', 'ffmpeg.exe'), managed: true, version: '7.1.1' },
    ffprobe: { path: join(ROOT, 'ffmpeg', 'bin', 'ffprobe.exe'), managed: true, version: '7.1.1' },
    download: { running: false, received: 0, total: null, percent: null, error: null },
    ...(overrides || {}),
  }
}

test('the panel order is GitHub CLI, git, ffmpeg, Python and the two source trees', () => {
  assert.deepEqual(COMPONENT_ORDER, ['gh', 'git', 'ffmpeg', 'python', 'comfyui', 'comfy-mcp'])
  const rows = componentRows(ROOT, {
    gh: ghStatus({ id: 'gh' }),
    git: managedStatus('git'),
    ffmpeg: ffmpegStatus(),
    python: managedStatus('python'),
    comfyui: managedStatus('comfyui'),
    'comfy-mcp': managedStatus('comfy-mcp'),
  })
  assert.deepEqual(rows.map((row) => row.id), ['gh', 'git', 'ffmpeg', 'python', 'comfyui', 'comfy-mcp'])
  // A status the host could not read simply drops its row.
  assert.deepEqual(componentRows(ROOT, { gh: ghStatus() }).map((row) => row.id), ['gh'])
})

test('a source tree row has no binary, points at its install root and keeps its pin', () => {
  const installed = managedComponentRow(managedStatus('comfyui'))
  assert.equal(installed.id, 'comfyui')
  assert.equal(installed.name, 'ComfyUI')
  assert.equal(installed.state, 'installed')
  assert.equal(installed.ready, true)
  assert.equal(installed.managed, true)
  assert.equal(installed.system, false)
  assert.equal(installed.path, join(ROOT, 'comfyui'), 'the install root, not a marker file')
  assert.equal(installed.version, '0.46.0')
  assert.equal(installed.toolVersion, null, 'nothing to probe, so no detected version')
  assert.equal(installed.tools, null)

  // Pinned by commit, the version line says so instead of inventing a tag.
  const mcp = managedComponentRow(managedStatus('comfy-mcp'))
  assert.equal(mcp.version, 'commit 6c43880')
  assert.equal(mcp.path, join(ROOT, 'comfy-mcp'))

  const missing = managedComponentRow(managedStatus('comfyui', {
    state: 'missing',
    installed: false,
    binaryPath: null,
    toolVersion: null,
  }))
  assert.equal(missing.ready, false)
  assert.equal(missing.path, null)
  assert.equal(missing.version, '0.46.0', 'the pin stays visible before the install')
})

test('a managed install is ready, managed and points at its own binary', () => {
  const row = ghComponentRow(ghStatus())
  assert.equal(row.state, 'installed')
  assert.equal(row.ready, true)
  assert.equal(row.managed, true)
  assert.equal(row.system, false)
  assert.equal(row.running, false)
  assert.equal(row.path, join(ROOT, 'gh', 'bin', 'gh.exe'))
  assert.equal(row.version, '2.76.2')
  assert.equal(row.toolVersion, null)
  assert.equal(row.installDir, join(ROOT, 'gh'))
  assert.equal(row.tools, null)
})

test('a PATH copy is a system install that still counts as ready', () => {
  const row = managedComponentRow(managedStatus('git', {
    state: 'system',
    installed: false,
    system: true,
    sourceKind: 'system',
    binaryPath: 'C:/Program Files/Git/cmd/git.exe',
    toolVersion: '2.56.1.windows.1',
  }))
  assert.equal(row.state, 'system')
  assert.equal(row.ready, true)
  assert.equal(row.managed, false)
  assert.equal(row.system, true)
  assert.equal(row.path, 'C:/Program Files/Git/cmd/git.exe')
  assert.equal(row.toolVersion, '2.56.1.windows.1')
})

test('a missing component has no path and is not ready', () => {
  const row = managedComponentRow(managedStatus('python', {
    state: 'missing',
    installed: false,
    binaryPath: null,
    toolVersion: null,
  }))
  assert.equal(row.state, 'missing')
  assert.equal(row.ready, false)
  assert.equal(row.path, null)
  assert.equal(row.version, '3.11.18', 'the pinned version stays visible')
  assert.equal(row.supported, true)
})

test('a download in flight reports progress and the running flag', () => {
  const row = managedComponentRow(managedStatus('python', {
    state: 'downloading',
    installed: false,
    binaryPath: null,
    received: 512,
    total: 1024,
    percent: 50,
  }))
  assert.equal(row.running, true)
  assert.equal(row.ready, false)
  assert.equal(row.percent, 50)
})

test('ffmpeg keeps both binaries and the state of the pair', () => {
  const installed = ffmpegComponentRow(ROOT, ffmpegStatus())
  assert.equal(installed.id, 'ffmpeg')
  assert.equal(installed.name, 'ffmpeg')
  assert.equal(installed.state, 'installed')
  assert.equal(installed.ready, true)
  assert.equal(installed.managed, true)
  assert.equal(installed.system, false)
  assert.equal(installed.path, join(ROOT, 'ffmpeg', 'bin', 'ffmpeg.exe'))
  assert.equal(installed.toolVersion, '7.1.1')
  assert.equal(installed.version, null)
  assert.equal(installed.installDir, join(ROOT, 'ffmpeg'))
  assert.deepEqual(installed.tools.map((tool) => tool.name), ['ffmpeg', 'ffprobe'])
  assert.deepEqual(installed.tools.map((tool) => tool.managed), [true, true])

  // A PATH pair is a system install; one managed binary makes it managed.
  const system = ffmpegComponentRow(ROOT, ffmpegStatus({
    ffmpeg: { path: 'C:/ffmpeg/bin/ffmpeg.exe', managed: false, version: '7.0' },
    ffprobe: { path: 'C:/ffmpeg/bin/ffprobe.exe', managed: false, version: '7.0' },
  }))
  assert.equal(system.system, true)
  assert.equal(system.managed, false)

  // A running download shows its percentage and error, if any.
  const running = ffmpegComponentRow(ROOT, ffmpegStatus({
    state: 'missing',
    ffmpeg: null,
    ffprobe: null,
    version: null,
    download: { running: true, received: 5, total: 10, percent: 50, error: 'stalled' },
  }))
  assert.equal(running.running, true)
  assert.equal(running.percent, 50)
  assert.equal(running.error, 'stalled')
  assert.equal(running.path, null)
  // A missing binary still gets a row: the pair stays visible, marked missing.
  assert.deepEqual(running.tools.map((tool) => [tool.name, tool.path, tool.managed]), [
    ['ffmpeg', null, false],
    ['ffprobe', null, false],
  ])
  assert.equal(running.managed, false)
  assert.equal(running.system, false)
})

test('one missing binary does not hide the other from the row', () => {
  const row = ffmpegComponentRow(ROOT, ffmpegStatus({
    state: 'partial',
    version: null,
    ffmpeg: { path: join(ROOT, 'ffmpeg', 'bin', 'ffmpeg.exe'), managed: true, version: '7.1.1' },
    ffprobe: null,
  }))
  assert.equal(row.state, 'partial')
  assert.equal(row.ready, false)
  assert.equal(row.path, join(ROOT, 'ffmpeg', 'bin', 'ffmpeg.exe'))
  assert.deepEqual(row.tools.map((tool) => [tool.name, Boolean(tool.path)]), [
    ['ffmpeg', true],
    ['ffprobe', false],
  ])
  // Only a full pair counts as a managed / system install.
  assert.equal(row.managed, true, 'the managed copy is reported')
  assert.equal(row.system, false)
})

test('an unsupported platform is reported as unsupported, not missing', () => {
  const row = managedComponentRow(managedStatus('git', {
    state: 'missing',
    supported: false,
    installed: false,
    binaryPath: null,
    toolVersion: null,
  }))
  assert.equal(row.supported, false)
  assert.equal(row.state, 'missing')
  assert.equal(row.ready, false)
})
