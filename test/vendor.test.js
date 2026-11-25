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

test('the horizon glow keeps upstream provenance and paints through the 2D renderer', () => {
  const path = join(vendorDir, 'horizon-glow.js')
  assert.ok(existsSync(path), 'horizon-glow.js is shipped')
  const source = readFileSync(path, 'utf8')
  assert.match(source, /https:\/\/github\.com\/RMvdesi\/obsidian-prism/)
  assert.match(source, /ripple-core\.js/)
  assert.match(source, /GPL-3\.0-only/)
  assert.match(source, /Modified: 2026-12-01/)
  // The extracted module must not drag the rest of ripple-core in.
  assert.doesNotMatch(source, /createBrandHorizonGLRenderer|glyphField|mountBrandHorizonGlow/)

  let puts = 0
  let clears = 0
  const context = {
    createImageData: (w, h) => ({ width: w, height: h, data: new Uint8ClampedArray(w * h * 4) }),
    clearRect: () => { clears += 1 },
    putImageData: () => { puts += 1 },
  }
  const canvas = { width: 0, height: 0, getContext: () => context, ownerDocument: { hidden: false } }
  const glowLib = loadUmd('horizon-glow.js', { document: { hidden: false } })
  assert.equal(typeof glowLib.mount, 'function')
  assert.equal(JSON.stringify(glowLib.DEFAULT_HORIZON_AURA), JSON.stringify({ reach: 0.47, prism: 0, surge: 0, speed: 1 }))
  const glow = glowLib.mount(canvas)
  assert.equal(glow.mode, '2d')
  assert.equal(glow.resize(600, 160, 0.72), true)
  assert.equal(canvas.width, 432)
  assert.equal(canvas.height, 115)
  assert.equal(glow.draw(1.5, true, 0.9, 1, 0.47), true)
  assert.equal(glow.draw(2.5, false, 0.9, 1, 0.47), true)
  assert.equal(puts, 2)
  glow.clear()
  assert.equal(clears, 1)
  // No 2d context: the mount degrades to a no-op instead of throwing.
  const dead = glowLib.mount({ width: 0, height: 0, getContext: () => null })
  assert.equal(dead.mode, 'none')
  assert.equal(dead.draw(1, true, 1, 1, 0.47), false)
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

test('the vendor route serves exactly the three shipped scripts', () => {
  const source = readFileSync(join(root, 'index.js'), 'utf8')
  assert.match(source, /new Set\(\['vial-core\.js', 'dual-mascot-rig\.js', 'horizon-glow\.js'\]\)/)
  for (const name of ['vial-core.js', 'dual-mascot-rig.js', 'horizon-glow.js']) {
    assert.ok(source.includes(`/compression-tiers/vendor/`), 'vendor routes are registered')
  }
  assert.match(source, /text\/javascript; charset=utf-8/)
  assert.match(source, /vendorScript\(name\)/)
})

test('the package declares GPL-3.0-only and ships the optical modules', () => {
  const manifest = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'))
  assert.equal(manifest.license, 'GPL-3.0-only')
  assert.equal(manifest.version, '2.4.1')
  for (const entry of ['vendor', 'NOTICE', 'THIRD_PARTY_NOTICES.md']) {
    assert.ok(manifest.files.includes(entry), `files is missing ${entry}`)
  }
  assert.equal(manifest.exports['./vendor/*'], './vendor/*')
})
