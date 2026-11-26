// Perf harness. Usage: node scripts/perf.mjs [out.json] [--build]
// First-load JS (gzip, from app-build-manifest) + Lighthouse mobile/desktop on 3 routes + bench-fps.
import { spawn, spawnSync } from 'node:child_process'
import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs'
import { gzipSync } from 'node:zlib'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { chromium } from '@playwright/test'

const args = process.argv.slice(2)
const out = args.find((a) => !a.startsWith('--')) || 'perf-results.json'
const PORT = 3999
const BASE = `http://localhost:${PORT}`
const ROUTES = ['/', '/programs', '/about']
const sh = (cmd, a, o = {}) => spawnSync(cmd, a, { encoding: 'utf8', maxBuffer: 1 << 28, ...o })

if (args.includes('--build')) {
  const r = sh('node_modules/.bin/next', ['build'], { stdio: 'inherit' })
  if (r.status) process.exit(r.status)
}

// first-load JS per route: gzip of every .js in the route's manifest entry (+ layout)
const man = JSON.parse(readFileSync('.next/app-build-manifest.json', 'utf8')).pages
const gz = (f) => gzipSync(readFileSync(join('.next', f))).length
const firstLoad = {}
for (const r of ROUTES) {
  const key = (r === '/' ? '' : r) + '/page'
  const files = [...new Set(man[key] || [])].filter((f) => f.endsWith('.js'))
  firstLoad[r] = +(files.reduce((s, f) => s + gz(f), 0) / 1024).toFixed(1) // KB gzip
}

const server = spawn('node_modules/.bin/next', ['start', '-p', String(PORT)], { stdio: 'ignore' })
const kill = () => server.kill()
process.on('exit', kill)
for (let i = 0; i < 60; i++) {
  try { if ((await fetch(BASE)).ok) break } catch {}
  await new Promise((r) => setTimeout(r, 500))
}

const chrome = chromium.executablePath()
const tmp = mkdtempSync(join(tmpdir(), 'lh-'))
const lh = {}
for (const form of ['mobile', 'desktop']) {
  for (const r of ROUTES) {
    const f = join(tmp, `${form}${r.replace(/\//g, '_')}.json`)
    const a = ['--yes', 'lighthouse', BASE + r, '--output=json', `--output-path=${f}`, '--quiet',
      '--only-categories=performance', '--chrome-flags=--headless=new --no-sandbox']
    if (form === 'desktop') a.push('--preset=desktop')
    for (let t = 0; t < 2; t++) { // lighthouse occasionally fails a run; retry once
      sh('npx', a, { env: { ...process.env, CHROME_PATH: chrome } })
      try { if (JSON.parse(readFileSync(f, 'utf8')).categories.performance.score != null) break } catch {}
    }
    try {
      const j = JSON.parse(readFileSync(f, 'utf8'))
      const au = j.audits
      lh[`${form} ${r}`] = {
        score: Math.round(j.categories.performance.score * 100),
        lcp: Math.round(au['largest-contentful-paint'].numericValue),
        tbt: Math.round(au['total-blocking-time'].numericValue),
        cls: +(au['cumulative-layout-shift'].numericValue ?? 0).toFixed(3),
      }
    } catch (e) { lh[`${form} ${r}`] = { error: String(e.message).slice(0, 80) } }
  }
}

const fpsRun = sh('node', ['scripts/bench-fps.mjs'], { env: { ...process.env, BASE_URL: BASE } })
let fps = null
try { fps = JSON.parse(fpsRun.stdout).results } catch { fps = { error: fpsRun.stderr.slice(0, 200) } }
kill()

writeFileSync(out, JSON.stringify({ firstLoadJsKbGzip: firstLoad, lighthouse: lh, fps }, null, 2))
console.log('first-load JS (KB gzip):', firstLoad)
console.table(lh)
if (fps && !fps.error) for (const [k, v] of Object.entries(fps)) console.log(k, Object.fromEntries(Object.entries(v).map(([s, x]) => [s, `p50 ${x.p50} p95 ${x.p95}`])))
process.exit(0)
