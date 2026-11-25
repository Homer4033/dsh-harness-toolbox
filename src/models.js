import { existsSync, mkdirSync, renameSync, statSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { downloadWithResume } from './gh.js'

/**
 * Local diffusion models this plugin can fetch for the user.
 *
 * FLUX.2 [klein] 4B is the distilled 4-step variant (guidance 1.0, ~13GB VRAM);
 * the `-base-4B` repo next door needs ~50 steps and is meant for fine-tuning.
 * The repo is ungated and Apache-2.0, so an anonymous `resolve/main` download
 * works. Only the diffusers pipeline is pinned: the repo also ships a duplicate
 * single-file transformer (`flux-2-klein-4b.safetensors`, same 7.75GB) and three
 * preview JPEGs, which would add ~7.8GB for nothing. Sizes are the LFS sizes from
 * the Hugging Face tree API and double as the install check.
 */
export const MODELS = {
  'flux2-klein-4b': {
    id: 'flux2-klein-4b',
    name: 'FLUX.2 [klein] 4B',
    detail: '4-step distilled · guidance 1.0 · Apache-2.0',
    repo: 'black-forest-labs/FLUX.2-klein-4B',
    license: 'Apache-2.0',
    files: [
      { path: 'model_index.json', size: 446 },
      { path: 'transformer/config.json', size: 541 },
      { path: 'transformer/diffusion_pytorch_model.safetensors', size: 7751109744 },
      { path: 'text_encoder/config.json', size: 1536 },
      { path: 'text_encoder/generation_config.json', size: 214 },
      { path: 'text_encoder/model.safetensors.index.json', size: 32855 },
      { path: 'text_encoder/model-00001-of-00002.safetensors', size: 4967215360 },
      { path: 'text_encoder/model-00002-of-00002.safetensors', size: 3077766632 },
      { path: 'vae/config.json', size: 821 },
      { path: 'vae/diffusion_pytorch_model.safetensors', size: 168120878 },
      { path: 'scheduler/scheduler_config.json', size: 486 },
      { path: 'tokenizer/added_tokens.json', size: 707 },
      { path: 'tokenizer/chat_template.jinja', size: 4168 },
      { path: 'tokenizer/merges.txt', size: 1671853 },
      { path: 'tokenizer/special_tokens_map.json', size: 613 },
      { path: 'tokenizer/tokenizer.json', size: 11422654 },
      { path: 'tokenizer/tokenizer_config.json', size: 5404 },
      { path: 'tokenizer/vocab.json', size: 2776833 },
    ],
  },
}

export const MODEL_IDS = Object.keys(MODELS)

/** Models live in their own folder below the download root, next to gh/git/… */
export function modelDir(root, id) {
  return join(root, 'models', id)
}

export function modelSpec(id) {
  return Object.prototype.hasOwnProperty.call(MODELS, id) ? MODELS[id] : null
}

/**
 * Where a model file can be fetched from, in order.
 *
 * `huggingface.co` is blocked on many networks (mainland China answers
 * `fetch failed` / `ENOTFOUND`), which is exactly what the first release shipped
 * and what users hit. `hf-mirror.com` speaks the same `/<repo>/resolve/main/<path>`
 * URL scheme and the same `Range` semantics, so it goes first and the upstream
 * host stays as the fallback for networks where the mirror is the slow one.
 * Override with `DSH_HF_ENDPOINT` (e.g. a corporate mirror) — it is tried first.
 */
export const MODEL_ENDPOINTS = ['https://hf-mirror.com', 'https://huggingface.co']

function modelEndpoints() {
  const override = String(process.env.DSH_HF_ENDPOINT || '').trim().replace(/\/+$/, '')
  if (!/^https?:\/\/[^/]+/i.test(override)) return MODEL_ENDPOINTS
  return [override, ...MODEL_ENDPOINTS.filter((endpoint) => endpoint !== override)]
}

export function modelFileUrl(id, path, endpoint = modelEndpoints()[0]) {
  const spec = modelSpec(id)
  if (!spec) throw new Error(`unknown model: ${id}`)
  return `${endpoint}/${spec.repo}/resolve/main/${path}`
}

/** Every URL a file can come from, in the order they are tried. */
export function modelFileUrls(id, path) {
  return modelEndpoints().map((endpoint) => modelFileUrl(id, path, endpoint))
}

function hostOf(url) {
  try {
    return new URL(url).host
  } catch {
    return url
  }
}

/**
 * `fetch failed` alone tells the user nothing. Node hides the real socket / DNS
 * error in `cause`, so surface its code (`ENOTFOUND`, `ECONNREFUSED`, …).
 */
function describeDownloadError(error) {
  const message = error instanceof Error ? error.message : String(error)
  const code = (error && error.cause && error.cause.code) || (error && error.code)
  return code && !String(message).includes(code) ? `${message} (${code})` : message
}

export function modelTotalBytes(id) {
  const spec = modelSpec(id)
  return spec ? spec.files.reduce((sum, file) => sum + file.size, 0) : 0
}

const downloads = new Map()

function jobKey(root, id) {
  return root + '\u0000' + id
}

/** Whether a model below this root is downloading right now. */
export function modelDownloadRunning(root) {
  for (const [key, job] of downloads) {
    if (job.running && key.startsWith(root + '\u0000')) return true
  }
  return false
}

function fileSize(stat, path) {
  try {
    return stat(path).size
  } catch {
    return null
  }
}

/**
 * State of one model below `root`: which pinned files are already complete, how
 * many bytes are on disk, and the live download (if any). A file counts only
 * when its size matches the pinned size exactly — that is the integrity check
 * the resume downloader guarantees, without hashing 16GB on every panel open.
 */
export function modelStatus(root, id, { fs = {} } = {}) {
  const spec = modelSpec(id)
  if (!spec) return null
  const stat = fs.statSync || statSync
  const exists = fs.existsSync || existsSync
  const dir = modelDir(root, id)
  const job = downloads.get(jobKey(root, id))
  const files = spec.files.map((file) => {
    const target = join(dir, file.path)
    const size = fileSize(stat, target)
    return { path: file.path, size: file.size, present: size === file.size }
  })
  const done = files.filter((file) => file.present)
  const bytes = done.reduce((sum, file) => sum + file.size, 0)
  const total = spec.files.reduce((sum, file) => sum + file.size, 0)
  const installed = done.length === files.length
  const partial = !installed && (exists(dir) || (job && job.running) || bytes > 0)
  const liveBytes = job && job.running ? bytes - (job.fileBytes || 0) + (job.received || 0) : bytes
  return {
    id: spec.id,
    name: spec.name,
    detail: spec.detail,
    repo: spec.repo,
    license: spec.license,
    state: installed ? 'installed' : partial ? 'partial' : 'missing',
    installed,
    dir,
    bytes: installed ? total : Math.max(0, Math.min(total, liveBytes)),
    total,
    percent: total > 0 ? Math.min(100, Math.round((Math.max(0, Math.min(total, liveBytes)) / total) * 100)) : 0,
    files: done.length,
    fileCount: files.length,
    running: Boolean(job && job.running),
    file: job && job.running ? job.file : null,
    error: job && job.error ? job.error : null,
  }
}

export function modelsStatus(root, options = {}) {
  return {
    path: join(root, 'models'),
    models: MODEL_IDS.map((id) => modelStatus(root, id, options)).filter(Boolean),
    running: modelDownloadRunning(root),
  }
}

/**
 * Fetch every missing file of one model, resuming each from its `.part` file.
 * Only one job per model at a time; a failure keeps the `.part` files, and the
 * next start continues from their byte offsets instead of refetching ~16GB.
 * Downloaded files are renamed into place only when the downloader reports the
 * pinned length, so a short body never becomes part of the model.
 *
 * Each file walks {@link MODEL_ENDPOINTS} until one host delivers it: a blocked
 * host is a dead end, not a reason to fail a 16GB download. The `.part` file is
 * shared across hosts (the bytes are the same), so switching from the mirror to
 * upstream still resumes instead of starting over.
 */
export async function startModelDownload(root, id, { fetchImpl = fetch, signal, files = null, retries } = {}) {
  const spec = modelSpec(id)
  if (!spec) {
    const error = new Error(`unknown model: ${id}`)
    error.status = 404
    throw error
  }
  // `files` is a test seam: the pinned list is ~16GB, so the download path is
  // exercised with small stand-ins while the production list never changes.
  const list = Array.isArray(files) && files.length > 0 ? files : spec.files
  const key = jobKey(root, id)
  if (downloads.get(key)?.running) {
    const error = new Error(`${spec.name} is already downloading`)
    error.status = 409
    throw error
  }
  const job = { running: true, file: null, fileBytes: 0, received: 0, error: null }
  downloads.set(key, job)
  const dir = modelDir(root, id)
  try {
    for (const file of list) {
      const target = join(dir, file.path)
      const part = target + '.part'
      if (fileSize(statSync, target) === file.size) {
        job.fileBytes += file.size
        continue
      }
      mkdirSync(dirname(target), { recursive: true })
      job.file = file.path
      job.received = 0
      // A `.part` left over from an older attempt may be short or long; the
      // downloader handles the 416 restart, so no extra bookkeeping is needed.
      const problems = []
      let delivered = false
      for (const url of modelFileUrls(id, file.path)) {
        try {
          await downloadWithResume({
            url,
            partPath: part,
            fetchImpl,
            signal,
            retries,
            expectedBytes: file.size,
            onProgress: (progress) => {
              job.received = Number(progress && progress.received) || 0
            },
          })
          delivered = true
          break
        } catch (error) {
          if (signal?.aborted) throw error
          problems.push(`${hostOf(url)}: ${describeDownloadError(error)}`)
        }
      }
      if (!delivered) {
        const error = new Error(`下载失败 / download failed — ${problems.join('; ')}`)
        error.status = 502
        throw error
      }
      // `hf-mirror.com` sometimes omits `content-length` on small files, so the
      // downloader cannot spot a short body on its own; never rename a file that
      // is not exactly the pinned size (the status check would keep retrying it,
      // and a truncated transformer would surface as a mysterious load error).
      const written = fileSize(statSync, part)
      if (written !== file.size) {
        const error = new Error(`${file.path}: expected ${file.size} bytes, got ${written == null ? 0 : written}`)
        error.shortRead = true
        throw error
      }
      renameSync(part, target)
      job.fileBytes += file.size
      job.received = 0
      job.file = null
    }
    job.file = null
    job.received = 0
    return modelStatus(root, id)
  } catch (error) {
    job.error = error instanceof Error ? error.message : String(error)
    throw error
  } finally {
    job.running = false
    if (job.error) job.file = null
  }
}
