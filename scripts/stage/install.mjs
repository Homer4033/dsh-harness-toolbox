// Copy the three finals from temp/ct-preview/shots/<lang> into docs/screenshots
// and drop every other image there, so the repository only ships what the
// README and the detail pages actually reference.
//
//   node scripts/stage/install.mjs        # zh (the shipped set)
//   node scripts/stage/install.mjs en
import { copyFileSync, mkdirSync, readdirSync, rmSync, statSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..')
const LANG = process.argv[2] === 'en' ? 'en' : 'zh'
const SRC = join(ROOT, 'temp', 'ct-preview', 'shots', LANG)
const DEST = join(ROOT, 'docs', 'screenshots')
const KEEP = ['hero.png', 'panel.png', 'heat.png']

mkdirSync(DEST, { recursive: true })
for (const name of KEEP) {
  copyFileSync(join(SRC, name), join(DEST, name))
  const size = statSync(join(DEST, name)).size
  console.log(`${name}  ${(size / 1024).toFixed(0)}KB`)
}
for (const name of readdirSync(DEST)) {
  if (KEEP.includes(name)) continue
  rmSync(join(DEST, name))
  console.log(`removed ${name}`)
}
