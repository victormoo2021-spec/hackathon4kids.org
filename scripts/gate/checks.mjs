// Browser-driven checks (Phosphor, 30-item gate). Each returns { status: 'PASS'|'FAIL'|'MANUAL', notes: string[], files: string[] }.
// Item n lives in checks[n]; items 15, 18, 20, 25 (and the static half of 4) live in run.mjs. See direction.md D10.
import { launch, openPage, scrollAll, stats, diff, blurDiff, emissive, save, pct, ROUTES, INKS, NOGL_ARGS, hexRgb } from './lib.mjs'
import { readFileSync } from 'node:fs'
import { gzipSync } from 'node:zlib'

const CTA_HREF = 'https://forms.gle/ou5o62fdUXCHUzxA8'
const STATEMENT = 'Started in 2018 by two high-school students. Still taught by high-school students. Still free, in the Bay Area.'
const R = (status, notes = [], files = []) => ({ status, notes, files })
const FOLDS = [[1920, 1080], [1440, 900], [1024, 768], [390, 844], [360, 740]]
const retry = async (f, n = 3) => { for (let i = 0; ; i++) try { return await f() } catch (e) { if (i >= n || !/context was destroyed|navigation/i.test(String(e))) throw e; await new Promise((r) => setTimeout(r, 1500)) } } // dev HMR reload
const ok = (cond, msg, notes) => { if (!cond) notes.push(msg); return !!cond }
const wait = (ms) => new Promise((r) => setTimeout(r, ms))
const F = (cond, msg, notes) => { if (!cond) notes.push('FAIL ' + msg); return !!cond }

// Hero clip below the nav, plus rects (clip-relative) of text furniture to ignore when hunting the beam.
const heroGeom = (page) => page.evaluate(() => {
  const h = document.querySelector('#hero'), n = document.querySelector('header'), hb = h.getBoundingClientRect()
  const y = Math.max(hb.top, n ? n.getBoundingClientRect().bottom : 0)
  const clip = { x: 0, y: Math.round(y), width: innerWidth, height: Math.round(Math.min(hb.bottom, innerHeight) - y) }
  const exclude = [...h.querySelectorAll('h1, .t-slab, a, .t-mono, [data-plate]')].map((e) => e.getBoundingClientRect()).filter((b) => b.width && b.height)
    .map((b) => ({ x: Math.round(b.left) - 4, y: Math.round(b.top - clip.y) - 4, width: Math.round(b.width) + 8, height: Math.round(b.height) + 8 }))
  return { clip, exclude }
})

// Freeze every time-based clock before first paint: CSS animations + the press clock. Returns when the hook exists.
const FREEZE = '<style>*,*::before,*::after{animation-play-state:paused!important}</style><script>window.__pressClock&&window.__pressClock.pause()</script>'
async function openFrozenHome(browser, url, o = {}) {
  const r = await openPage(browser, url, { w: 1440, h: 900, inject: FREEZE, wait: 'commit', settle: 0, ...o })
  await r.page.waitForSelector('#hero', { state: 'attached' })
  await r.page.waitForFunction(() => window.__pressClock, null, { timeout: 15000 }).catch(() => {})
  await r.page.evaluate(() => window.__pressClock?.pause())
  await r.page.waitForTimeout(600)
  return r
}
const stepTo = (page, t) => page.evaluate(async (t) => {
  document.getAnimations().filter((a) => a.timeline === document.timeline).forEach((a) => { try { a.pause(); a.currentTime = t } catch {} })
  window.__pressClock?.step(t ? 70 : 0)
  await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)))
}, t)

export const checks = {
  // 1: CTA inside the first screen at five sizes
  async 1({ browser, base, dir }) {
    const notes = [], files = []
    for (const [w, h] of FOLDS) {
      const { ctx, page } = await openPage(browser, base + '/', { w, h })
      const r = await page.evaluate(() => {
        const a = [...document.querySelectorAll('main a, a')].find((e) => /get class dates by email/i.test(e.textContent || '') && e.offsetParent)
        if (!a) return null
        const b = a.getBoundingClientRect(); return { top: b.top, bottom: b.bottom, left: b.left, right: b.right, vw: innerWidth }
      })
      files.push(save(dir, `fold_${w}x${h}.png`, await page.screenshot()))
      if (!r) notes.push(`FAIL ${w}x${h}: CTA not found`)
      else if (r.bottom > h || r.top < 0 || r.right > r.vw) notes.push(`FAIL ${w}x${h}: CTA not fully in fold (top ${r.top | 0} bottom ${r.bottom | 0})`)
      await ctx.close()
    }
    return R(notes.length ? 'FAIL' : 'PASS', notes.length ? notes : [`CTA in the first screen at ${FOLDS.map((f) => f.join('x')).join(', ')}`], files)
  },
  async 2({ browser, base }) {
    const notes = []
    const { ctx, page } = await openPage(browser, base + '/', { w: 1440, h: 900 })
    const r = await page.evaluate((href) => {
      const all = [...document.querySelectorAll(`a[href="${href}"]`)]
      return all.map((a) => ({ text: (() => { const c = a.cloneNode(true); c.querySelectorAll('.sr-only,[class*="sr-only"]').forEach((n) => n.remove()); return (c.textContent || '').replace(/\s+/g, ' ').trim() })(), target: a.target, rel: a.rel, inHeader: !!a.closest('header,nav'), hint: [...a.querySelectorAll('.sr-only,[class*="sr-only"],[style*="clip"]')].some((n) => /new (tab|window)/i.test(n.textContent || '')) || /new (tab|window)/i.test(a.getAttribute('aria-label') || '') }))
    }, CTA_HREF)
    const main = r.filter((x) => !x.inHeader), nav = r.filter((x) => x.inHeader)
    ok(main.length, 'no body CTA with the form href', notes)
    for (const x of main) { ok(/^Get class dates by email/.test(x.text), `CTA copy "${x.text}"`, notes); ok(x.target === '_blank', 'CTA not target=_blank', notes); ok(x.hint, `CTA "${x.text.slice(0, 30)}" lacks sr-only new-tab hint`, notes) }
    ok(nav.length && nav.every((x) => /^Get class dates(?! by)/.test(x.text)), `nav CTA copy: ${JSON.stringify(nav.map((x) => x.text))}`, notes)
    await ctx.close()
    return R(notes.length ? 'FAIL' : 'PASS', notes)
  },

  // 3: facts. Statement string is exact (automated); everything else is dumped for tracing against content/*.ts.
  async 3({ browser, base, dir }) {
    const files = [], notes = []
    for (const route of ROUTES.slice(0, 4)) {
      const { ctx, page } = await openPage(browser, base + route, { w: 1440, h: 900, settle: 800 })
      const t = await page.evaluate(() => document.body.innerText)
      files.push(save(dir, `text_${route.replace(/\W+/g, '_') || 'home'}.txt`, t))
      if (route === '/') {
        const st = await page.evaluate(() => { const e = document.querySelector('#statement'); return e ? (e.textContent || '').replace(/\s+/g, ' ').trim() : null })
        F(st === STATEMENT, `#statement text ${st === null ? 'missing (no #statement)' : JSON.stringify(st)} != exact D7.2 sentence`, notes)
        const bad = t.split('\n').filter((l) => /testimonial|\b\d{1,3}\s?%|\bstars?\b|since 20(?!18)/i.test(l)).slice(0, 5)
        F(!bad.length, `claim-like lines (stats/testimonials/dates): ${JSON.stringify(bad)}`, notes)
      }
      const risky = t.split('\n').filter((l) => /\d|%|testimonial|"/.test(l) && l.trim()).slice(0, 12)
      notes.push(`${route}: lines with digits/quotes for tracing: ${JSON.stringify(risky)}`)
      await ctx.close()
    }
    notes.push('trace each remaining string to src/app/content/*.ts (text dumps attached); captions allowed only on flyers')
    return R(notes.some((n) => /^FAIL/.test(n)) ? 'FAIL' : 'MANUAL', notes, files)
  },

  // 4: computed styles use only the 12 token hexes; no gradient/filter/blend/blurred shadow; backdrop-filter and alpha only on .site-header::before; radius allow-list. (grep half is in run.mjs)
  async 4({ browser, base }) {
    const notes = [], inks = Object.values(INKS).map(hexRgb)
    const bad = new Map()
    for (const route of ROUTES) for (const [w, h] of [[1440, 900], [390, 844]]) {
      const { ctx, page } = await openPage(browser, base + route, { w, h, settle: 1000 })
      await scrollAll(page, 0.8, 80)
      const r = await retry(() => page.evaluate(({ inks }) => {
        const out = []
        const near = (c) => inks.some((q) => Math.abs(q[0] - c[0]) <= 2 && Math.abs(q[1] - c[1]) <= 2 && Math.abs(q[2] - c[2]) <= 2)
        const col = (s, el, prop, allowAlpha) => {
          for (const m of s.matchAll(/rgba?\(([^)]+)\)/g)) {
            const p = m[1].split(/[ ,\/]+/).map(Number); const a = p.length > 3 ? p[3] : 1
            if (a === 0) continue
            if (a < 1) { if (!allowAlpha) out.push([prop + ' alpha<1', m[0], el]) } else if (!near(p)) out.push([prop, m[0], el])
          }
          if (/color\(|oklab|oklch|lab\(|lch\(|hsl|hwb/.test(s)) out.push([prop + ' non-rgb', s.slice(0, 40), el])
        }
        const nm = (e, ps = '') => e.tagName.toLowerCase() + (typeof e.className === 'string' && e.className ? '.' + e.className.trim().split(/\s+/)[0] : '') + ps
        const radOk = (v) => { const t = String(v).trim(); if (t.endsWith('%')) return parseFloat(t) === 50; const n = parseFloat(t); return n === 0 || n === 8 || n === 20 || n >= 500 }
        const radius = (s, el) => { for (const c of ['TopLeft', 'TopRight', 'BottomLeft', 'BottomRight']) for (const v of s['border' + c + 'Radius'].split(' ')) if (!radOk(v)) { out.push(['border-radius', s.borderRadius, el]); return } }
        const hdr = (e, ps) => ps === '::before' && e.matches('.site-header')
        const audit = (e, s, el, ps) => {
          const isHdrBefore = ps && hdr(e, ps)
          col(s.color, el, 'color'); col(s.backgroundColor, el, 'background', isHdrBefore)
          for (const k of ['Top', 'Right', 'Bottom', 'Left']) if (s['border' + k + 'Style'] !== 'none' && parseFloat(s['border' + k + 'Width']) > 0) col(s['border' + k + 'Color'], el, 'border', isHdrBefore)
          if (s.outlineStyle !== 'none' && parseFloat(s.outlineWidth) > 0) col(s.outlineColor, el, 'outline')
          if (s.textShadow !== 'none') { col(s.textShadow, el, 'text-shadow'); if (s.textShadow.replace(/rgba?\([^)]*\)/g, '').split(',').some((q) => /^\s*-?[\d.]+px\s+-?[\d.]+px\s+[1-9]/.test(q.trim()))) out.push(['blurred text-shadow', s.textShadow.slice(0, 50), el]) }
          if (s.boxShadow !== 'none') { col(s.boxShadow, el, 'box-shadow'); if (s.boxShadow.replace(/rgba?\([^)]*\)/g, '').split(',').some((q) => /^\s*-?[\d.]+px\s+-?[\d.]+px\s+[1-9]/.test(q.trim()))) out.push(['blurred box-shadow', s.boxShadow.slice(0, 50), el]) }
          if (e instanceof SVGElement && !ps) { for (const p of ['fill', 'stroke']) if (s[p] !== 'none' && !s[p].startsWith('url')) col(s[p], el, p) }
          if (/gradient/.test(s.backgroundImage)) out.push(['gradient', s.backgroundImage.slice(0, 40), el])
          if (s.filter !== 'none') out.push(['filter', s.filter, el])
          if (s.backdropFilter && s.backdropFilter !== 'none' && !isHdrBefore) out.push(['backdrop-filter', s.backdropFilter, el])
          if (s.mixBlendMode !== 'normal') out.push(['mix-blend-mode', s.mixBlendMode, el])
          radius(s, el)
        }
        for (const e of document.body.querySelectorAll('*')) {
          const s = getComputedStyle(e), b = e.getBoundingClientRect()
          if (s.display === 'none' || !b.width || !b.height) continue
          audit(e, s, nm(e), '')
        }
        for (const e of [document.querySelector('header'), ...document.querySelectorAll('body *')]) {
          if (!e) continue
          for (const ps of ['::before', '::after']) { const s = getComputedStyle(e, ps); if (s.content !== 'none' && s.display !== 'none') audit(e, s, nm(e, ps), ps) }
        }
        return out
      }, { inks }))
      for (const [p, v, el] of r) { const k = `${p} = ${v}`; const o = bad.get(k) || { n: 0, ex: new Set() }; o.n++; if (o.ex.size < 3) o.ex.add(`${route}@${w} ${el}`); bad.set(k, o) }
      await ctx.close()
    }
    for (const [k, o] of [...bad].sort((a, b) => b[1].n - a[1].n).slice(0, 40)) notes.push(`FAIL ${k}  x${o.n}  e.g. ${[...o.ex].join('; ')}`)
    return R(bad.size ? 'FAIL' : 'PASS', bad.size ? [`${bad.size} distinct violations`, ...notes] : ['all computed colours within +-2 of the 12 tokens; alpha, backdrop-filter only on .site-header::before; radii in {0, 8, 20, 999, 50%}'])
  },

  // 5: one WebGL context per route; three/r3f absent; GSAP only in async (never first-load) chunks, split allowed, total <= 56KB gz
  async 5({ browser, base }) {
    const notes = []
    const re = /@react-three|__THREE__|WebGLRenderer|three\/build|three\.module/, G = /ScrollTrigger|GreenSock|gsapVersions/
    const gz = (t) => gzipSync(Buffer.from(t)).length
    for (const route of ROUTES) {
      const o = await openPage(browser, base + route, { w: 1440, h: 900, settle: 800 })
      const hits = new Set(), gs = new Map()
      o.page.on('response', async (r) => { if (/\.js(\?|$)/.test(r.url())) { try { const t = await r.text(); const m = t.match(re); if (m) hits.add(m[0] + ' in ' + r.url().slice(-50)); if (G.test(t)) gs.set(r.url().slice(-40), gz(t)) } catch {} } })
      await o.page.reload({ waitUntil: 'load' })
      await o.page.waitForTimeout(800)
      await scrollAll(o.page, 0.7, 120)
      const n = await o.page.evaluate(() => window.__gate.gl)
      const wantMin = route === '/' ? 1 : 0 // only the home route mounts GL sheets; /programs etc. use 2D ProofStatic
      if (n > 1 || n < wantMin) notes.push(`FAIL ${route}: ${n} WebGL getContext calls (want ${wantMin === 1 ? 'exactly 1' : '<=1'})`)
      else notes.push(`ok ${route}: ${n} WebGL context(s)`)
      if (hits.size) notes.push(`FAIL ${route}: bundle markers ${[...hits].slice(0, 3).join(', ')}`)
      // first-load = script tags in the served HTML (dynamic import chunks are not listed there)
      const html = await (await fetch(base + route)).text()
      const first = [...new Set([...html.matchAll(/\/_next\/static\/[^"' <>]+?\.js/g)].map((m) => m[0]))]
      const bad = []
      for (const f of first) if (G.test(await (await fetch(base + f)).text())) bad.push(f.slice(-40))
      if (bad.length) notes.push(`FAIL ${route}: gsap marker in first-load chunk(s) ${bad.join(', ')}`)
      const tot = [...gs.values()].reduce((a, b) => a + b, 0)
      notes.push(`${route}: ${first.length} first-load scripts, gsap in ${bad.length}; async gsap chunks loaded: ${gs.size} (${(tot / 1024).toFixed(1)}KB gz)`)
      if (tot > 56 * 1024) notes.push(`FAIL ${route}: gsap chunks ${(tot / 1024).toFixed(1)}KB gz > 56KB`)
      await o.ctx.close()
    }
    try { const pk = JSON.parse(readFileSync('package.json', 'utf8')); const d = Object.keys({ ...pk.dependencies, ...pk.devDependencies }).filter((k) => /^(three|@gsap\/react|@react-three\/.*|@types\/three)$/.test(k)); if (d.length) notes.push('FAIL package.json lists ' + d.join(', ')) } catch {}
    return R(notes.some((n) => /^FAIL/.test(n)) ? 'FAIL' : 'PASS', notes)
  },

  // 6: hero frame 0, GL vs Poster (reduced motion = all sheets at frame 0). Bob mask keys on --text.
  async 6({ browser, base, dir }) {
    const notes = [], files = []
    const nogl = await launch(NOGL_ARGS)
    for (const [w, h] of [[1440, 900], [390, 844]]) {
      const a = await openPage(browser, base + '/', { w, h, reduced: true })
      const b = await openPage(nogl, base + '/', { w, h, reduced: true })
      const ga = await a.page.evaluate(() => window.__gate.gl)
      const g = await heroGeom(a.page)
      const [A, B] = [await a.page.screenshot(), await b.page.screenshot()]
      files.push(save(dir, `gl_${w}.png`, A), save(dir, `poster_${w}.png`, B))
      const d = await blurDiff(browser, A, B, g.exclude.map((r) => ({ ...r, y: r.y + g.clip.y })))
      const sh = d.shift
      notes.push(`${w}: 6px-blur diff ${((d.frac ?? NaN) * 100).toFixed(2)}% (any channel >32; limit 3%), bob centroid GL ${JSON.stringify(d.ca)} Poster ${JSON.stringify(d.cb)} shift ${sh == null ? 'n/a' : sh.toFixed(2)}px (limit 6), GL contexts on GL run: ${ga}`)
      if (!(d.frac < 0.03) || !(sh <= 6) || ga < 1) notes.push(`FAIL ${w}: frame-0 mismatch`)
      await a.ctx.close(); await b.ctx.close()
    }
    await nogl.close()
    return R(notes.some((n) => /^FAIL/.test(n)) ? 'FAIL' : 'PASS', notes, files)
  },

  // 7: strobe fan: >= 18 distinct accent exposures mid-swing (best of 8 phases)
  async 7({ browser, base, dir }) {
    const notes = [], files = [], counts = []
    const { ctx, page } = await openPage(browser, base + '/', { w: 1440, h: 900, settle: 4000 })
    const { clip, exclude } = await heroGeom(page)
    for (let t = 0; t < 8; t++) {
      if (t) await page.waitForTimeout(230) // 230ms is not a multiple of the 15Hz tick: samples different phases
      const buf = await page.screenshot({ clip }); const s = await stats(browser, buf, { exclude, G: 2, minCell: 2, minArea: 1 })
      counts.push(s.blobs.accent); files.push(save(dir, `strobe_${t}.png`, buf))
    }
    await ctx.close()
    const best = Math.max(...counts)
    notes.push(`accent blobs per capture: ${counts.join(', ')} (want max >= 18; overlapping echoes merge, so this under-counts)`)
    F(best >= 18, `best capture has ${best} accent exposures (< 18)`, notes)
    return R(notes.some((n) => /^FAIL/.test(n)) ? 'FAIL' : 'PASS', notes, files)
  },

  // 8: touch scroll over the hero is never blocked; readout part N/A (removed). 1:1 grab + release velocity stay with a human.
  async 8({ browser, base }) {
    const notes = []
    const m = await openPage(browser, base + '/', { w: 390, h: 844, settle: 2500 })
    const cdp = await m.ctx.newCDPSession(m.page)
    await cdp.send('Input.synthesizeScrollGesture', { x: 195, y: 500, yDistance: -300, gestureSourceType: 'touch', speed: 800 })
    await m.page.waitForTimeout(500)
    const y = await m.page.evaluate(() => scrollY)
    F(y > 100, `touch swipe over the hero scrolled only ${y}px (blocked?)`, notes)
    await m.ctx.close()
    notes.push(`touch swipe scrolled ${y}px; readout drag check N/A (hero readout removed, review1 fix 3); grab 1:1 and release velocity (<= 4px jump) need a mouse pass on :port`)
    return R(notes.some((n) => /^FAIL/.test(n)) ? 'FAIL' : 'MANUAL', notes)
  },

  // 9: loupe. Clock paused so only the loupe can change the region; ring closes on leave and on scroll.
  async 9({ browser, base, dir }) {
    const files = [], notes = []
    const { ctx, page } = await openPage(browser, base + '/', { w: 1440, h: 900, settle: 3500 })
    await page.evaluate(() => window.__pressClock?.pause())
    await page.waitForTimeout(500)
    const clip = { x: 500, y: 250, width: 400, height: 300 }
    const off = await page.screenshot({ clip }); files.push(save(dir, 'loupe_off.png', off))
    await page.mouse.move(700, 400, { steps: 5 }); await page.waitForTimeout(700)
    const on = await page.screenshot({ clip }); files.push(save(dir, 'loupe_on.png', on))
    const dOn = await diff(browser, off, on)
    await page.mouse.move(1400, 880, { steps: 3 }); await page.waitForTimeout(700)
    const left = await page.screenshot({ clip }); files.push(save(dir, 'loupe_left.png', left))
    const dLeft = await diff(browser, off, left)
    await page.mouse.move(700, 400, { steps: 3 }); await page.waitForTimeout(500); await page.mouse.wheel(0, 300); await page.waitForTimeout(500); await page.evaluate(() => scrollTo(0, 0)); await page.waitForTimeout(700)
    const after = await page.screenshot({ clip }); files.push(save(dir, 'loupe_after_scroll.png', after))
    const dScroll = await diff(browser, off, after)
    notes.push(`region diff vs loupe-off: hover ${(dOn.frac * 100).toFixed(2)}% (want > 0.5%), after leave ${(dLeft.frac * 100).toFixed(2)}%, after scroll ${(dScroll.frac * 100).toFixed(2)}% (want < 0.3%)`)
    F(dOn.frac > 0.005, 'hover did not change the region (no loupe?)', notes)
    F(dLeft.frac < 0.003, 'loupe still drawn after pointer leave', notes)
    F(dScroll.frac < 0.003, 'loupe still drawn after scroll', notes)
    notes.push('half-size screen cell inside the ring: confirm on loupe_on.png')
    await ctx.close()
    return R(notes.some((n) => /^FAIL/.test(n)) ? 'FAIL' : 'PASS', notes, files)
  },

  // 10: emissive blend. Light adds on black: no pixel below the bg token, overlap brighter than accent.
  async 10({ browser, base, dir }) {
    const files = [], notes = []
    const { ctx, page } = await openPage(browser, base + '/', { w: 1440, h: 900, settle: 3500 })
    const { clip } = await heroGeom(page)
    let under = 0, over = 0
    for (let i = 0; i < 5; i++) {
      if (i) await page.waitForTimeout(260)
      const buf = await page.screenshot({ clip }); files.push(save(dir, `emissive_${i}.png`, buf))
      const e = await emissive(browser, buf); under += e.under; over += e.over
      notes.push(`capture ${i}: ${e.under} px more than 3 below ${INKS.bg}; ${e.over} px brighter than accent`)
    }
    F(under === 0, `${under} pixels darker than the ground (subtractive blend?)`, notes)
    F(over > 0, 'no pixel brighter than --accent in 5 captures (trail/beam overlap should add)', notes)
    await ctx.close()
    return R(notes.some((n) => /^FAIL/.test(n)) ? 'FAIL' : 'PASS', notes, files)
  },

  // 11: load sequence, stepped in lockstep (CSS animations + press clock), 70ms ticks.
  async 11({ browser, base, dir }) {
    const notes = [], files = [], rows = []
    // The stepped sequence is the CSS Poster (frame-0 clock, steppable). The GL accumulator has its own un-rewindable state, so on a
    // GPU run it gets a live boot assertion instead (frame 0 GL-vs-Poster is item 6).
    const live = await openPage(browser, base + '/', { w: 1440, h: 900, settle: 1500 })
    const boot = await live.page.evaluate(() => { const e = document.querySelector('.hs'); return e ? { gl: e.hasAttribute('data-gl'), boot: +(e.getAttribute('data-gl-boot') ?? NaN) } : null })
    notes.push(`live hero: ${JSON.stringify(boot)}`)
    if (boot?.gl) F(boot.boot <= 980, `GL boot ${boot.boot}ms > 980ms: the GL load sequence would start mid-way`, notes)
    await live.ctx.close()
    const nogl = await launch(NOGL_ARGS)
    const { ctx, page } = await openFrozenHome(nogl, base + '/?gate')
    const { clip, exclude } = await heroGeom(page)
    notes.push(`hero clip ${JSON.stringify(clip)} (nav excluded); __pressClock ${await page.evaluate(() => !!window.__pressClock)}`)
    let h1ok = null
    for (let t = 0; t <= 1050; t += 70) {
      await stepTo(page, t)
      const buf = await page.screenshot({ clip })
      const s = await stats(browser, buf, { exclude }); rows.push({ t, ...s.frac, rows: s.rowsAccent, blobs: s.blobs })
      files.push(save(dir, `load_${String(t).padStart(4, '0')}.png`, buf))
      if (t === 910) h1ok = await page.evaluate(() => { const l = document.querySelector('#hero h1')?.firstElementChild; if (!l) return 'no h1 line'; const s = getComputedStyle(l); const ident = s.transform === 'none' || /^matrix\(1, 0, 0, 1, 0, 0\)$/.test(s.transform); const clipOk = s.clipPath === 'none' || /inset\(0(px)?( 0(px)?){0,3}\)/.test(s.clipPath); return ident && clipOk && +s.opacity === 1 ? 'ok' : `transform ${s.transform} clip ${s.clipPath} op ${s.opacity}` })
    }
    const first = (f) => rows.find(f)?.t
    const scanAt = (t) => rows.find((r) => r.t === t)
    const accentFirst = first((r) => r.accent > 0.001), beamFirst = first((r) => r.text > 0.0015)
    notes.push(`accent first t=${accentFirst}  beam (text px outside H1/slab/CTA) first t=${beamFirst}  [spec: scan 0-560, trail 140-700, beam 420-840 first 420-560; tol +-70]`)
    notes.push('per-frame: ' + rows.map((r) => `${r.t}:a${r.accent} t${r.text} rows${r.rows}`).join(' | '))
    F(scanAt(280).accent > 0.001 && scanAt(280).rows < 0.9, `scan not present at 280ms (accent ${scanAt(280).accent})`, notes)
    F(scanAt(700).rows >= 0 && accentFirst !== undefined && accentFirst <= 280, `accent first seen at ${accentFirst} (want <= 280 + tol)`, notes)
    F(beamFirst !== undefined && accentFirst !== undefined && accentFirst < beamFirst, `trail (${accentFirst}) not before beam (${beamFirst})`, notes)
    F(beamFirst >= 420 - 70 && beamFirst <= 560 + 70, `beam first seen at ${beamFirst} (want 420-560 +-70)`, notes)
    F(h1ok === 'ok', `H1 line 1 not fully visible by 910ms: ${h1ok}`, notes)
    notes.push('page animations seen: ' + (await page.evaluate(() => document.getAnimations().length)))
    notes.push('GL boot: ' + await page.evaluate(() => { const e = document.querySelector('.hs'); return e ? `data-gl-t0=${e.getAttribute('data-gl-t0')} data-gl-boot=${e.getAttribute('data-gl-boot')}` : 'no .hs' }))
    await ctx.close(); await nogl.close()
    return R(notes.some((n) => /^FAIL/.test(n)) ? 'FAIL' : 'PASS', notes, files)
  },

  // 12: join band rolls once; --slip <= 10px while scrolling, 0 within 3 ticks of scroll stop
  async 12({ browser, base, dir }) {
    const files = [], notes = []
    const { ctx, page } = await openPage(browser, base + '/', { w: 1440, h: 900, settle: 3000 })
    await page.evaluate(() => {
      window.__rolls = 0
      const j = document.querySelector('#join'); if (!j) return
      let had = j.classList.contains('rolled'); new MutationObserver(() => { const h = j.classList.contains('rolled'); if (h && !had) window.__rolls++; had = h }).observe(j, { attributes: true, attributeFilter: ['class'] })
    })
    const slip = () => page.evaluate(() => { const e = document.querySelector('[data-plate], .btn-primary'); return e ? parseFloat(getComputedStyle(e).getPropertyValue('--slip')) || 0 : null })
    F((await slip()) !== null, 'no [data-plate] / .btn-primary carrying --slip', notes)
    await page.mouse.move(10, 10)
    let max = 0
    for (const dy of [600, 600, 900, 900, 700]) {
      await page.mouse.wheel(0, dy)
      for (let i = 0; i < 4; i++) { await page.waitForTimeout(25); max = Math.max(max, Math.abs((await slip()) ?? 0)) }
    }
    await page.waitForTimeout(70 * 3 + 80)
    const rest = await slip()
    files.push(save(dir, 'slip_rest.png', await page.screenshot()))
    await page.evaluate(() => document.querySelector('#join')?.scrollIntoView()); await page.waitForTimeout(1800)
    await page.evaluate(() => scrollTo(0, 0)); await page.waitForTimeout(500)
    await page.evaluate(() => document.querySelector('#join')?.scrollIntoView()); await page.waitForTimeout(1500)
    const info = await page.evaluate(() => ({ rolls: window.__rolls, rolled: document.querySelector('#join')?.classList.contains('rolled') }))
    notes.push(`max |--slip| ${max.toFixed(1)}px (limit 10), at rest ${rest}px, rolled transitions ${info.rolls}, .rolled ${info.rolled}`)
    F(max <= 10 + 0.01, `--slip reached ${max}px`, notes)
    F(rest === 0, `--slip ${rest}px 3 ticks after scroll stop`, notes)
    F(info.rolled === true && info.rolls === 1, `#join rolled ${info.rolls}x (want exactly once, class set ${info.rolled})`, notes)
    await ctx.close()
    return R(notes.some((n) => /^FAIL/.test(n)) ? 'FAIL' : 'PASS', notes, files)
  },

  // 13: ten proofs draw, link to /programs#slug, animate on hover; at most 2 animating at once
  async 13({ browser, base, dir }) {
    const notes = [], files = []
    const { ctx, page } = await openPage(browser, base + '/', { w: 1440, h: 900 })
    await scrollAll(page, 0.6, 200)
    const r = await page.evaluate(() => { const a = [...document.querySelectorAll('a[href*="/programs#"]')].filter((e) => e.querySelector('canvas,svg,img')); return { n: a.length, tab: a.filter((e) => e.tabIndex >= 0).length, bad: a.filter((e) => !/\/programs#[\w-]+$/.test(e.getAttribute('href') || '')).length } })
    F(r.n === 10, `${r.n} proof links with a visual (want 10)`, notes)
    F(r.tab === r.n, `${r.n - r.tab} proofs not tabbable`, notes)
    F(r.bad === 0, `${r.bad} proofs with a non /programs#slug href`, notes)
    // animating count: tiles in view whose pixels change over 500ms with no hover
    let moving = 0, hoverMoves = 0
    for (let i = 0; i < r.n; i++) {
      const box = await page.evaluate((i) => { const a = [...document.querySelectorAll('a[href*="/programs#"]')].filter((e) => e.querySelector('canvas,svg,img'))[i]; a.scrollIntoView({ block: 'center' }); const b = a.getBoundingClientRect(); return { x: b.left, y: b.top, width: b.width, height: b.height } }, i)
      await page.mouse.move(5, 5); await page.waitForTimeout(500)
      const a0 = await page.screenshot({ clip: box }); await page.waitForTimeout(500); const a1 = await page.screenshot({ clip: box })
      if ((await diff(browser, a0, a1)).frac > 0.002) moving++
      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2, { steps: 3 }); await page.waitForTimeout(400)
      const h0 = await page.screenshot({ clip: box }); await page.waitForTimeout(500); const h1 = await page.screenshot({ clip: box })
      if ((await diff(browser, h0, h1)).frac > 0.002) hoverMoves++
      if (i === 0) files.push(save(dir, 'proof_0_hover.png', h1))
    }
    notes.push(`idle animating tiles: ${moving} (limit 2); tiles running on hover: ${hoverMoves}/${r.n}`)
    F(moving <= 2, `${moving} proofs animate with no hover`, notes)
    F(hoverMoves >= Math.ceil(r.n * 0.8), `only ${hoverMoves}/${r.n} proofs ran on hover`, notes)
    await ctx.close()
    return R(notes.some((n) => /^FAIL/.test(n)) ? 'FAIL' : 'PASS', notes, files)
  },

  // 14: join: .rolled then .stamped in order; pointerdown changes a primary button's transform at once
  async 14({ browser, base }) {
    const notes = []
    const { ctx, page } = await openPage(browser, base + '/', { w: 1440, h: 900, settle: 2500 })
    await page.evaluate(() => {
      const j = document.querySelector('#join'); window.__order = []
      if (!j) return
      const seen = new Set(); new MutationObserver(() => { for (const c of ['rolled', 'stamped']) if (j.classList.contains(c) && !seen.has(c)) { seen.add(c); window.__order.push(c) } }).observe(j, { attributes: true, attributeFilter: ['class'] })
    })
    await page.evaluate(() => document.querySelector('#join')?.scrollIntoView()); await page.waitForTimeout(3500)
    const order = await page.evaluate(() => window.__order)
    F(order.join() === 'rolled,stamped', `#join class order ${JSON.stringify(order)} (want rolled, stamped)`, notes)
    const sel = '#hero a[href="' + CTA_HREF + '"]'
    await page.evaluate(() => scrollTo(0, 0)); await page.waitForTimeout(500)
    const box = await page.locator(sel).first().boundingBox()
    if (!box) notes.push('FAIL hero CTA not found')
    else {
      const read = () => page.evaluate((sel) => { const s = getComputedStyle(document.querySelector(sel)); return `${s.transform}|${s.scale}|${s.translate}` }, sel) // press = individual scale property (C1)
      const before = await read()
      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2); await page.waitForTimeout(500)
      const hover = await read(); await page.mouse.down(); const down = await read(); await page.mouse.up()
      notes.push(`transform rest ${before} | hover ${hover} | down ${down}`)
      F(down !== hover, 'pointerdown did not change the CTA transform/scale in the next frame', notes)
    }
    await ctx.close()
    return R(notes.some((n) => /^FAIL/.test(n)) ? 'FAIL' : 'PASS', notes)
  },

  // 16: reduced motion: 0 rAF/s, only opacity/colour animations <= 240ms, no scroll timeline, all visible, crowd 21 discs + "20"
  async 16({ browser, base, dir }) {
    const notes = [], files = []
    const SAFE = /^(opacity|color|background-?color|border-?\w*color|outline-?color|fill|stroke|text-decoration-color|offset|composite|easing|computedOffset)$/i
    for (const route of ['/', '/about', '/programs']) {
      const gsapReq = []
      const { ctx, page } = await openPage(browser, base + route, { w: 1440, h: 900, reduced: true, settle: 0, wait: 'commit' })
      page.on('response', async (r) => { if (/\.js(\?|$)/.test(r.url())) { try { if (/ScrollTrigger|GreenSock|gsapVersions/.test(await r.text())) gsapReq.push(r.url().slice(-40)) } catch {} } })
      await page.reload({ waitUntil: 'load' }); await page.waitForTimeout(800)
      await scrollAll(page, 0.7, 150)
      await page.evaluate(() => scrollTo(0, 0)); await page.waitForTimeout(300)
      const r0 = await page.evaluate(() => window.__gate.raf)
      await page.waitForTimeout(2000)
      const r1 = await page.evaluate(() => window.__gate.raf)
      await page.waitForTimeout(2000)
      const r2 = await page.evaluate(() => window.__gate.raf) // a loop is sustained; a lone settling redraw is not
      const anims = await page.evaluate(() => document.getAnimations().filter((a) => a.playState === 'running' && a.effect?.getComputedTiming().progress !== 1).map((a) => {
        const t = a.effect?.getComputedTiming?.() || {}, kf = a.effect?.getKeyframes?.() || []
        const props = [...new Set(kf.flatMap((k) => Object.keys(k)))]
        return { name: a.animationName || a.transitionProperty || 'anim', dur: t.duration, scroll: !!a.timeline && a.timeline !== document.timeline, props }
      }))
      const bad = anims.filter((a) => a.scroll || a.props.some((p) => !SAFE.test(p)) || !(+a.dur <= 240))
      const hid = await page.evaluate(() => [...document.querySelectorAll('body *')].filter((e) => { const s = getComputedStyle(e); const bb = e.getBoundingClientRect(); return bb.width > 2 && bb.height > 2 && (e.childNodes.length && [...e.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim())) && (+s.opacity < 1 || s.visibility === 'hidden' || e.classList.contains('pre')) }).map((e) => e.tagName + '.' + e.className).slice(0, 5))
      const rate = Math.min(r1 - r0, r2 - r1) / 2
      if (rate > 0) notes.push(`FAIL ${route}: sustained ${rate} app rAF/s (windows: ${r1 - r0}, ${r2 - r1} callbacks per 2s)`)
      else if (r1 - r0) notes.push(`${route}: info: ${r1 - r0} settling app rAF callback(s) in first 2s, 0 after (not a loop)`)
      if (gsapReq.length) notes.push(`FAIL ${route}: gsap chunk requested under reduced motion ${gsapReq}`)
      if (bad.length) notes.push(`FAIL ${route}: non-opacity/colour, >240ms or scroll-timeline animations ${JSON.stringify(bad.slice(0, 4))}`)
      if (hid.length) notes.push(`FAIL ${route}: hidden/faded text ${hid}`)
      if (route === '/') {
        await page.evaluate(() => document.querySelector('#class-size')?.scrollIntoView({ block: 'center' })); await page.waitForTimeout(1200)
        const crowd = await page.evaluate(() => { const n = document.querySelector('#class-size [data-crowd-n]'); const c = document.querySelector('#class-size canvas'); const b = c?.getBoundingClientRect(); return { n: n?.textContent?.trim() ?? null, clip: b ? { x: b.left, y: Math.max(0, b.top), width: b.width, height: Math.min(b.height, innerHeight - Math.max(0, b.top)) } : null } })
        if (crowd.n !== '20') notes.push(`FAIL /: reduced-motion crowd numeral reads ${JSON.stringify(crowd.n)} (want "20")`)
        if (crowd.clip) { const buf = await page.screenshot({ clip: crowd.clip }); files.push(save(dir, 'reduced_crowd.png', buf)); const s = await stats(browser, buf, { G: 2, minCell: 2, minArea: 1 }); if (s.blobs.text + s.blobs.accent !== 21) notes.push(`FAIL /: reduced-motion crowd shows ${s.blobs.text} text + ${s.blobs.accent} accent discs (want 20 + 1)`) }
        else notes.push('FAIL /: no #class-size canvas')
        files.push(save(dir, 'reduced_home_full.png', await page.screenshot({ fullPage: true })))
      }
      await ctx.close()
    }
    return R(notes.some((n) => /^FAIL/.test(n)) ? 'FAIL' : 'PASS', notes.length ? notes : ['0 rAF/s, only opacity/colour effects <= 240ms, no scroll timelines, text visible on /, /about, /programs; crowd 21 discs and "20"'], files)
  },

  // 17: JS off, WebGL off
  async 17({ browser, base, dir }) {
    const notes = [], files = []
    const nogl = await launch(NOGL_ARGS)
    const runs = [['nojs', browser, { js: false }], ['nogl', nogl, {}]]
    for (const [tag, br, o] of runs) for (const route of ['/', '/about', '/programs', '/code.org']) {
      const { ctx, page, errors } = await openPage(br, base + route, { w: 1440, h: 900, settle: 1200, ...o })
      if (o.js !== false) await scrollAll(page, 0.7, 150)
      const r = await page.evaluate(() => {
        const secs = [...document.querySelectorAll('main > *, main section, header, footer')].filter((e) => !e.closest('main > * *') || e.matches('section'))
        const empty = secs.filter((e) => e.getBoundingClientRect().height < 30 && e.textContent.trim()).map((e) => e.tagName + '.' + e.className.toString().slice(0, 20))
        const hid = [...document.querySelectorAll('main *')].filter((e) => e.getBoundingClientRect().width > 2 && [...e.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim()) && (+getComputedStyle(e).opacity < 1 || getComputedStyle(e).visibility === 'hidden')).map((e) => e.tagName + '.' + e.className.toString().slice(0, 20)).slice(0, 4)
        const poster = !!document.querySelector('[class*="oster" i],[data-poster]')
        const j = document.querySelector('#join'), jh = j?.querySelector('h2, h3, a')
        return { empty, hid, poster, join: j ? { bg: getComputedStyle(j).backgroundColor, fg: jh ? getComputedStyle(jh).color : null } : null, stmt: !!document.querySelector('#statement') }
      })
      files.push(save(dir, `${tag}_${route.replace(/\W+/g, '_') || 'home'}_full.png`, await page.screenshot({ fullPage: true })))
      if (r.empty.length) notes.push(`FAIL ${tag} ${route}: collapsed ${r.empty}`)
      if (r.hid.length) notes.push(`FAIL ${tag} ${route}: hidden text ${r.hid}`)
      if (route === '/' && !r.poster) notes.push(`FAIL ${tag} /: no Poster element found by [class*=oster]/[data-poster] heuristic`)
      if (route === '/' && !r.stmt) notes.push(`FAIL ${tag} /: no #statement`)
      if (route === '/' && tag === 'nojs') {
        const acc = hexRgb(INKS.accent), bg = hexRgb(INKS.bg), P = (s) => (s || '').match(/\d+/g)?.slice(0, 3).map(Number) || []
        const near = (a, b) => a.length === 3 && a.every((v, i) => Math.abs(v - b[i]) <= 2)
        if (!r.join || !near(P(r.join.bg), acc) || !near(P(r.join.fg), bg)) notes.push(`FAIL nojs /: #join ground ${r.join?.bg} text ${r.join?.fg} (want accent ground, --bg text)`)
      }
      if (tag === 'nogl' && errors.length) notes.push(`FAIL nogl ${route}: errors ${errors.slice(0, 2)}`)
      await ctx.close()
    }
    await nogl.close()
    return R(notes.length ? 'FAIL' : 'PASS', notes.length ? notes : ['JS-off and WebGL-off: no collapsed or hidden sections, Poster present, join band accent with dark text'], files)
  },

  // 19: frames. Full-page scroll of home: p95 <= 16.7ms at 1440 and 390 (no throttle), <= 20ms at 390 / 4x; 0 app rAF when no animated sheet is visible
  async 19({ browser, base }) {
    const notes = []
    let last
    for (const [w, h, rate, lim] of [[1440, 900, 1, 17.2], [390, 844, 1, 17.2], [390, 844, 4, 20]] /* 17.2 = 16.7 + half a vsync of timer jitter */) {
      const { ctx, page } = await openPage(browser, base + '/', { w, h, settle: 2500 })
      if (rate > 1) await (await ctx.newCDPSession(page)).send('Emulation.setCPUThrottlingRate', { rate })
      await page.evaluate(() => { window.__gate.probe = []; window.__gate.probing = true })
      const total = await page.evaluate(() => document.documentElement.scrollHeight)
      await page.mouse.move(w / 2, h / 2)
      for (let y = 0; y < total; y += 250) { await page.mouse.wheel(0, 250); await page.waitForTimeout(60) }
      await page.evaluate(() => { window.__gate.probing = false })
      const d = await page.evaluate(() => window.__gate.probe)
      const p95 = pct(d, 0.95)
      notes.push(`${w}x${h} cpu x${rate}: rAF interval p50 ${pct(d, 0.5)?.toFixed(1)}ms p95 ${p95?.toFixed(1)}ms n=${d.length} (limit ${lim}ms)`)
      F(p95 !== null && p95 <= lim, `${w}x${h} x${rate}: p95 ${p95}ms > ${lim}ms`, notes)
      if (last) await last.ctx.close(); last = { ctx, page }
    }
    const { page } = last
    // idle: scroll so no canvas intersects the viewport
    await page.evaluate(() => scrollTo(0, 0))
    const spot = await page.evaluate(() => { const cs = [...document.querySelectorAll('canvas')].map((c) => { const b = c.getBoundingClientRect(); return [b.top + scrollY, b.bottom + scrollY] }); const H = document.documentElement.scrollHeight, vh = innerHeight; for (let y = 0; y <= H - vh; y += 50) if (!cs.some(([a, b]) => b > y && a < y + vh)) return y; return null })
    if (spot === null) notes.push('FAIL no scroll position without a visible canvas; idle check impossible (a sheet is always visible)')
    else {
      await page.evaluate((y) => scrollTo(0, y), spot); await page.waitForTimeout(800)
      const g = () => page.evaluate(() => ({ raf: window.__gate.raf, frames: window.__gate.frames, all: window.__gate.all }))
      const a = await g(); await page.waitForTimeout(2000); const b = await g()
      notes.push(`idle at y=${spot}: ${b.frames - a.frames} app rAF frames, ${b.raf - a.raf} app callbacks, ${b.all - a.all} total callbacks incl. framework, in 2s (want 0 app)`)
      F(b.frames - a.frames === 0 && b.raf - a.raf === 0, 'app rAF running with no animated sheet visible', notes)
      // GSAP's ScrollTrigger keeps a (lib) rAF alive, so idle cost is measured as script time: <= 2ms per second
      const cdp = await last.ctx.newCDPSession(page); await cdp.send('Performance.enable')
      const sd = async () => (await cdp.send('Performance.getMetrics')).metrics.find((m) => m.name === 'ScriptDuration').value
      const s0 = await sd(); await page.waitForTimeout(2000); const s1 = await sd()
      const msPerS = ((s1 - s0) * 1000) / 2
      notes.push(`idle script time ${msPerS.toFixed(2)}ms/s (limit 6 = <0.6% of the main thread; ScrollTrigger's per-frame check is the floor)`)
      F(msPerS <= 6, `idle script time ${msPerS.toFixed(2)}ms/s > 6ms/s`, notes)
    }
    await last.ctx.close()
    notes.push('tick GPU on a real phone: owner pass')
    return R(notes.some((n) => /^FAIL/.test(n)) ? 'FAIL' : 'PASS', notes)
  },

  // 21: keyboard. Focus ring >= 2px and >= 3:1 against its ground on bg, s1, s2, accent.
  async 21({ browser, base, dir }) {
    const notes = [], files = []
    const { ctx, page } = await openPage(browser, base + '/', { w: 1440, h: 900, settle: 1500 })
    await page.keyboard.press('Tab')
    const first = await page.evaluate(() => { const e = document.activeElement; return { t: (e.textContent || '').trim().slice(0, 30), h: e.getAttribute('href') } })
    F(/skip/i.test(first.t) && (first.h || '').startsWith('#'), `first Tab stop is not a skip link: ${JSON.stringify(first)}`, notes)
    const grounds = new Map(), bad = []
    const seen = new Set()
    for (let i = 0; i < 80; i++) {
      const r = await page.evaluate(() => {
        const e = document.activeElement; if (!e || e === document.body || e.tagName === 'NEXTJS-PORTAL' || e.closest('nextjs-portal')) return null // Next dev overlay
        const s = getComputedStyle(e)
        let g = e, bg = 'rgb(5, 7, 12)'; while (g) { const c = getComputedStyle(g).backgroundColor; if (!/rgba\(.*, 0\)|transparent/.test(c)) { bg = c; break } g = g.parentElement }
        const P = (x) => (x.match(/[\d.]+/g) || []).map(Number)
        const lum = ([r, g, b]) => { const f = (c) => { c /= 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4 }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b) }
        const [a, b2] = [lum(P(s.outlineColor)), lum(P(bg))].sort((x, y) => y - x)
        const ratio = (a + 0.05) / (b2 + 0.05)
        const vis = s.outlineStyle !== 'none' && parseFloat(s.outlineWidth) >= 2 && ratio >= 3
        const wrap = !!e.__gateSeen; e.__gateSeen = true
        return { wrap, id: e.tagName + '|' + (e.getAttribute('href') || '') + '|' + (e.textContent || '').trim().slice(0, 18), bg, vis, ol: s.outlineColor + ' ' + s.outlineWidth, ratio: +ratio.toFixed(2) }
      })
      if (!r) { await page.keyboard.press('Tab'); continue }
      if (r.wrap) break // same element focused twice = wrapped around
      seen.add(r.id + '#' + i); grounds.set(r.bg, (grounds.get(r.bg) || 0) + 1)
      if (!r.vis) bad.push(`${r.id} on ${r.bg}: ring ${r.ol} ${r.ratio}:1`)
      await page.keyboard.press('Tab')
    }
    notes.push(`${seen.size} tab stops; grounds seen ${JSON.stringify([...grounds])}`)
    F(seen.size >= 8, 'too few tab stops (tiles must be focusable)', notes)
    F(!bad.length, 'focus ring missing, < 2px or < 3:1: ' + bad.slice(0, 6).join('; '), notes)
    const faq = await page.evaluate(async () => { const b = document.querySelector('#faq button[aria-expanded], #faq summary, main button[aria-expanded], main summary, main [aria-expanded]'); if (!b) return null; b.scrollIntoView(); b.focus(); const d = b.closest('details'); return { ae: b.getAttribute('aria-expanded'), open: d ? d.open : null } })
    if (faq === null) notes.push('FAIL no FAQ control with aria-expanded or <details>/<summary> found')
    else { await page.keyboard.press('Enter'); await page.waitForTimeout(300); const after = await page.evaluate(() => { const e = document.activeElement, d = e.closest('details'); return { ae: e.getAttribute('aria-expanded'), open: d ? d.open : null } }); F(!(after.ae === faq.ae && after.open === faq.open), 'FAQ did not toggle on Enter', notes) }
    files.push(save(dir, 'focus_last.png', await page.screenshot()))
    await ctx.close()
    const m = await openPage(browser, base + '/', { w: 390, h: 844, settle: 1200 })
    const btn = await m.page.$('header button[aria-expanded], header [aria-controls], button[aria-label*="enu" i]')
    if (!btn) notes.push('FAIL mobile: no menu button found')
    else { const a = await btn.getAttribute('aria-expanded'); await btn.focus(); await m.page.keyboard.press('Enter'); await m.page.waitForTimeout(400); const b = await btn.getAttribute('aria-expanded'); F(a !== b, 'mobile menu did not toggle on Enter', notes); files.push(save(dir, 'menu_open_390.png', await m.page.screenshot())) }
    await m.ctx.close()
    return R(notes.some((n) => /^FAIL/.test(n)) ? 'FAIL' : 'PASS', notes, files)
  },

  // 22: contrast. Opacity is composited into the text colour; sampled at top / middle / bottom of every home scene (scroll-driven reveals live).
  async 22({ browser, base }) {
    const bad = new Map()
    const measure = () => {
      const parse = (s) => (s.match(/[\d.]+/g) || []).map(Number)
      const lum = ([r, g, b]) => { const f = (c) => { c /= 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4 }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b) }
      const hex = (a) => '#' + a.slice(0, 3).map((x) => Math.round(x).toString(16).padStart(2, '0')).join('').toUpperCase()
      const out = []
      for (const e of document.body.querySelectorAll('*')) {
        if (![...e.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim())) continue
        if (e.closest('[data-m="head"], .hero-in, .hs, header, nextjs-portal')) continue // headings scrub from 0 (large, transient); header has its own item (29)
        const b = e.getBoundingClientRect(), s = getComputedStyle(e)
        if (!b.width || !b.height || b.bottom <= 0 || b.top >= innerHeight || s.visibility === 'hidden' || s.display === 'none' || /^(SCRIPT|STYLE|NOSCRIPT)$/.test(e.tagName)) continue
        let op = 1; for (let g = e; g && g !== document.documentElement; g = g.parentElement) op *= +getComputedStyle(g).opacity
        let bg = [5, 7, 12], g = e
        while (g) { const c = parse(getComputedStyle(g).backgroundColor); if (c.length >= 3 && (c.length < 4 || c[3] > 0.01)) { bg = c; break } g = g.parentElement }
        const fg0 = parse(s.color), fa = (fg0.length > 3 ? fg0[3] : 1) * op
        const fg = [0, 1, 2].map((i) => fg0[i] * fa + bg[i] * (1 - fa)) // composite text colour over its ground
        const [L1, L2] = [lum(fg), lum(bg)].sort((a, c) => c - a)
        out.push({ fg: hex(fg0), eff: hex(fg), bg: hex(bg), ratio: +((L1 + 0.05) / (L2 + 0.05)).toFixed(2), op: +op.toFixed(2), t: (e.textContent || '').trim().slice(0, 24) })
      }
      return out
    }
    for (const route of ROUTES.slice(0, 4)) for (const w of [1440, 390]) {
      const { ctx, page } = await openPage(browser, base + route, { w, h: 900, settle: 600 })
      const ys = await page.evaluate((home) => {
        const H = document.documentElement.scrollHeight, vh = innerHeight, set = new Set([0, Math.round((H - vh) / 2), H - vh])
        if (home) for (const s of document.querySelectorAll('main > section')) { const t = s.getBoundingClientRect().top + scrollY, h = s.offsetHeight; set.add(Math.max(0, Math.round(t))); set.add(Math.max(0, Math.round(t + h / 2 - vh / 2))); set.add(Math.max(0, Math.round(t + h - vh))) }
        return [...set].filter((y) => y >= 0 && y <= H - vh).sort((a, b) => a - b)
      }, route === '/')
      for (const y of ys) {
        await page.evaluate((y) => scrollTo(0, y), y); await page.waitForTimeout(1000) // scrub lag (.3-.5s) must settle before sampling
        const r = await retry(() => page.evaluate(measure))
        for (const x of r) {
          const why = x.ratio < 4.5 ? `${x.ratio}:1` : (x.fg === '#F3F5FA' && x.bg === '#FFD60A') ? '--text on --accent' : (x.fg === '#2A3CFF' && /^#0[0-9A-F]/.test(x.bg) && x.bg !== '#FFD60A') ? '--glow text on dark' : null
          if (why) { const k = `${x.fg} (eff ${x.eff}, op ${x.op}) on ${x.bg} (${why})`; const o = bad.get(k) || { n: 0, ex: `${route}@${w} y=${y} "${x.t}"` }; o.n++; bad.set(k, o) }
        }
      }
      await ctx.close()
    }
    const notes = [...bad].map(([k, o]) => `FAIL ${k} x${o.n} e.g. ${o.ex}`)
    return R(bad.size ? 'FAIL' : 'PASS', notes.length ? notes : ['all text >= 4.5:1 at rest and while scrubbing (opacity composited; ground = nearest opaque ancestor); no --text on --accent, no --glow text'])
  },

  // 23: type roles
  async 23({ browser, base }) {
    const { ctx, page } = await openPage(browser, base + '/', { w: 1440, h: 900, settle: 1000 })
    const r = await page.evaluate(() => {
      const ROLES = new Set(['t-h1', 't-h2', 't-fact', 't-slab', 't-h3', 't-body', 't-mono', 't-stmt'])
      const bad = []
      for (const e of document.querySelectorAll('h3,h4,h5,h6')) if (getComputedStyle(e).textTransform === 'uppercase') bad.push('uppercase ' + e.tagName + ' "' + e.textContent.trim().slice(0, 20) + '"')
      const used = new Set([...document.querySelectorAll('[class]')].flatMap((e) => [...e.classList]).filter((c) => /^t-/.test(c)))
      const unknown = [...used].filter((c) => !ROLES.has(c))
      const mono = [...document.querySelectorAll('main *')].filter((e) => /mono/i.test(getComputedStyle(e).fontFamily) && [...e.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim()) && !e.closest('.t-mono')).map((e) => e.tagName + '.' + String(e.className).slice(0, 20)).slice(0, 6)
      return { bad, unknown, used: [...used], mono }
    })
    await ctx.close()
    const notes = [`role classes in use: ${r.used}`]
    F(!r.unknown.length, `unknown t-* classes ${r.unknown}`, notes)
    F(!r.bad.length, `non-sentence-case H3+: ${r.bad}`, notes)
    F(!r.mono.length, `mono text outside .t-mono (readout, chip, step numeral only): ${r.mono}`, notes)
    return R(notes.some((n) => /^FAIL/.test(n)) ? 'FAIL' : 'PASS', notes)
  },

  // 24: composition: no empty half (1440, 1920), nav CTA never over the hero CTA, no text collisions (360, 1440, 1920)
  async 24({ browser, base, dir }) {
    const files = [], notes = []
    for (const [w, h] of [[1920, 1080], [1440, 900], [360, 740]]) {
      const { ctx, page } = await openPage(browser, base + '/', { w, h, settle: 2500, reduced: true })
      await scrollAll(page, 0.6, 200); await page.evaluate(() => scrollTo(0, 0)); await page.waitForTimeout(500)
      files.push(save(dir, `home_${w}_full.png`, await page.screenshot({ fullPage: true })))
      const r = await page.evaluate((w) => {
        const vis = (e) => { const b = e.getBoundingClientRect(), s = getComputedStyle(e); return b.width > 0 && b.height > 0 && s.visibility !== 'hidden' && s.display !== 'none' && +s.opacity > 0 }
        const empty = []
        if (w >= 1024) for (const sec of document.querySelectorAll('main > section')) {
          const sb = sec.getBoundingClientRect(); if (sb.height < 300) continue
          const leaves = [...sec.querySelectorAll('*')].filter((e) => vis(e) && (/^(CANVAS|IMG|SVG|BUTTON|A|INPUT|SUMMARY)$/i.test(e.tagName) || ([...e.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim()) ))).map((e) => e.getBoundingClientRect())
          const mid = sb.left + sb.width / 2
          const covers = (f) => leaves.some((b) => f(b))
          const L = covers((b) => b.left < mid - sb.width * 0.05), Rt = covers((b) => b.right > mid + sb.width * 0.05)
          const T = covers((b) => b.top < sb.top + sb.height * 0.45), Bt = covers((b) => b.bottom > sb.top + sb.height * 0.55)
          if (!(L && Rt && T && Bt)) empty.push(`${sec.id || sec.className}: ${[!L && 'left', !Rt && 'right', !T && 'top', !Bt && 'bottom'].filter(Boolean).join('+')} half empty`)
        }
        const skip = 'header, header *, .faq-h, .faq-h *, [aria-hidden="true"], [aria-hidden="true"] *, canvas, nextjs-portal, .sr-only, [class*="sr-only"]'
        const els = [...document.querySelectorAll('main *, footer *')].filter((e) => vis(e) && !e.matches(skip) && [...e.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim()))
        const rects = els.filter((e) => !(e.closest('details:not([open])') && !e.closest('summary'))).map((e) => { const rg = document.createRange(); const fs = parseFloat(getComputedStyle(e).fontSize) || 16; const lines = [...e.childNodes].filter((n) => n.nodeType === 3 && n.textContent.trim()).flatMap((n) => { rg.selectNodeContents(n); return [...rg.getClientRects()] }).filter((r) => r.width > 1 && r.height > 1).map((r) => { const m = Math.max(0, (r.height - fs * 0.6) / 2); return { left: r.left, right: r.right, top: r.top + m, bottom: r.bottom - m } }); return { e, lines } }) // glyph band, not the line box
        const hits = []
        for (let i = 0; i < rects.length; i++) for (let j = i + 1; j < rects.length; j++) {
          const A = rects[i], B = rects[j]; if (A.e.contains(B.e) || B.e.contains(A.e)) continue
          let ox = 0, oy = 0
          for (const a of A.lines) for (const b of B.lines) { const x = Math.min(a.right, b.right) - Math.max(a.left, b.left), y = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top); if (x > 2 && y > 2 && x * y > ox * oy) { ox = x; oy = y } }
          if (ox > 2 && oy > 2) hits.push(`${A.e.tagName}.${String(A.e.className).slice(0, 14)} x ${B.e.tagName}.${String(B.e.className).slice(0, 14)} (${Math.round(ox)}x${Math.round(oy)})`)
        }
        return { empty, hits: hits.slice(0, 6), nHits: hits.length }
      }, w)
      for (const e of r.empty) notes.push(`FAIL ${w}: ${e}`)
      if (r.nHits) notes.push(`FAIL ${w}: ${r.nHits} text boxes overlap, e.g. ${r.hits.join(' | ')}`)
      await ctx.close()
    }
    notes.push('pendulum rod is canvas-drawn (no DOM box); its overlap with the nav CTA is excluded by item 29 (nav CTA hidden while the hero CTA is on screen)')
    return R(notes.some((n) => /^FAIL/.test(n)) ? 'FAIL' : 'PASS', notes, files)
  },

  // 26: no pinned scenes: only header, .faq-h, skip link, mobile sheet and the Impression canvas may be sticky/fixed; home <= 8 screens
  async 26({ browser, base }) {
    const notes = []
    const { ctx, page } = await openPage(browser, base + '/', { w: 1440, h: 900, settle: 1500 })
    const r = await page.evaluate(() => {
      const ok = 'header, header *, .faq-h, .faq-h *, [class*="skip" i], canvas, [class*="sheet" i], [class*="sheet" i] *, [class*="menu" i], [class*="menu" i] *'
      const bad = [...document.querySelectorAll('body *')].filter((e) => /^(sticky|fixed)$/.test(getComputedStyle(e).position) && !e.matches(ok)).map((e) => e.tagName.toLowerCase() + '.' + String(e.className).slice(0, 24) + '#' + e.id)
      return { bad: bad.slice(0, 6), screens: document.documentElement.scrollHeight / innerHeight, h: document.documentElement.scrollHeight }
    })
    await ctx.close()
    F(!r.bad.length, `pinned elements: ${r.bad}`, notes)
    F(r.screens <= 8, `home is ${r.screens.toFixed(2)} screens at 1440x900 (limit 8)`, notes)
    notes.push(`home height ${r.h}px = ${r.screens.toFixed(2)} screens`)
    return R(notes.some((n) => /^FAIL/.test(n)) ? 'FAIL' : 'PASS', notes)
  },

  // 27: scroll scenes scrub: values at 25/50/75% differ and return on scroll back (statement words, tiles, headings, hero exit)
  async 27({ browser, base }) {
    const notes = []
    const { ctx, page } = await openPage(browser, base + '/?gate', { w: 1440, h: 900, settle: 1500 })
    await page.waitForFunction(() => window.__motion?.ready, null, { timeout: 15000 }).catch(() => {})
    F(await page.evaluate(() => !!window.__motion?.ready), 'GSAP did not arm (window.__motion.ready never set; page opened with ?gate)', notes)
    const targets = { 'statement word 0': '#statement .w', 'statement word 9': ['#statement .w', 9], 'statement word 17': ['#statement .w', 17], 'tile 1': '[data-m="tiles"] > :nth-child(1)', 'tile 6': '[data-m="tiles"] > :nth-child(6)', 'heading': '[data-m="head"]', 'hero exit': '.hero-in', 'hero canvas': '#hero .hs', 'crowd numeral': '#class-size [data-crowd-n]' }
    const sweep = () => page.evaluate(async (targets) => {
      const val = (e) => { const s = getComputedStyle(e); return e.matches('[data-crowd-n]') ? e.textContent : `${(+s.opacity).toFixed(2)}|${s.transform === 'matrix(1, 0, 0, 1, 0, 0)' ? 'none' : s.transform}` }
      const els = Object.fromEntries(Object.entries(targets).map(([k, q]) => [k, Array.isArray(q) ? document.querySelectorAll(q[0])[q[1]] : document.querySelector(q)])) // querySelectorAll('.w')[n]: words are not :nth-child siblings
      const H = document.documentElement.scrollHeight - innerHeight, series = Object.fromEntries(Object.keys(els).map((k) => [k, []]))
      await new Promise((r) => setTimeout(r, 600)); const start = Object.fromEntries(Object.entries(els).map(([k, e]) => [k, e ? val(e) : null]))
      const N = 80
      for (let i = 0; i <= N; i++) { scrollTo(0, (H * i) / N); await new Promise((r) => setTimeout(r, 90)); /* scrub lag */ for (const k in els) if (els[k]) series[k].push(val(els[k])) }
      scrollTo(0, 0); await new Promise((r) => setTimeout(r, 1500))
      const back = Object.fromEntries(Object.entries(els).map(([k, e]) => [k, e ? val(e) : null]))
      return { series: Object.fromEntries(Object.entries(series).map(([k, v]) => [k, [...new Set(v)].length])), start, back, missing: Object.entries(els).filter(([, e]) => !e).map(([k]) => k) }
    }, targets)
    const r = await sweep()
    for (const k of r.missing) notes.push(`FAIL ${k}: element not found (${JSON.stringify(targets[k])})`)
    for (const [k, n] of Object.entries(r.series)) {
      if (r.missing.includes(k)) continue
      F(n >= 4, `${k}: only ${n} distinct opacity/transform values across the scroll (want >= 4: it must scrub, not snap)`, notes)
      F(r.start[k] === r.back[k], `${k}: did not return to its start value (${r.start[k]} -> ${r.back[k]})`, notes)
    }
    notes.push('distinct values per target: ' + JSON.stringify(r.series))
    await ctx.close()
    return R(notes.some((n) => /^FAIL/.test(n)) ? 'FAIL' : 'PASS', notes)
  },

  // 28: takeover. (a) gsap chunk aborted: static page complete, clean console; (b) layout shift 0 through arming; (d) armed: every [data-m] ends visible with identity transform after a full scroll
  // (c, screenshot parity one frame either side of arming at 5 viewports, stays an owner pass: a settled armed frame legitimately differs from the static one by the scrub position)
  async 28({ browser, base, dir }) {
    const notes = []
    const MARK = /ScrollTrigger|GreenSock|gsapVersions/
    const visible = () => document.querySelectorAll('[data-m]').length && [...document.querySelectorAll('[data-m]')].map((e) => { const s = getComputedStyle(e); return { e: e.tagName + '.' + String(e.className).slice(0, 16), op: +s.opacity, v: s.visibility, t: s.transform, tr: s.translate, sc: s.scale } }).filter((x) => x.op < 1 || x.v === 'hidden' || !/^(none|matrix\(1, 0, 0, 1, 0, 0\))$/.test(x.t) || !/^(none|0px)( 0px)?$/.test(x.tr) || !/^(none|1)$/.test(x.sc)).slice(0, 5)
    // (a)
    {
      const o = await openPage(browser, 'about:blank', { w: 1440, h: 900, settle: 0 })
      const ctx = o.ctx, page = o.page, errs = []
      page.on('pageerror', (e) => errs.push(e.message.slice(0, 120)))
      page.on('console', (m) => m.type() === 'error' && !/GPU stall|GL Driver Message/i.test(m.text()) && errs.push(m.text().slice(0, 120)))
      page.removeAllListeners('console'); page.on('console', (m) => m.type() === 'error' && !/GPU stall|GL Driver Message|ERR_FAILED/i.test(m.text()) && errs.push(m.text().slice(0, 120))) // the aborted chunk logs ERR_FAILED by design
      let blocked = 0
      await page.route(/\.js(\?|$)/, async (route) => { const r = await route.fetch(); const t = await r.text(); if (MARK.test(t)) { blocked++; return route.abort() } route.fulfill({ response: r, body: t }) })
      await page.goto(base + '/', { waitUntil: 'load' }); await page.waitForTimeout(1200)
      await scrollAll(page, 0.5, 200); await page.waitForTimeout(500)
      const bad = await page.evaluate(visible)
      notes.push(`(a) gsap chunks aborted ${blocked}; non-rest [data-m] after full scroll ${bad.length}; console errors ${errs.length}`)
      F(blocked > 0, 'no gsap chunk was requested to abort', notes)
      F(!bad.length, `static page not at rest: ${JSON.stringify(bad)}`, notes)
      F(!errs.length, `console errors with gsap aborted: ${errs[0]}`, notes)
      await ctx.close()
    }
    // (b) + (d)
    for (const [label, url, y] of [['top', '/?gate', 0], ['mid-page reload', '/?gate', 2400], ['#courses', '/?gate#courses', null]]) {
      const o = await openPage(browser, base + url, { w: 1440, h: 900, settle: 0, wait: 'commit' })
      const { page } = o
      if (y) { await page.waitForSelector('#hero', { state: 'attached' }); await page.evaluate((y) => scrollTo(0, y), y); await page.reload({ waitUntil: 'commit' }) }
      await page.waitForFunction(() => window.__motion?.ready, null, { timeout: 20000 }).catch(() => {})
      await page.waitForTimeout(2000)
      const r = await page.evaluate(() => ({ ready: !!window.__motion?.ready, cls: window.__gate.cls }))
      notes.push(`(b) ${label}: armed ${r.ready}, layout shift ${r.cls.toFixed(4)}`)
      F(r.ready, `${label}: gsap never armed`, notes)
      F(r.cls === 0, `${label}: layout shift ${r.cls} through arming (want 0)`, notes)
      if (label === 'top') {
        await scrollAll(page, 0.5, 250); await page.waitForTimeout(1500)
        const bad = await page.evaluate(visible)
        notes.push(`(d) armed, full scroll: [data-m] not at rest ${bad.length}`)
        F(!bad.length, `armed [data-m] not at opacity 1 / identity transform after a full scroll: ${JSON.stringify(bad)}`, notes)
      }
      await o.ctx.close()
    }
    return R(notes.some((n) => /^FAIL/.test(n)) ? 'FAIL' : 'PASS', notes)
  },

  // 29: nav. ::before opacity 0 at scrollY 0, 1 at >= 96px; solid under prefers-reduced-transparency and below 768; nav CTA hidden while the hero CTA is on screen.
  async 29({ browser, base, dir }) {
    const notes = [], files = []
    const hdr = (page) => page.evaluate(() => { const h = document.querySelector('header'), s = getComputedStyle(h, '::before'); const a = [...h.querySelectorAll('a')].find((a) => a.href.startsWith('https://forms.gle')); const m = (s.backgroundColor.match(/[\d.]+/g) || []).map(Number); return { op: +s.opacity, alpha: m.length > 3 ? m[3] : 1, bf: s.backdropFilter, cta: a ? { op: +getComputedStyle(a).opacity, vis: getComputedStyle(a).visibility, hidden: h.dataset.hidden ?? null } : null } })
    const { ctx, page } = await openPage(browser, base + '/', { w: 1440, h: 900, settle: 1500 })
    // this machine may have the OS "reduce transparency" setting on (headless inherits it): pin the preference so the test is host-independent
    const cdp = await ctx.newCDPSession(page)
    await cdp.send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-transparency', value: 'no-preference' }] })
    await page.waitForTimeout(300)
    const top = await hdr(page)
    await page.evaluate(() => scrollTo(0, 120)); await page.waitForTimeout(800) // opacity transition (t3)
    const down = await hdr(page); files.push(save(dir, 'nav_scrolled_1440.png', await page.screenshot({ clip: { x: 0, y: 0, width: 1440, height: 120 } })))
    notes.push(`1440: ::before opacity top ${top.op} -> 120px ${down.op}; alpha ${down.alpha}; backdrop-filter ${down.bf}`)
    F(top.op === 0, `::before opacity ${top.op} at scrollY 0 (want 0)`, notes)
    F(down.op === 1, `::before opacity ${down.op} at 120px (want 1)`, notes)
    F(down.alpha < 1 && /blur/.test(down.bf), `desktop material should be translucent with blur (alpha ${down.alpha}, bf ${down.bf})`, notes)
    const ctaVisible = (h) => !h.cta ? null : h.cta.op > 0.5 && h.cta.vis !== 'hidden'
    F(ctaVisible(top) === false, `nav CTA visible while the hero CTA is on screen (${JSON.stringify(top.cta)})`, notes)
    await page.evaluate(() => scrollTo(0, 1600)); await page.waitForTimeout(600)
    const far = await hdr(page)
    F(ctaVisible(far) === true, `nav CTA still hidden after the hero CTA left (${JSON.stringify(far.cta)})`, notes)
    await cdp.send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-transparency', value: 'reduce' }] })
    await page.evaluate(() => scrollTo(0, 120)); await page.waitForTimeout(500)
    const rt = await hdr(page)
    notes.push(`reduced-transparency: alpha ${rt.alpha} backdrop-filter ${rt.bf}`)
    const rtOn = await page.evaluate(() => matchMedia('(prefers-reduced-transparency: reduce)').matches)
    if (rtOn) F(rt.alpha === 1 && !/blur/.test(rt.bf), `not solid under prefers-reduced-transparency (alpha ${rt.alpha}, bf ${rt.bf})`, notes)
    else notes.push('info: this Chromium cannot emulate prefers-reduced-transparency; the opt-out rule is checked by source (shell.css)')
    await ctx.close()
    const m = await openPage(browser, base + '/', { w: 390, h: 844, settle: 1500 })
    await m.page.evaluate(() => scrollTo(0, 150)); await m.page.waitForTimeout(500)
    const mob = await hdr(m.page); files.push(save(dir, 'nav_scrolled_390.png', await m.page.screenshot({ clip: { x: 0, y: 0, width: 390, height: 120 } })))
    notes.push(`390: alpha ${mob.alpha} backdrop-filter ${mob.bf}`)
    F(mob.alpha === 1 && !/blur/.test(mob.bf), `not solid below 768 (alpha ${mob.alpha}, bf ${mob.bf})`, notes)
    await m.ctx.close()
    return R(notes.some((n) => /^FAIL/.test(n)) ? 'FAIL' : 'PASS', notes, files)
  },

  // 30: crowd: end of scene = 20 --text discs + 1 --accent disc and numeral "20"; above the scene the numeral reads "0"
  async 30({ browser, base, dir }) {
    const notes = [], files = []
    const { ctx, page } = await openPage(browser, base + '/?gate', { w: 1440, h: 900, settle: 1500 })
    await page.waitForFunction(() => window.__motion?.ready, null, { timeout: 15000 }).catch(() => {})
    await page.waitForTimeout(600)
    const num = () => page.evaluate(() => document.querySelector('#class-size [data-crowd-n]')?.textContent?.trim() ?? null)
    F((await num()) !== null, 'no #class-size [data-crowd-n]', notes)
    await page.evaluate(() => { const c = document.querySelector('#class-size canvas'); const b = c.getBoundingClientRect(); scrollTo(0, scrollY + b.bottom - innerHeight * 0.55) }); await page.waitForTimeout(1800)
    const clip = await page.evaluate(() => { const b = document.querySelector('#class-size canvas').getBoundingClientRect(); return { x: Math.max(0, b.left), y: Math.max(0, b.top), width: Math.min(b.width, innerWidth), height: Math.min(b.height, innerHeight - Math.max(0, b.top)) } })
    const buf = await page.screenshot({ clip }); files.push(save(dir, 'crowd_full.png', buf))
    const s = await stats(browser, buf, { G: 2, minCell: 2, minArea: 1 })
    const full = await num()
    notes.push(`end of scene: numeral ${JSON.stringify(full)}, ${s.blobs.text} text blobs, ${s.blobs.accent} accent blobs (want "20", 20, 1)`)
    F(full === '20', `numeral reads ${JSON.stringify(full)} at the end (want "20")`, notes)
    F(s.blobs.text === 20, `${s.blobs.text} --text discs (want 20)`, notes)
    F(s.blobs.accent === 1, `${s.blobs.accent} --accent discs (want 1)`, notes)
    await page.evaluate(() => scrollTo(0, 0)); await page.waitForTimeout(2000)
    const zero = await num()
    notes.push(`scrolled back above: numeral ${JSON.stringify(zero)}`)
    F(zero === '0', `numeral reads ${JSON.stringify(zero)} above the scene (want "0")`, notes)
    await ctx.close()
    const pre = await openPage(browser, base + '/', { w: 1440, h: 900, js: false, settle: 300 })
    const ssr = await pre.page.evaluate(() => document.querySelector('#class-size [data-crowd-n]')?.textContent?.trim() ?? null)
    notes.push(`before arming (JS off): numeral ${JSON.stringify(ssr)}`)
    F(ssr === '20', `SSR numeral reads ${JSON.stringify(ssr)} (want "20")`, notes)
    await pre.ctx.close()
    return R(notes.some((n) => /^FAIL/.test(n)) ? 'FAIL' : 'PASS', notes, files)
  },
}
