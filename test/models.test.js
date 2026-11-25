import test from 'node:test'
import assert from 'node:assert/strict'
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { MODEL_ENDPOINTS, MODEL_IDS, MODELS, modelDir, modelFileUrls, modelStatus, modelTotalBytes, startModelDownload } from '../src/models.js'

function tempRoot() {
  return mkdtempSync(join(tmpdir(), 'compression-tiers-models-'))
}

function streamOf(text) {
  return new ReadableStream({
    start(controller) {
      controller.enqueue(new TextEncoder().encode(text))
      controller.close()
    },
  })
}

test('the pinned pipeline is FLUX.2 [klein] 4B, distilled, ungated and Apache-2.0', () => {
  assert.deepEqual(MODEL_IDS, ['flux2-klein-4b'])
  const spec = MODELS['flux2-klein-4b']
  assert.equal(spec.repo, 'black-forest-labs/FLUX.2-klein-4B')
  assert.equal(spec.license, 'Apache-2.0')
  assert.match(spec.detail, /4-step/)
  // The distilled pipeline needs the transformer, the Qwen3-4B text encoder
  // (two shards), the VAE, scheduler and tokenizer — but not the repo's
  // duplicate single-file transformer or its preview JPEGs.
  assert.equal(spec.files.length, 18)
  assert.equal(spec.files.filter((file) => file.path.endsWith('.safetensors')).length, 4)
  assert.equal(spec.files.some((file) => file.path === 'flux-2-klein-4b.safetensors'), false)
  assert.equal(spec.files.some((file) => file.path.endsWith('.jpg')), false)
  assert.equal(modelTotalBytes('flux2-klein-4b'), 15980131745)
  // huggingface.co is unreachable on the networks this plugin ships to, so the
  // path-compatible mirror is tried first and upstream stays as the fallback.
  assert.deepEqual(MODEL_ENDPOINTS, ['https://hf-mirror.com', 'https://huggingface.co'])
  assert.deepEqual(modelFileUrls('flux2-klein-4b', 'vae/config.json'), [
    'https://hf-mirror.com/black-forest-labs/FLUX.2-klein-4B/resolve/main/vae/config.json',
    'https://huggingface.co/black-forest-labs/FLUX.2-klein-4B/resolve/main/vae/config.json',
  ])
  assert.equal(modelDir('C:/root', 'flux2-klein-4b').replace(/\\/g, '/'), 'C:/root/models/flux2-klein-4b')
})

test('status reports missing, partial and installed without inventing bytes', () => {
  const root = tempRoot()
  try {
    const missing = modelStatus(root, 'flux2-klein-4b')
    assert.equal(missing.state, 'missing')
    assert.equal(missing.bytes, 0)
    assert.equal(missing.percent, 0)
    assert.equal(missing.installed, false)

    // One small pinned file is enough to read as partial; it must be exactly the
    // pinned length, not just present.
    const dir = modelDir(root, 'flux2-klein-4b')
    mkdirSync(join(dir, 'tokenizer'), { recursive: true })
    writeFileSync(join(dir, 'tokenizer', 'added_tokens.json'), 'x'.repeat(707))
    const partial = modelStatus(root, 'flux2-klein-4b')
    assert.equal(partial.state, 'partial')
    assert.equal(partial.files, 1)
    assert.equal(partial.bytes, 707)
    writeFileSync(join(dir, 'tokenizer', 'added_tokens.json'), 'short')
    const stale = modelStatus(root, 'flux2-klein-4b')
    assert.equal(stale.state, 'partial', 'a download folder with nothing complete is still partial')
    assert.equal(stale.files, 0)
    assert.equal(stale.bytes, 0)

    // The installed branch is exercised through an injected fs: writing 16GB of
    // test data is not an option.
    const sizes = Object.fromEntries(MODELS['flux2-klein-4b'].files.map((file) => [join(dir, file.path), file.size]))
    const fakeFs = {
      existsSync: (path) => path === dir || Boolean(sizes[path]),
      statSync: (path) => {
        if (!(path in sizes)) throw new Error('ENOENT')
        return { size: sizes[path] }
      },
    }
    const installed = modelStatus(root, 'flux2-klein-4b', { fs: fakeFs })
    assert.equal(installed.installed, true)
    assert.equal(installed.state, 'installed')
    assert.equal(installed.percent, 100)
    assert.equal(installed.bytes, installed.total)

    assert.equal(modelStatus(root, 'nope'), null)
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
})

test('a model download resumes from the .part file and renames complete files into place', async () => {
  const root = tempRoot()
  const ranges = []
  const bodies = { 'model/a.txt': '0123456789', 'model/b.bin': 'abcdef' }
  const fetchImpl = (url, options) => {
    const path = String(url).split('/resolve/main/')[1]
    const body = bodies[path]
    const range = options && options.headers ? options.headers.Range : undefined
    ranges.push({ path, range: range || null })
    if (!range) {
      return Promise.resolve({ ok: true, status: 200, headers: new Headers({ 'content-length': String(body.length) }), body: streamOf(body) })
    }
    const start = Number(/bytes=(\d+)-/.exec(range)[1])
    const rest = body.slice(start)
    return Promise.resolve({
      ok: true,
      status: 206,
      headers: new Headers({ 'content-range': `bytes ${start}-${body.length - 1}/${body.length}`, 'content-length': String(rest.length) }),
      body: streamOf(rest),
    })
  }
  try {
    const dir = modelDir(root, 'flux2-klein-4b')
    mkdirSync(join(dir, 'model'), { recursive: true })
    // A previous attempt died after three bytes: the next run continues there.
    writeFileSync(join(dir, 'model', 'a.txt.part'), '012')
    await startModelDownload(root, 'flux2-klein-4b', {
      fetchImpl,
      files: [
        { path: 'model/a.txt', size: 10 },
        { path: 'model/b.bin', size: 6 },
      ],
    })
    assert.equal(readFileSync(join(dir, 'model', 'a.txt'), 'utf8'), '0123456789')
    assert.equal(readFileSync(join(dir, 'model', 'b.bin'), 'utf8'), 'abcdef')
    assert.equal(existsSync(join(dir, 'model', 'a.txt.part')), false, 'the part file is renamed away')
    assert.deepEqual(ranges, [
      { path: 'model/a.txt', range: 'bytes=3-' },
      { path: 'model/b.bin', range: null },
    ])
    assert.equal(statSync(join(dir, 'model', 'b.bin')).size, 6)
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
})

test('a blocked host falls back to the next endpoint and names every host on failure', async () => {
  const root = tempRoot()
  const hits = []
  const fetchImpl = (url) => {
    const host = new URL(String(url)).host
    hits.push(host)
    if (host === 'hf-mirror.com') return Promise.resolve({ ok: false, status: 404, headers: new Headers(), body: null })
    return Promise.resolve({ ok: true, status: 200, headers: new Headers({ 'content-length': '3' }), body: streamOf('abc') })
  }
  try {
    await startModelDownload(root, 'flux2-klein-4b', { fetchImpl, files: [{ path: 'only.txt', size: 3 }] })
    assert.equal(readFileSync(join(modelDir(root, 'flux2-klein-4b'), 'only.txt'), 'utf8'), 'abc')
    assert.deepEqual(hits, ['hf-mirror.com', 'huggingface.co'])

    // Both hosts blocked: "fetch failed" alone sent users looking in the wrong
    // place, so the message says which hosts were tried and why each failed.
    const blocked = () => Promise.reject(Object.assign(new TypeError('fetch failed'), { cause: { code: 'ENOTFOUND' } }))
    await assert.rejects(
      startModelDownload(root, 'flux2-klein-4b', { fetchImpl: blocked, files: [{ path: 'two.txt', size: 3 }], retries: 0 }),
      (error) => {
        assert.equal(error.status, 502)
        assert.match(error.message, /hf-mirror\.com: fetch failed \(ENOTFOUND\)/)
        assert.match(error.message, /huggingface\.co: fetch failed \(ENOTFOUND\)/)
        return true
      },
    )
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
})

test('a short body without a length is never renamed into place', async () => {
  const root = tempRoot()
  // The mirror serves small files chunked (no `content-length`), so the pinned
  // size is handed to the downloader; otherwise a truncated body would pass.
  const fetchImpl = () => Promise.resolve({ ok: true, status: 200, headers: new Headers(), body: streamOf('abc') })
  try {
    const dir = modelDir(root, 'flux2-klein-4b')
    await assert.rejects(
      startModelDownload(root, 'flux2-klein-4b', { fetchImpl, files: [{ path: 'short.bin', size: 10 }], retries: 0 }),
      /download ended at 3 of 10 bytes/,
    )
    assert.equal(existsSync(join(dir, 'short.bin')), false)
    assert.equal(statSync(join(dir, 'short.bin.part')).size, 3, 'the partial bytes stay for the next resume')
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
})

test('one model downloads at a time and an unknown id is refused', async () => {
  const root = tempRoot()
  try {
    let release
    const gate = new Promise((resolve) => { release = resolve })
    const fetchImpl = () => gate.then(() => ({
      ok: true,
      status: 200,
      headers: new Headers({ 'content-length': '3' }),
      body: streamOf('abc'),
    }))
    const first = startModelDownload(root, 'flux2-klein-4b', {
      fetchImpl,
      files: [{ path: 'only.txt', size: 3 }],
    })
    await assert.rejects(
      startModelDownload(root, 'flux2-klein-4b', { fetchImpl, files: [{ path: 'only.txt', size: 3 }] }),
      (error) => error.status === 409,
    )
    release()
    await first
    assert.equal(readFileSync(join(modelDir(root, 'flux2-klein-4b'), 'only.txt'), 'utf8'), 'abc')
    await assert.rejects(startModelDownload(root, 'nope'), (error) => error.status === 404)
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
})
