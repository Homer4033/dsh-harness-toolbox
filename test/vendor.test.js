import test from 'node:test'
import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import vm from 'node:vm'

/**
 * The vendored Obsidian Prism modules are UMD scripts, not ESM. The package is
 * `type: module`, so `require()` would treat them as ESM; evaluating the source
 * in a sandbox that carries `module.exports` is the closest thing to how the
 * browser loads them through the vendor route.
 */
const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const vendorDir = join(root, 'vendor', 'obsidian-prism')

function loadUmd(name, extra = {}) {
  const code = readFileSync(join(vendorDir, name), 'utf8')
  const sandbox = {
    module: { exports: {} },
    exports: {},
    console,
    Math,
    Date,
    Float32Array,
    Uint32Array,
    Uint8Array,
    Uint8ClampedArray,
    performance: { now: () => 0 },
    setTimeout,
    clearTimeout,
    ...extra,
  }
  sandbox.globalThis = sandbox
  vm.createContext(sandbox)
  vm.runInContext(code, sandbox)
  return sandbox.module.exports
}

test('the vendored optical modules carry provenance headers and still expose their API', () => {
  for (const name of ['vial-core.js', 'dual-mascot-rig.js']) {
    const path = join(vendorDir, name)
    assert.ok(existsSync(path), `${name} is shipped`)
    const source = readFileSync(path, 'utf8')
    assert.match(source, /Vendored from Obsidian Prism 1\.0\.8-beta\.1/)
    assert.match(source, /GPL-3\.0-only/)
    assert.match(source, /2026-11-25/)
  }
  const vial = loadUmd('vial-core.js')
  assert.equal(typeof vial.createWaterVialPhysics, 'function')
  assert.equal(typeof vial.mountPhysicalWaterVial, 'function')
  assert.equal(vial.WAVE_NODES, 24)
  assert.equal(typeof vial.createWaterVialPhysics({ fill: 0.4 }).step, 'function')

  const rig = loadUmd('dual-mascot-rig.js')
  assert.equal(typeof rig.mountDualMascotStage, 'function')
  // Cross-realm objects: compare the serialized value, not the prototype.
  assert.equal(JSON.stringify(rig.parseMascotSpec('minis')), JSON.stringify({ c: 1, k: 1, d: 0, w: 0, minis: true }))
  assert.equal(rig.encodeMascotSpec({ c: 1, k: 1, minis: true }), 'minis')
  assert.equal(rig.isValidMascotValue('off'), true)
  assert.equal(rig.isValidMascotValue('not-a-spec'), false)
  assert.equal(typeof rig.mascotArt.drawMainActor, 'function')
  assert.equal(existsSync(join(vendorDir, 'motion-engine.js')), false, 'the unused motion module is not shipped')
})

test('the horizon renderer is gone: the art backdrop is pure CSS now', () => {
  assert.equal(existsSync(join(vendorDir, 'horizon-glow.js')), false, 'the animated renderer is not shipped')
  const client = readFileSync(join(root, 'client.js'), 'utf8')
  assert.doesNotMatch(client, /__agHorizonGlow/)
  assert.doesNotMatch(client, /horizon-glow\.js/)
  // The two optical modules that remain still carry their provenance headers.
  for (const name of ['vial-core.js', 'dual-mascot-rig.js']) {
    const source = readFileSync(join(vendorDir, name), 'utf8')
    assert.match(source, /https:\/\/github\.com\/RMvdesi\/obsidian-prism/)
    assert.match(source, /GPL-3\.0-only/)
  }
})


test('license, notice and third-party notices are the GPL set upstream requires', () => {
  const license = readFileSync(join(root, 'LICENSE'), 'utf8')
  assert.match(license, /GNU GENERAL PUBLIC LICENSE/)
  assert.match(license, /Version 3, 29 June 2007/)
  const notice = readFileSync(join(root, 'NOTICE'), 'utf8')
  assert.match(notice, /dsh-harness-toolbox/)
  assert.match(notice, /Obsidian Prism/)
  assert.match(notice, /RMvdesi/)
  assert.match(notice, /2026-11-25/)
  assert.match(notice, /vendor\/obsidian-prism\/vial-core\.js/)
  const third = readFileSync(join(root, 'THIRD_PARTY_NOTICES.md'), 'utf8')
  assert.match(third, /0DNANCY\/agy-claude-style/)
  assert.match(third, /wp3171216237\/dsh-TUI/)
})

test('the vendor route serves exactly the two shipped scripts', () => {
  const source = readFileSync(join(root, 'index.js'), 'utf8')
  assert.match(source, /new Set\(\['vial-core\.js', 'dual-mascot-rig\.js'\]\)/)
  for (const name of ['vial-core.js', 'dual-mascot-rig.js']) {
    assert.ok(source.includes(`/compression-tiers/vendor/`), 'vendor routes are registered')
  }
  assert.match(source, /text\/javascript; charset=utf-8/)
  assert.match(source, /vendorScript\(name\)/)
})

test('the package declares GPL-3.0-only and ships the optical modules', () => {
  const manifest = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'))
  assert.equal(manifest.license, 'GPL-3.0-only')
  assert.equal(manifest.version, '2.4.6')
  for (const entry of ['vendor', 'NOTICE', 'THIRD_PARTY_NOTICES.md']) {
    assert.ok(manifest.files.includes(entry), `files is missing ${entry}`)
  }
  assert.equal(manifest.exports['./vendor/*'], './vendor/*')
})
