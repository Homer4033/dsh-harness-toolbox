import test from 'node:test'
import assert from 'node:assert/strict'
import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import {
  COMPONENTS,
  COMPONENT_IDS,
  archiveTree,
  componentAsset,
  componentBinDirs,
  componentBinaryPath,
  componentDownloadRunning,
  componentEntryPath,
  componentRoot,
  componentSpec,
  componentStatus,
  parseComponentVersion,
  prependComponentPath,
  startComponentDownload,
  systemComponentFile,
} from '../src/components.js'

function tempDir() {
  return mkdtempSync(join(tmpdir(), 'compression-tiers-components-'))
}

/** A file at `path` that looks like a staged binary. */
function touch(path) {
  mkdirSync(dirname(path), { recursive: true })
  writeFileSync(path, 'binary')
  return path
}

/** Stand-in for `runCommand` that answers `--version` for git and Python. */
function versionRun() {
  return async (command) => ({
    code: 0,
    stdout: command.includes('python') ? 'Python 3.11.18\n' : 'git version 2.56.1.windows.1\n',
    stderr: '',
  })
}

test('git and Python are compiled components; ComfyUI and its MCP server are source trees', () => {
  assert.deepEqual(COMPONENT_IDS, ['git', 'python', 'comfyui', 'comfy-mcp'])
  assert.equal(componentSpec('git').name, 'git')
  assert.equal(componentSpec('python').name, 'Python')
  assert.equal(componentSpec('comfyui').name, 'ComfyUI')
  assert.equal(componentSpec('comfy-mcp').name, 'ComfyUI MCP')
  assert.equal(componentSpec('nope'), null)
  assert.deepEqual(Object.keys(COMPONENTS).sort(), ['comfy-mcp', 'comfyui', 'git', 'python'])
  // All four install below the shared download root, in their own directory.
  assert.equal(componentRoot('D:/tools', 'git'), join('D:/tools', 'git'))
  assert.equal(componentRoot('D:/tools', 'python'), join('D:/tools', 'python'))
  assert.equal(componentRoot('D:/tools', 'comfyui'), join('D:/tools', 'comfyui'))
  assert.equal(componentRoot('D:/tools', 'comfy-mcp'), join('D:/tools', 'comfy-mcp'))
})

test('the pinned release assets are the official per-platform archives', () => {
  const gitX64 = componentAsset('git', 'win32', 'x64')
  assert.equal(gitX64.file, 'MinGit-2.56.1-64-bit.zip')
  assert.equal(gitX64.kind, 'zip')
  assert.equal(
    gitX64.url,
    'https://github.com/git-for-windows/git/releases/download/v2.56.1.windows.1/MinGit-2.56.1-64-bit.zip',
  )
  assert.equal(componentAsset('git', 'win32', 'arm64').file, 'MinGit-2.56.1-arm64.zip')
  // MinGit ships no Linux build, so those hosts get no managed install.
  assert.equal(componentAsset('git', 'linux', 'x64'), null)

  const python = componentAsset('python', 'win32', 'x64')
  assert.equal(python.file, 'cpython-3.11.18+20261110-x86_64-pc-windows-msvc-install_only.tar.gz')
  assert.equal(python.kind, 'tar.gz')
  // The `+` of the release file name stays percent-encoded in the URL.
  assert.match(python.url, /cpython-3\.11\.18%2B20261110-x86_64-pc-windows-msvc-install_only\.tar\.gz$/)
  assert.match(python.url, /^https:\/\/github\.com\/astral-sh\/python-build-standalone\/releases\/download\/20261110\//)
  assert.equal(componentAsset('python', 'win32', 'arm64'), null)
})

test('the source trees are Git archives, the same bytes on every platform', () => {
  const comfyui = componentAsset('comfyui', 'win32', 'x64')
  assert.equal(comfyui.file, 'ComfyUI-v0.46.0.zip')
  assert.equal(comfyui.kind, 'zip')
  assert.equal(comfyui.archiveTree, true, 'GitHub wraps the tree in an extra directory')
  assert.equal(comfyui.url, 'https://github.com/Comfy-Org/ComfyUI/archive/refs/tags/v0.46.0.zip')
  // No platform-specific build: the archive is the same everywhere.
  assert.deepEqual(componentAsset('comfyui', 'linux', 'x64'), comfyui)
  assert.deepEqual(componentAsset('comfyui', 'darwin', 'arm64'), comfyui)

  // The MCP server has no release, so the pin is a commit.
  const mcp = componentAsset('comfy-mcp', 'win32', 'x64')
  assert.equal(mcp.file, 'comfy-mcp-6c43880.zip')
  assert.equal(mcp.archiveTree, true)
  assert.equal(
    mcp.url,
    'https://github.com/Comfy-Org/comfy-mcp/archive/6c438809aca588e9b1cf31ab023d148399338d10.zip',
  )
  assert.equal(componentSpec('comfy-mcp').version, 'commit 6c43880')
  assert.equal(componentSpec('comfyui').version, '0.46.0')
})

test('a source tree is checked by its marker and puts nothing on PATH', () => {
  assert.equal(componentBinaryPath('D:/tools', 'comfyui'), null)
  assert.deepEqual(componentBinDirs('D:/tools', 'comfyui'), [])
  assert.equal(componentEntryPath('D:/tools', 'comfyui'), join('D:/tools', 'comfyui', 'main.py'))
  assert.equal(componentEntryPath('D:/tools', 'comfy-mcp'), join('D:/tools', 'comfy-mcp', 'pyproject.toml'))
  // A compiled component's entry is still the binary the probe runs.
  assert.equal(componentEntryPath('D:/tools', 'git'), join('D:/tools', 'git', 'cmd', 'git.exe'))
  assert.equal(componentEntryPath('D:/tools', 'nope'), null)
  // Nothing to run means nothing to parse, and nothing to add to PATH.
  assert.equal(parseComponentVersion('comfyui', 'anything'), null)
  assert.equal(prependComponentPath('D:/tools', 'comfyui', 'win32'), false)
})

test('the Git-archive wrapper directory is dropped, an unexpected layout is not', () => {
  const dir = tempDir()
  try {
    const nested = join(dir, 'nested')
    mkdirSync(join(nested, 'ComfyUI-0.46.0'), { recursive: true })
    writeFileSync(join(nested, 'ComfyUI-0.46.0', 'main.py'), '')
    assert.equal(archiveTree(nested, { archiveTree: true }), join(nested, 'ComfyUI-0.46.0'))
    // A release archive is not wrapped and keeps its extraction root.
    assert.equal(archiveTree(nested, { archiveTree: false }), nested)
    // Two entries mean the wrapper cannot be identified: leave it alone, so the
    // marker check reports the real problem instead of a nested install.
    const flat = join(dir, 'flat')
    mkdirSync(join(flat, 'a'), { recursive: true })
    writeFileSync(join(flat, 'README.md'), '')
    assert.equal(archiveTree(flat, { archiveTree: true }), flat)
    // A missing extraction root is not an error here.
    assert.equal(archiveTree(join(dir, 'gone'), { archiveTree: true }), join(dir, 'gone'))
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})

test('each component knows its binary and the directories that go on PATH', () => {
  assert.equal(componentBinaryPath('D:/tools', 'git'), join('D:/tools', 'git', 'cmd', 'git.exe'))
  assert.equal(componentBinaryPath('D:/tools', 'python'), join('D:/tools', 'python', 'python.exe'))
  assert.equal(componentBinaryPath('D:/tools', 'nope'), null)
  assert.deepEqual(componentBinDirs('D:/tools', 'git'), [join('D:/tools', 'git', 'cmd')])
  // Python keeps the interpreter and its console scripts in two directories.
  assert.deepEqual(componentBinDirs('D:/tools', 'python'), [
    join('D:/tools', 'python'),
    join('D:/tools', 'python', 'Scripts'),
  ])
  assert.deepEqual(componentBinDirs('D:/tools', 'nope'), [])
})

test('systemComponentFile looks on PATH without running anything', () => {
  const dir = tempDir()
  try {
    const bin = touch(join(dir, 'git.exe'))
    assert.equal(systemComponentFile('git.exe', 'win32', ['D:/nope', dir].join(';')), bin)
    assert.equal(systemComponentFile('git.exe', 'win32', 'D:/nope'), null)
    assert.equal(systemComponentFile('git.exe', 'win32', ''), null)
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})

test('parseComponentVersion reads the version line of each component', () => {
  assert.equal(parseComponentVersion('git', 'git version 2.56.1.windows.1\n'), '2.56.1.windows.1')
  assert.equal(parseComponentVersion('python', 'Python 3.11.18\n'), '3.11.18')
  assert.equal(parseComponentVersion('python', 'garbage'), null)
  assert.equal(parseComponentVersion('nope', 'git version 1.0'), null)
})

test('an untouched root reports every component missing', async () => {
  const root = tempDir()
  try {
    for (const id of COMPONENT_IDS) {
      const status = await componentStatus(root, id, { platform: 'win32', arch: 'x64', envPath: '', run: versionRun() })
      assert.equal(status.state, 'missing')
      assert.equal(status.supported, true)
      assert.equal(status.installed, false)
      assert.equal(status.system, false)
      assert.equal(status.binaryPath, null)
      assert.equal(status.toolVersion, null)
      assert.equal(status.error, null)
      assert.equal(status.installDir, componentRoot(root, id))
      assert.equal(componentDownloadRunning(root, id), false)
    }
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
})

test('a managed copy reports its binary, version and installed state', async () => {
  const root = tempDir()
  try {
    touch(componentBinaryPath(root, 'git'))
    const status = await componentStatus(root, 'git', { platform: 'win32', arch: 'x64', envPath: '', run: versionRun() })
    assert.equal(status.state, 'installed')
    assert.equal(status.sourceKind, 'managed')
    assert.equal(status.binaryPath, componentBinaryPath(root, 'git'))
    assert.equal(status.toolVersion, '2.56.1.windows.1')
    assert.equal(status.installed, true)
    assert.equal(status.system, false)
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
})

test('a source tree is installed when its marker is there, never as a PATH copy', async () => {
  const root = tempDir()
  const bin = tempDir()
  try {
    const marker = join(componentRoot(root, 'comfyui'), 'main.py')
    mkdirSync(dirname(marker), { recursive: true })
    writeFileSync(marker, '')
    const status = await componentStatus(root, 'comfyui', {
      platform: 'win32',
      arch: 'x64',
      envPath: [bin, 'D:/nope'].join(';'),
      run: versionRun(),
    })
    assert.equal(status.state, 'installed')
    assert.equal(status.installed, true)
    assert.equal(status.system, false)
    assert.equal(status.sourceKind, 'managed')
    // The row points at the install root; there is no binary to show.
    assert.equal(status.binaryPath, componentRoot(root, 'comfyui'))
    assert.equal(status.toolVersion, null, 'a source tree has no version line to probe')

    // A Python on PATH must not make an uninstalled MCP tree look ready.
    touch(join(bin, 'python.exe'))
    const missing = await componentStatus(root, 'comfy-mcp', {
      platform: 'win32',
      arch: 'x64',
      envPath: [bin].join(';'),
      run: versionRun(),
    })
    assert.equal(missing.state, 'missing')
    assert.equal(missing.system, false)
    assert.equal(missing.binaryPath, null)
    assert.equal(missing.version, 'commit 6c43880', 'the pin stays visible')
  } finally {
    rmSync(root, { recursive: true, force: true })
    rmSync(bin, { recursive: true, force: true })
  }
})

test('a PATH copy is reported as a system install', async () => {
  const root = tempDir()
  const bin = tempDir()
  try {
    const system = touch(join(bin, 'python.exe'))
    const status = await componentStatus(root, 'python', {
      platform: 'win32',
      arch: 'x64',
      envPath: [bin, 'D:/nope'].join(';'),
      run: versionRun(),
    })
    assert.equal(status.state, 'system')
    assert.equal(status.system, true)
    assert.equal(status.sourceKind, 'system')
    assert.equal(status.binaryPath, system)
    assert.equal(status.toolVersion, '3.11.18')
  } finally {
    rmSync(root, { recursive: true, force: true })
    rmSync(bin, { recursive: true, force: true })
  }
})
test('a leftover .part file is an incomplete download that can resume', async () => {
  const root = tempDir()
  try {
    const asset = componentAsset('git', 'win32', 'x64')
    const part = join(componentRoot(root, 'git'), 'download', `${asset.file}.part`)
    mkdirSync(dirname(part), { recursive: true })
    writeFileSync(part, 'x'.repeat(64))
    const status = await componentStatus(root, 'git', { platform: 'win32', arch: 'x64', envPath: '', run: versionRun() })
    assert.equal(status.state, 'partial')
    assert.equal(status.installed, false)
    assert.equal(status.received, 64)
    assert.equal(status.percent, null)
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
})

test('the managed directories go first on PATH exactly once', () => {
  const root = tempDir()
  const saved = process.env.PATH
  try {
    assert.equal(prependComponentPath(root, 'python', 'win32'), false, 'no binary, no PATH entry')
    assert.equal(prependComponentPath(root, 'nope', 'win32'), false)
    touch(componentBinaryPath(root, 'python'))
    process.env.PATH = 'C:\\Windows;C:\\Other'
    assert.equal(prependComponentPath(root, 'python', 'win32'), true)
    const expected = [
      join(root, 'python'),
      join(root, 'python', 'Scripts'),
      'C:\\Windows',
      'C:\\Other',
    ]
    assert.deepEqual(process.env.PATH.split(';'), expected)
    // A second install must not add the same directories again.
    assert.equal(prependComponentPath(root, 'python', 'win32'), true)
    assert.deepEqual(process.env.PATH.split(';'), expected)
  } finally {
    process.env.PATH = saved
    rmSync(root, { recursive: true, force: true })
  }
})

test('starting an install rejects an unknown component or a platform without a build', async () => {
  const root = tempDir()
  try {
    await assert.rejects(() => startComponentDownload(root, 'nope'), /unknown component/)
    await assert.rejects(
      () => startComponentDownload(root, 'python', { platform: 'linux', arch: 'x64' }),
      /no managed build/,
    )
    // A rejected start leaves no job behind: the page keeps offering the button.
    assert.equal(componentDownloadRunning(root, 'python'), false)
    assert.equal(existsSync(componentRoot(root, 'python')), false)
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
})
