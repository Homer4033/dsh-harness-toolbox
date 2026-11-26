import test from 'node:test'
import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const read = (path) => readFileSync(join(root, path), 'utf8')
const manifest = JSON.parse(read('package.json'))

test('the bundle manifest declares the patch, client and locale exports', () => {
  assert.equal(manifest.name, 'dsh-harness-toolbox')
  assert.equal(manifest.type, 'module')
  assert.equal(manifest.dsh.bundle.patch, './cordis.patch.yml')
  assert.equal(manifest.dsh.client.platform, 'web')
  // The client renders into the sidebar, its main panel and the composer dock.
  for (const client of [
    '@deepseek-ai/dsh-client-ui-layout',
    '@deepseek-ai/dsh-client-ui-sidebar',
    '@deepseek-ai/dsh-client-ui-conversation',
  ]) {
    assert.ok(manifest.dsh.client.inject.includes(client), `client inject is missing ${client}`)
  }
  assert.equal(manifest.exports['.'], './index.js')
  assert.equal(manifest.exports['./client'], './client.js')
  for (const entry of ['index.js', 'client.js', 'src', 'vendor', 'cordis.patch.yml', 'locale/*.json', 'docs', 'icon.svg', 'NOTICE', 'THIRD_PARTY_NOTICES.md']) {
    assert.ok(manifest.files.includes(entry), `files is missing ${entry}`)
  }
  assert.equal(manifest.license, 'GPL-3.0-only')
  assert.ok(existsSync(join(root, 'NOTICE')), 'the upstream and derivative notice is shipped')
  assert.ok(existsSync(join(root, 'THIRD_PARTY_NOTICES.md')), 'the upstream third-party notices are shipped')
  assert.ok(statSync(join(root, 'NOTICE')).size > 1000)
})

test('the patch inserts this bundle by its package name', () => {
  const patch = read('cordis.patch.yml')
  assert.match(patch, /- insert:/)
  assert.match(patch, /id: compression-tiers/)
  assert.match(patch, new RegExp(`name: ${manifest.name}`))
})

test('both locales carry display metadata and a real detail document', () => {
  for (const [locale, detail, contents] of [
    ['en', 'docs/DETAIL.md', '## Table of contents'],
    ['zh', 'docs/DETAIL.zh.md', '## 目录'],
  ]) {
    const data = JSON.parse(read(`locale/${locale}.json`))
    assert.ok(data.meta.title.length > 0)
    assert.ok(data.meta.description.length > 40)
    assert.equal(data.meta.detail, detail)
    assert.ok(existsSync(join(root, detail)), `${detail} is missing`)
    // The detail page is a small document, not a single screenshot: a contents
    // block, several sections, real prose and images that are actually shipped.
    const text = read(detail)
    assert.ok(text.includes(contents), `${detail} has no contents block`)
    const heads = text.split(/\r?\n/).filter((line) => /^##\s+/.test(line))
    assert.ok(heads.length >= 5, `${detail} needs its own sections, got ${heads.length}`)
    const anchors = [...text.matchAll(/^\s*[-*]\s+\[[^\]]+\]\(#([^)]+)\)/gm)].map((match) => match[1])
    assert.ok(anchors.length >= 5, `${detail} must link its sections from the contents block`)
    for (const image of text.matchAll(/!\[[^\]]*\]\(([^)]+)\)/g)) {
      assert.ok(existsSync(join(root, dirname(detail), image[1])), `${image[1]} is missing`)
    }
    const body = text.split(/\r?\n/).filter((line) => {
      const value = line.trim()
      if (!value) return false
      if (/^#{1,6}\s/.test(value)) return false
      if (/^!\[/.test(value)) return false
      if (/^\|?\s*:?-{3,}/.test(value)) return false
      if (/^<\/?p\b/.test(value)) return false
      return true
    })
    assert.ok(body.length > 25, `${detail} needs real prose next to the pictures, got ${body.length} lines`)
  }
})

test('the icon is a small valid SVG inside the package', () => {
  const path = join(root, 'icon.svg')
  assert.ok(existsSync(path))
  assert.ok(statSync(path).size < 256 * 1024)
  assert.match(read('icon.svg').trim(), /^<svg[\s>]/)
})

test('the client module registers under the package name', () => {
  const client = read('client.js')
  assert.match(client, /window\.__ModuleLoader__\.load\(/)
  assert.match(client, new RegExp(`id: '${manifest.name}'`))
  // The toolbox is a sidebar panel plus its main panel; the old Settings
  // section must not come back.
  assert.match(client, /sidebar\.panellist/)
  assert.match(client, /name: 'main'/)
  assert.doesNotMatch(client, /settings\.section/)
  assert.match(client, /ctx\.locale\.register/)
})

test('every JavaScript file parses', () => {
  const files = ['index.js', 'client.js']
  for (const dir of ['src', 'test']) {
    for (const name of readdirSync(join(root, dir))) {
      if (name.endsWith('.js')) files.push(join(dir, name))
    }
  }
  for (const file of files) {
    execFileSync(process.execPath, ['--check', join(root, file)], { stdio: 'pipe' })
  }
})
