// Screenshot the pages built by scripts/stage/render.mjs with headless Chrome.
//
//   node scripts/stage/shoot.mjs        # zh
//   node scripts/stage/shoot.mjs en
//   STAGE_CHROME=/path/to/chrome node scripts/stage/shoot.mjs
//
// Writes temp/ct-preview/shots/<lang>/<name>.png. Nothing under docs/ is
// touched here; scripts/stage/install.mjs copies the finals over.
import { spawn } from 'node:child_process'
import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const CHROME = process.env.STAGE_CHROME || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const PORT = Number(process.env.STAGE_CDP_PORT ?? 9341)
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'temp', 'ct-preview')
const LANG = process.argv[2] === 'en' ? 'en' : 'zh'
const SHOTS = join(ROOT, 'shots', LANG)
mkdirSync(SHOTS, { recursive: true })

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
const profile = mkdtempSync(join(tmpdir(), 'ct-stage-'))
const child = spawn(CHROME, [
  '--headless=new',
  `--remote-debugging-port=${PORT}`,
  `--user-data-dir=${profile}`,
  '--no-first-run',
  '--no-default-browser-check',
  '--disable-extensions',
  '--allow-file-access-from-files',
  '--hide-scrollbars',
  '--font-render-hinting=none',
  'about:blank',
], { stdio: 'ignore' })

async function json(path) {
  const res = await fetch(`http://127.0.0.1:${PORT}${path}`)
  return res.json()
}

let page = null
for (let i = 0; i < 80; i += 1) {
  try {
    const list = await json('/json/list')
    page = list.find((item) => item.type === 'page')
    if (page) break
  } catch { /* not up yet */ }
  await sleep(400)
}
if (!page) {
  child.kill()
  throw new Error('chrome devtools did not come up')
}

const ws = new WebSocket(page.webSocketDebuggerUrl)
await new Promise((resolve, reject) => {
  ws.addEventListener('open', resolve, { once: true })
  ws.addEventListener('error', reject, { once: true })
})

let nextId = 1
const pending = new Map()
ws.addEventListener('message', (event) => {
  const msg = JSON.parse(event.data)
  if (msg.id && pending.has(msg.id)) {
    const { resolve, reject } = pending.get(msg.id)
    pending.delete(msg.id)
    if (msg.error) reject(new Error(JSON.stringify(msg.error)))
    else resolve(msg.result)
  }
})
function send(method, params = {}) {
  const id = nextId++
  ws.send(JSON.stringify({ id, method, params }))
  return new Promise((resolve, reject) => pending.set(id, { resolve, reject }))
}
async function evaluate(expression) {
  const result = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true })
  if (result.exceptionDetails) throw new Error(result.exceptionDetails.exception?.description ?? 'exception')
  return result.result?.value
}

await send('Page.enable')
await send('Runtime.enable')

async function navigate(file, width, height, scale) {
  await send('Emulation.setDeviceMetricsOverride', {
    width,
    height,
    deviceScaleFactor: scale || 2,
    mobile: false,
  })
  await send('Page.navigate', { url: pathToFileURL(join(ROOT, LANG, file)).href })
  await sleep(700)
  await evaluate('document.fonts ? document.fonts.ready.then(() => true) : true')
  // The seat copy of the glow is sized by the chat region (client.js does the
  // same measurement in measureGlow); without it the two gradient layers would
  // not meet on one line.
  await evaluate(`(() => {
    const chat = document.querySelector("[data-conversation-region='chat']")
    const seat = document.querySelector("[data-conversation-region='composer']")
    if (chat && seat && chat.clientHeight > 0) seat.style.setProperty('--ct-glow-height', chat.clientHeight + 'px')
    return true
  })()`)
  await sleep(180)
}

/** Clip = the selector's box (plus padding), or an explicit rect. */
async function rectOf(selector, pad) {
  const box = await evaluate(`(() => {
    const el = document.querySelector(${JSON.stringify(selector)})
    if (!el) return null
    const r = el.getBoundingClientRect()
    return { x: r.x + window.scrollX, y: r.y + window.scrollY, width: r.width, height: r.height }
  })()`)
  if (!box) throw new Error('selector not found: ' + selector)
  const margin = pad === undefined ? 24 : pad
  return {
    x: Math.max(0, Math.round(box.x - margin)),
    y: Math.max(0, Math.round(box.y - margin)),
    width: Math.round(box.width + margin * 2),
    height: Math.round(box.height + margin * 2),
  }
}

async function shoot(shot) {
  await navigate(shot.file, shot.viewport[0], shot.viewport[1], shot.scale)
  const clip = shot.rect
    ? { x: shot.rect[0], y: shot.rect[1], width: shot.rect[2], height: shot.rect[3] }
    : shot.selector
      ? await rectOf(shot.selector, shot.pad)
      : { x: 0, y: 0, width: shot.viewport[0], height: shot.viewport[1] }
  const image = await send('Page.captureScreenshot', {
    format: 'png',
    clip: { ...clip, scale: 1 },
    captureBeyondViewport: true,
  })
  writeFileSync(join(SHOTS, shot.name + '.png'), Buffer.from(image.data, 'base64'))
  console.log(`${shot.name}.png  ${clip.width}x${clip.height} @${shot.scale || 2}x`)
}

/*
 * Three images, one per story: the conversation (vial + dock row), the panel,
 * and the blank-Session board. Anything else is text in the README.
 */
const SHOTS_LIST = [
  { name: 'hero', file: 'conversation-vial.html', viewport: [1440, 940], scale: 2 },
  { name: 'panel', file: 'panel-components.html', viewport: [1280, 1500], scale: 1.5, selector: '.ct-shell', pad: 26 },
  { name: 'heat', file: 'heat.html', viewport: [1440, 940], scale: 2 },
]

for (const shot of SHOTS_LIST) await shoot(shot)

ws.close()
child.kill()
console.log('shots in ' + SHOTS)
