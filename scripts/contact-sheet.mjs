// node scripts/contact-sheet.mjs --dirs a,b,c [--out dir]  (dirs = qa.mjs outputs)
import { chromium } from '@playwright/test'
import { mkdirSync, writeFileSync, readdirSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'

const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i > 0 ? process.argv[i + 1] : d }
const dirs = arg('dirs', '').split(',').filter(Boolean).map((d) => resolve(d))
const out = resolve(arg('out', 'sheet'))
if (!dirs.length) { console.error('--dirs a,b,c required'); process.exit(1) }
mkdirSync(out, { recursive: true })
const folds = dirs.map((d) => readdirSync(d).filter((f) => f.endsWith('_fold.png')))
const keys = [...new Set(folds.flat().map((f) => f.replace('_fold.png', '')))].sort()
const rows = keys.map((k) => `<section><h2>${k}</h2><div class="row">${dirs.map((d, i) => folds[i].includes(k + '_fold.png') ? `<figure><img src="${pathToFileURL(join(d, k + '_fold.png'))}"><figcaption>${d.split('/').pop()}</figcaption></figure>` : '<figure>missing</figure>').join('')}</div></section>`).join('')
const html = `<!doctype html><meta charset=utf-8><style>body{background:#111;color:#eee;font:13px system-ui;margin:16px}h2{margin:20px 0 6px}.row{display:flex;gap:12px;align-items:flex-start}figure{margin:0;flex:1;min-width:0}img{width:100%;display:block;border:1px solid #444}figcaption{padding:4px 0}</style>${rows}`
writeFileSync(join(out, 'sheet.html'), html)
const b = await chromium.launch()
const p = await b.newPage({ viewport: { width: 1800, height: 900 } })
await p.goto(pathToFileURL(join(out, 'sheet.html')).href)
await p.waitForLoadState('load')
await p.screenshot({ path: join(out, 'sheet.png'), fullPage: true })
await b.close()
console.log('wrote', join(out, 'sheet.png'))
