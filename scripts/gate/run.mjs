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

const NAMES = { 1: 'CTA above the fold (5 sizes)', 2: 'CTA copy / href / tab', 3: 'Facts trace + statement string', 4: 'Token colours, shape, no blur/gradient/filter + hex grep', 5: 'One WebGL context, no three/gsap', 6: 'Frame-0 GL vs Poster', 7: 'Strobe fan >=18 exposures', 8: 'Grab / touch scroll', 9: 'Loupe', 10: 'Emissive blend', 11: 'Load sequence', 12: 'Join roll once / --slip', 13: 'Ten proofs', 14: 'Join order / pointerdown', 15: 'Motion grammar (static CSS)', 16: 'Reduced motion', 17: 'JS-off / WebGL-off', 18: 'qa.mjs 5 routes x 6 viewports', 19: 'Frames: p95 + idle rAF', 20: 'Lighthouse (prod build)', 21: 'Keyboard / focus ring', 22: 'Contrast (composited)', 23: 'Type roles', 24: 'Composition', 25: 'tsc / eslint / build', 26: 'No pinned scenes', 27: 'Scroll scenes scrub', 28: 'Takeover (gsap aborted / arming)', 29: 'Nav material', 30: 'Crowd fills to 20' }

// ---- static / process-driven items ----
const statics = {
  // 15: motion grammar, static. Tiny brace parser over every src/**/*.css (comments stripped).
  15() {
    const DUR = new Set([0, 100, 160, 240, 320, 350, 420, 480, 720])
    const files = walk('src', (p) => p.endsWith('.css')), bad = new Map(), tokensFile = /press[\\/]tokens\.css$/
    const add = (k, f, l) => { const o = bad.get(k) || []; if (o.length < 3) o.push(`${f}:${l}`); bad.set(k, o) }
    const topSplit = (v) => { const out = []; let d = 0, cur = ''; for (const ch of v) { if (ch === '(') d++; if (ch === ')') d--; if (ch === ',' && !d) { out.push(cur); cur = '' } else cur += ch } out.push(cur); return out }
    for (const f of files) {
      const raw = readFileSync(f, 'utf8').replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' '))
      // parse into {prelude, body decls, children, line}
      const root = { prelude: '', decls: [], kids: [], line: 1 }, stack = [root]; let buf = '', line = 1, bufLine = 1
      const flushDecl = () => { const t = buf.trim(); if (t && stack.length > 1) stack.at(-1).decls.push({ t, line: bufLine }); buf = '' }
      for (let i = 0; i < raw.length; i++) {
        const ch = raw[i]; if (ch === '\n') line++
        if (!buf.trim()) bufLine = line
        if (ch === '{') { const n = { prelude: buf.trim(), decls: [], kids: [], line: bufLine }; stack.at(-1).kids.push(n); stack.push(n); buf = '' }
        else if (ch === '}') { flushDecl(); if (stack.length > 1) stack.pop() }
        else if (ch === ';' ) { const depth = (buf.match(/\(/g) || []).length - (buf.match(/\)/g) || []).length; if (depth > 0) buf += ch; else flushDecl() }
        else buf += ch
      }
      const walkN = (n, anc) => {
        const chain = [...anc, n.prelude]
        const inKeyframes = chain.some((p) => /^@keyframes/.test(p)), inReduce = chain.some((p) => /^@media/.test(p) && /prefers-reduced-motion\s*:\s*reduce/.test(p)), scrollRule = n.decls.some((d) => /^animation-timeline\s*:\s*(?!auto|none)/.test(d.t))
        const tokenDef = tokensFile.test(f)
        for (const d of n.decls) {
          const m = d.t.match(/^([\w-]+)\s*:\s*([\s\S]*)$/); if (!m) continue
          const prop = m[1], val = m[2]
          if (prop.startsWith('--')) continue // custom property definitions (tokens) are the source of truth
          if (inKeyframes && /^(width|height|top|left|right|bottom|margin[\w-]*|filter|max-width|max-height|inset)$/.test(prop)) add(`@keyframes animates ${prop}`, f, d.line)
          if (/^transition(-property)?$/.test(prop) && /\ball\b/.test(val) && (prop === 'transition-property' || !/^\s*(none|var\()/.test(val))) add('transition: all', f, d.line)
          if (prop === 'animation-timeline' && !/^(auto|none)$/.test(val.trim())) {
            add('animation-timeline (scroll scenes are GSAP now)', f, d.line)
          }
          if (/^transition(-property)?$/.test(prop) && /\btransform\b/.test(val) && /(^|[\s,>+~])(\.tile|\.btn|\.btn\s+svg)(?![\w-])/.test(n.prelude)) add('transform in a transition on .tile/.btn (C1: use translate/scale)', f, d.line)
          if (!/^(transition|animation|transition-duration|animation-duration|transition-timing-function|animation-timing-function)$/.test(prop) || tokenDef) continue
          const items = topSplit(val)
          for (const it of items) {
            const x = it.trim(); if (!x || /^(none|inherit|initial|unset)$/.test(x)) continue
            if (/^(transition|animation)$/.test(prop) || /duration$/.test(prop)) {
              const times = [...x.replace(/var\([^)]*\)|steps\([^)]*\)|cubic-bezier\([^)]*\)|linear\([^)]*\)/g, ' ').matchAll(/(?<![\w.-])(-?[\d.]+)(ms|s)\b/g)].map((t) => +t[1] * (t[2] === 's' ? 1000 : 1))
              const tokenDur = /var\(--t[1-5]\)|var\(--tick\)/.test(x)
              const dur = /duration$/.test(prop) ? times[0] : (tokenDur ? null : times[0])
              if (dur != null && !DUR.has(Math.round(dur * 100) / 100)) add(`duration ${dur}ms not in 100/160/240/320/350/420/480/720`, f, d.line)
              if (dur == null && !tokenDur && !/duration$/.test(prop) && /^animation$/.test(prop) && !/var\(--/.test(x)) { /* no duration at all: keyframe name only */ }
            }
            if (/^(transition|animation|.*timing-function)$/.test(prop)) {
              const rest = x.replace(/var\(--(ease-out|ease-io|spring|bounce)\)/g, ' ')
              if (/\bcubic-bezier\(|(?<![\w-])(ease|ease-in|ease-out|ease-in-out|step-start|step-end)(?![\w-])/.test(rest)) add('raw easing (use var(--ease-out|--ease-io|--spring|--bounce))', f, d.line)
              if (/\blinear\b(?!\()/.test(rest) && !scrollRule && !/^transition/.test(prop) && !inKeyframes && !inReduce) add('linear easing outside a reduced-motion block', f, d.line)
              if (/\blinear\b(?!\()/.test(rest) && /^transition/.test(prop) && !inReduce && !/^visibility\b/.test(x)) add('linear easing on a transition', f, d.line)
              if (/\bsteps\(/.test(rest) && !/\breg\b|--tick/.test(x) && !/\breg\b/.test(val)) add('steps() on a rule that is not the canvas-synced reg animation', f, d.line)
            }
          }
        }
        n.kids.forEach((k) => walkN(k, chain))
      }
      walkN(root, [])
    }
    // GSAP half: eases from the allow-list, scrub lags in {.3,.4,.5}, no pin / markers / snap on a scrollTrigger
    const EASE = /^(none|power1\.in|power2\.in|power2\.out|power2\.inOut|power3\.out|power4\.out|back\.out\((1\.6|2)\)|elastic\.out\(1, 0\.(45|5)\)|steps\(\d+\))$/
    const gfiles = walk('src', (p) => /[\\/](motion|spot)[\\/].*\.(ts|tsx)$/.test(p) || /[\\/]press[\\/]Roller\.tsx$/.test(p))
    for (const f of gfiles) {
      const src = readFileSync(f, 'utf8').replace(/\/\/.*$/gm, '')
      for (const m of src.matchAll(/\bease:\s*(['"`])([^'"`]+)\1/g)) if (!EASE.test(m[2])) add(`gsap ease '${m[2]}' not in the allow-list`, f, src.slice(0, m.index).split('\n').length)
      for (const m of src.matchAll(/\bscrub:\s*([\d.]+)/g)) if (![0.3, 0.4, 0.5].includes(+m[1])) add(`scrub ${m[1]} not in {.3,.4,.5}`, f, src.slice(0, m.index).split('\n').length)
      for (const m of src.matchAll(/scrollTrigger:\s*\{[^}]*?\b(pin|markers|snap)\s*:/g)) add(`'${m[1]}:' on a scrollTrigger`, f, src.slice(0, m.index).split('\n').length)
    }
    const notes = [`scanned ${files.length} css files and ${gfiles.length} gsap sources under src/`]
    for (const [k, v] of bad) notes.push(`FAIL ${k}: ${v.join(', ')}`)
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
      if (x.cls >= 0.02) p.push('CLS ' + x.cls + ' (limit 0.02)')
      if (x.smallCount) p.push(`${x.smallCount} text<12px`)
      if (x.tapCount) p.push(`${x.tapCount} tap<44 (${(x.tap || []).slice(0, 2)})`)
      if (x.noAlt?.length) p.push(`${x.noAlt.length} missing alt`)
      if (p.length) notes.push(`${x.route} ${x.viewport}: ${p.join('; ')}`)
    }
    return R(notes.length ? 'FAIL' : 'PASS', notes.length ? notes : ['all 30 route x viewport runs clean (5 routes x 360/390/768/1024/1440/1920)'], [f, join(dir, 'report.md')])
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

// item 4, static half: no hex literal in src/ outside tokens.css, ink.ts, riso.glsl.ts; no old tokens.
function grep4() {
  const ALLOW = /press[\\/](tokens\.css|ink\.ts|gl[\\/]riso\.glsl\.ts)$/, notes = [], hits = { hex: [], old: [] }
  const files = walk('src', (p) => /\.(css|ts|tsx|mdx|js|jsx)$/.test(p))
  const HEX = /(?<![\w&/%#-])#(?:[0-9A-Fa-f]{8}|[0-9A-Fa-f]{6}|[0-9A-Fa-f]{3,4})(?![\w-])/
  for (const f of files) {
    readFileSync(f, 'utf8').split('\n').forEach((line, i) => {
      if (!ALLOW.test(f) && HEX.test(line.replace(/https?:\/\/\S+/g, ''))) hits.hex.push(`${f}:${i + 1}`)
      if (/--(stock|y|k|blue|over|k2)(?![\w-])/.test(line)) hits.old.push(`${f}:${i + 1}`)
    })
  }
  if (hits.hex.length) notes.push(`FAIL ${hits.hex.length} hex literals outside tokens.css/ink.ts/riso.glsl.ts, e.g. ${hits.hex.slice(0, 5).join(', ')}`)
  if (hits.old.length) notes.push(`FAIL ${hits.old.length} refs to deleted tokens (--stock|--y|--k|--blue|--over|--k2), e.g. ${hits.old.slice(0, 5).join(', ')}`)
  return R(notes.length ? 'FAIL' : 'PASS', notes.length ? notes : [`grep clean over ${files.length} src files: no stray hex, no old tokens`])
}

// ---- run ----
const results = {}
const want = (n) => !only || only.includes(n)
let browser
if (!flag('static-only')) browser = await launch()
const t0 = Date.now()
const order = [...Array(30).keys()].map((i) => i + 1).filter((n) => n !== 25); order.splice(order.indexOf(20), 0, 25) // 25 builds before 20 serves
for (const n of order) {
  if (!want(n)) continue
  const dir = join(out, `item-${String(n).padStart(2, '0')}`); mkdirSync(dir, { recursive: true })
  if (browser && !browser.isConnected()) browser = await launch()
  const fn = statics[n] || (browser && checks[n])
  if (!fn && n !== 4) { results[n] = R('MANUAL', ['not run (--static-only)']); continue }
  const t = Date.now()
  try {
    const go = () => Promise.race([fn({ browser, base, dir, out }), new Promise((_, rej) => setTimeout(() => rej(new Error('check timed out after 360s')), 360000))])
    let run = fn ? await go() : null
    for (let i = 0; run && n === 11 && run.status === "FAIL" && i < 2; i++) run = await go() // item 11 races GL boot against the frozen clock: retry twice
    if (n === 4) { const g = grep4(); results[n] = run ? R(run.status === 'PASS' && g.status === 'PASS' ? 'PASS' : 'FAIL', [...g.notes, ...run.notes], run.files) : g } else results[n] = run
  } catch (e) { results[n] = R('FAIL', ['harness error: ' + String(e.stack || e).split('\n').slice(0, 3).join(' | ')]) }
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
process.exit(cnt.FAIL ? 1 : 0)
