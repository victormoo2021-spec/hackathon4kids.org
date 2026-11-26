// G2 evidence kit. node scripts/gate/run.mjs --url http://localhost:3010 --out <dir> [--only 4,5] [--lh] [--static-only]
//   --lh  also builds with NEXT_DIST_DIR=.next-check, serves it on --lh-port (default 3998), runs Lighthouse (item 20) + next build (25).
import { spawn, spawnSync } from 'node:child_process'
import { readdirSync, readFileSync, writeFileSync, mkdirSync, statSync, existsSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { launch } from './lib.mjs'
import { checks } from './checks.mjs'

const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i > 0 ? process.argv[i + 1] : d }
const flag = (k) => process.argv.includes('--' + k)
const base = arg('url', 'http://localhost:3010').replace(/\/$/, '')
const out = resolve(arg('out', 'gate-out'))
const only = arg('only') ? arg('only').split(',').map(Number) : null
const lhPort = arg('lh-port', '3998')
const DIST = '.next-check'
mkdirSync(out, { recursive: true })
const R = (status, notes = [], files = []) => ({ status, notes, files })
const sh = (c, a, o = {}) => spawnSync(c, a, { encoding: 'utf8', maxBuffer: 1 << 28, ...o })
const tail = (s, n = 15) => (s || '').trim().split('\n').slice(-n)
const walk = (d, f, acc = []) => { for (const n of readdirSync(d)) { if (/^(node_modules|\.next.*|\.git|\.claude)$/.test(n)) continue; const p = join(d, n); statSync(p).isDirectory() ? walk(p, f, acc) : f(p) && acc.push(p) } return acc }

const NAMES = { 1: 'CTA above the fold', 2: 'CTA copy / href / tab', 3: 'Facts trace', 4: 'Ink tokens only', 5: 'One WebGL context, no three/gsap', 6: 'Frame-0 GL vs Poster', 7: 'Strobe fan >=18 exposures', 8: 'Grab / touch scroll', 9: 'Loupe', 10: 'Mis-registration slivers', 11: 'Load sequence', 12: 'Roller / slip', 13: 'Ten proofs', 14: 'Final band / pointerdown', 15: 'CSS durations/steps/easing', 16: 'Reduced motion', 17: 'JS-off / WebGL-off', 18: 'qa.mjs 5 routes x 5 viewports', 19: 'Perf: rAF p95 + idle', 20: 'Lighthouse (prod build)', 21: 'Keyboard / focus', 22: 'Contrast', 23: 'Type roles', 24: 'Composition', 25: 'tsc / eslint / build', 26: 'unslop template check', 27: 'Owner feel pass' }

// ---- static / process-driven items ----
const statics = {
  15() {
    const notes = [], files = walk('src', (p) => p.endsWith('.css'))
    const bad = new Map(); const add = (k, f, l) => { const o = bad.get(k) || []; if (o.length < 3) o.push(`${f}:${l}`); bad.set(k, o) }
    for (const f of files) {
      const src = readFileSync(f, 'utf8').replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' '))
      src.split('\n').forEach((line, i) => {
        const L = i + 1
        if (/\b(ease|ease-in|ease-out|ease-in-out|cubic-bezier|spring)\b/.test(line) && !/^\s*--/.test(line.replace(/--[\w-]+:[^;]*;/g, ''))) add('easing keyword', f, L)
        else if (/\b(ease|cubic-bezier)/.test(line)) add('easing keyword', f, L)
        if (/transition\s*:\s*all|transition-property\s*:\s*all/.test(line)) add('transition: all', f, L)
        if (/\b(animation|transition)(-duration|-delay)?\s*:/.test(line)) {
          const m = line.match(/(?:^|[{;\s])(animation|transition)(-duration|-delay)?\s*:([^;}]*)/); if (!m) return
          for (const t of m[3].matchAll(/(-?[\d.]+)(ms|s)\b/g)) { const ms = +t[1] * (t[2] === 's' ? 1000 : 1); if (ms !== 0 && ms !== 0.01 && Math.abs(ms / 70 - Math.round(ms / 70)) > 1e-6) add(`duration ${t[0]} not a multiple of 70ms`, f, L) }
          if (m[2] !== '-duration' && m[2] !== '-delay' && !/steps\(|none|--/.test(m[3]) && /\d(ms|s)/.test(m[3]) && !/linear/.test(m[3]) ) add(`${m[1]} without steps()`, f, L)
          if (/\blinear\b/.test(m[3])) add('linear timing', f, L)
        }
        if (/animation-timing-function|transition-timing-function/.test(line) && !/steps\(/.test(line)) add('timing-function without steps()', f, L)
      })
      // keyframes touching opacity
      for (const m of src.matchAll(/@keyframes\s+([\w-]+)\s*\{([\s\S]*?\n\})/g)) if (/opacity\s*:/.test(m[2])) add(`@keyframes ${m[1]} animates opacity`, f, src.slice(0, m.index).split('\n').length)
      if (/\bopacity\s*:\s*0?\.\d/.test(src) && /transition/.test(src)) { /* informational only */ }
    }
    for (const [k, v] of bad) notes.push(`${k}: ${v.join(', ')}`)
    notes.unshift(`scanned ${files.length} css files under src/`)
    return R(bad.size ? 'FAIL' : 'PASS', notes)
  },
  18({ dir }) {
    const r = sh(process.execPath, ['scripts/qa.mjs', '--url', base, '--routes', '/,/about,/programs,/code.org,/gate-404-probe', '--out', dir, '--label', 'gate'])
    const f = join(dir, 'report.json'); if (!existsSync(f)) return R('FAIL', ['qa.mjs produced no report', ...tail((r.stderr || '').split('\n').filter((l) => !/ERROR:ui|INFO:CONSOLE/.test(l)).join('\n'), 4).concat(tail(r.stdout, 3))])
    const rep = JSON.parse(readFileSync(f, 'utf8')), notes = []
    for (const x of rep.results) {
      const probe = x.route === '/gate-404-probe'
      const failed = x.failed.filter((u) => !(probe && new RegExp(`^404 .*${x.route}(\\?|$)`).test(u)))
      const errs = x.errors.filter((e) => !(probe && /404/.test(e)))
      const p = []
      if (errs.length) p.push(`${errs.length} console err (${errs[0].slice(0, 70)})`)
      if (failed.length) p.push(`${failed.length} failed req (${failed[0].slice(0, 70)})`)
      if (x.overflow) p.push('h-overflow ' + (x.overflowEls || []).slice(0, 2))
      if (x.cls > 0) p.push('CLS ' + x.cls)
      if (x.smallCount) p.push(`${x.smallCount} text<12px`)
      if (x.tapCount) p.push(`${x.tapCount} tap<44 (${(x.tap || []).slice(0, 2)})`)
      if (x.noAlt?.length) p.push(`${x.noAlt.length} missing alt`)
      if (p.length) notes.push(`${x.route} ${x.viewport}: ${p.join('; ')}`)
    }
    return R(notes.length ? 'FAIL' : 'PASS', notes.length ? notes : ['all 25 route x viewport runs clean'], [f, join(dir, 'report.md')])
  },
  25({ dir }) {
    const notes = [], files = []; let bad = false
    const tsc = sh(process.execPath, ['node_modules/typescript/bin/tsc', '--noEmit'])
    const te = (tsc.stdout || '').split('\n').filter((l) => /error TS/.test(l) && !/^\.next/.test(l))
    notes.push(`tsc: ${te.length} errors ${te.slice(0, 5).join(' | ')}`); if (te.length) bad = true
    const es = sh('node_modules/.bin/eslint', ['.'], { cwd: process.cwd(), env: { ...process.env, PATH: `${process.env.HOME}/.nvm/versions/node/v24.22.1/bin:${process.env.PATH}` } }) // same as `pnpm lint`
    writeFileSync(join(dir, 'eslint.txt'), es.stdout + es.stderr); files.push(join(dir, 'eslint.txt'))
    notes.push(`eslint: exit ${es.status} ${tail(es.stdout || es.stderr, 4).join(' | ').slice(0, 300)}`); if (es.status) bad = true
    if (flag('lh') || flag('build')) {
      const b = sh(process.execPath, ['node_modules/next/dist/bin/next', 'build'], { env: { ...process.env, NEXT_DIST_DIR: DIST } })
      writeFileSync(join(dir, 'build.txt'), b.stdout + b.stderr); files.push(join(dir, 'build.txt'))
      notes.push(`next build (NEXT_DIST_DIR=${DIST}): exit ${b.status} ${b.status ? tail(b.stderr + b.stdout, 6).join(' | ') : ''}`); if (b.status) bad = true
    } else notes.push('next build: skipped (pass --lh or --build)')
    return R(bad ? 'FAIL' : (flag('lh') || flag('build')) ? 'PASS' : 'MANUAL', notes, files)
  },
  async 20({ dir }) {
    if (!flag('lh')) return R('MANUAL', ['skipped: run with --lh (builds .next-check, serves on :' + lhPort + ')'])
    if (!existsSync(join(DIST, 'BUILD_ID'))) return R('FAIL', [`${DIST} has no build (item 25 build failed?)`])
    const f = join(dir, 'perf.json')
    const r = sh(process.execPath, ['scripts/perf.mjs', f], { env: { ...process.env, NEXT_DIST_DIR: DIST, PERF_PORT: lhPort, PERF_FORMS: 'mobile', PERF_ROUTES: '/,/about,/programs', PERF_NOFPS: '1', PERF_CATS: 'performance,accessibility,best-practices,seo' } })
    if (!existsSync(f)) return R('FAIL', ['perf.mjs failed', ...tail(r.stderr)])
    const j = JSON.parse(readFileSync(f, 'utf8')), notes = []
    for (const [k, v] of Object.entries(j.lighthouse)) {
      if (v.error) { notes.push(`${k}: ${v.error}`); continue }
      const p = []
      if (v.score < 95) p.push(`perf ${v.score}`); if (v.a11y !== 100) p.push(`a11y ${v.a11y}`); if (v.bp !== 100) p.push(`BP ${v.bp}`); if (v.seo !== 100) p.push(`SEO ${v.seo}`)
      if (k.endsWith(' /') && v.lcp >= 1800) p.push(`LCP ${v.lcp}ms`); if (v.tbt >= 150) p.push(`TBT ${v.tbt}ms`)
      notes.push(`${k}: perf ${v.score} a11y ${v.a11y} bp ${v.bp} seo ${v.seo} lcp ${v.lcp} tbt ${v.tbt} ${p.length ? 'FAIL ' + p.join(', ') : 'ok'}`)
    }
    const fl = j.firstLoadJsKbGzip?.['/']; notes.push(`first-load JS for / = ${fl} KB gz (budget 115)`)
    const bad = notes.some((n) => /FAIL|error/.test(n)) || !(fl <= 115)
    return R(bad ? 'FAIL' : 'PASS', notes, [f])
  },
}

// ---- run ----
const results = {}
const want = (n) => !only || only.includes(n)
let browser
if (!flag('static-only')) browser = await launch()
const t0 = Date.now()
const order = [...Array(27).keys()].map((i) => i + 1).filter((n) => n !== 25); order.splice(order.indexOf(20), 0, 25) // 25 builds before 20 serves
for (const n of order) {
  if (!want(n)) continue
  const dir = join(out, `item-${String(n).padStart(2, '0')}`); mkdirSync(dir, { recursive: true })
  if (browser && !browser.isConnected()) browser = await launch()
  const fn = statics[n] || (browser && checks[n])
  if (!fn) { results[n] = R('MANUAL', ['not run (--static-only)']); continue }
  const t = Date.now()
  try { results[n] = await Promise.race([fn({ browser, base, dir, out }), new Promise((_, rej) => setTimeout(() => rej(new Error('check timed out after 360s')), 360000))]) }
  catch (e) { results[n] = R('FAIL', ['harness error: ' + String(e.stack || e).split('\n').slice(0, 3).join(' | ')]) }
  console.log(`${String(n).padStart(2)} ${results[n].status.padEnd(6)} ${NAMES[n]} (${((Date.now() - t) / 1000).toFixed(0)}s)`)
}
await browser?.close()

const cnt = { PASS: 0, FAIL: 0, MANUAL: 0 }; Object.values(results).forEach((r) => cnt[r.status]++)
const md = [`# Gate evidence`, '', `base ${base} | ${new Date().toISOString()} | ${((Date.now() - t0) / 60000).toFixed(1)} min`, `PASS ${cnt.PASS} | FAIL ${cnt.FAIL} | MANUAL ${cnt.MANUAL}`, '', '| # | item | status |', '|---|---|---|']
for (const [n, r] of Object.entries(results).sort((a, b) => a[0] - b[0])) md.push(`| ${n} | ${NAMES[n]} | ${r.status} |`)
md.push('')
for (const [n, r] of Object.entries(results)) {
  md.push(`## ${n}. ${NAMES[n]}: ${r.status}`)
  for (const x of r.notes) md.push(`- ${x}`)
  if (r.files.length) md.push(`- evidence: ${r.files.length > 6 ? r.files.slice(0, 3).join(', ') + `, ... (${r.files.length} files in ${join(out, 'item-' + String(n).padStart(2, '0'))})` : r.files.join(', ')}`)
  md.push('')
}
writeFileSync(join(out, 'gate-evidence.md'), md.join('\n'))
console.log(`\nPASS ${cnt.PASS} FAIL ${cnt.FAIL} MANUAL ${cnt.MANUAL} -> ${join(out, 'gate-evidence.md')}`)
