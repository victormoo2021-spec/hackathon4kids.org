// Browser-driven checks. Each returns { status: 'PASS'|'FAIL'|'MANUAL', notes: string[], files: string[] }.
import { launch, openPage, scrollAll, stats, diff, blurDiff, save, pct, ROUTES, INKS, NOGL_ARGS, hexRgb } from './lib.mjs'
import { join } from 'node:path'
import { readFileSync } from 'node:fs'

const CTA_HREF = 'https://forms.gle/ou5o62fdUXCHUzxA8'
const R = (status, notes = [], files = []) => ({ status, notes, files })
const FOLDS = [[1440, 900], [1024, 768], [390, 844], [360, 740]]
const retry = async (f, n = 3) => { for (let i = 0; ; i++) try { return await f() } catch (e) { if (i >= n || !/context was destroyed|navigation/i.test(String(e))) throw e; await new Promise((r) => setTimeout(r, 1500)) } } // dev HMR reload
const ok = (cond, msg, notes) => { if (!cond) notes.push(msg); return !!cond }

export const checks = {
  // 1 + 2: CTA above the fold, copy, href, new tab, sr-only hint
  async 1({ browser, base, dir }) {
    const notes = [], files = []
    for (const [w, h] of FOLDS) {
      const { ctx, page } = await openPage(browser, base + '/', { w, h })
      const r = await page.evaluate((vh) => {
        const a = [...document.querySelectorAll('main a, a')].find((e) => /get class dates by email/i.test(e.textContent || '') && e.offsetParent)
        if (!a) return null
        const b = a.getBoundingClientRect(); return { top: b.top, bottom: b.bottom, left: b.left, right: b.right, vw: innerWidth }
      }, h)
      files.push(save(dir, `fold_${w}x${h}.png`, await page.screenshot()))
      if (!r) notes.push(`${w}x${h}: CTA not found`)
      else if (r.bottom > h || r.top < 0 || r.right > r.vw) notes.push(`${w}x${h}: CTA not fully in fold (top ${r.top | 0} bottom ${r.bottom | 0})`)
      await ctx.close()
    }
    return R(notes.length ? 'FAIL' : 'PASS', notes, files)
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

  // 3: facts. Dump all visible text per route for tracing; strings with digits / % flagged.
  async 3({ browser, base, dir }) {
    const files = [], notes = []
    for (const route of ROUTES.slice(0, 4)) {
      const { ctx, page } = await openPage(browser, base + route, { w: 1440, h: 900, settle: 800 })
      const t = await page.evaluate(() => document.body.innerText)
      files.push(save(dir, `text_${route.replace(/\W+/g, '_') || 'home'}.txt`, t))
      const risky = t.split('\n').filter((l) => /\d|%|testimonial|"/.test(l) && l.trim()).slice(0, 12)
      notes.push(`${route}: lines with digits/quotes for tracing: ${JSON.stringify(risky)}`)
      await ctx.close()
    }
    return R('MANUAL', ['Trace each string to src/app/content/*.ts (text dumps attached)', ...notes], files)
  },

  // 4: ink tokens in computed styles
  async 4({ browser, base }) {
    const notes = [], inks = Object.values(INKS).map(hexRgb)
    const ROUND_OK = '.dot,.logo,.reg,[data-round],header a[href="/"] *,header a[href="/"]'
    const bad = new Map()
    for (const route of ROUTES) for (const [w, h] of [[1440, 900], [390, 844]]) {
      const { ctx, page } = await openPage(browser, base + route, { w, h, settle: 1000 })
      await scrollAll(page, 0.8, 80)
      const r = await retry(() => page.evaluate(({ inks, ROUND_OK }) => {
        const out = []
        const near = (c) => inks.some((q) => Math.abs(q[0] - c[0]) <= 2 && Math.abs(q[1] - c[1]) <= 2 && Math.abs(q[2] - c[2]) <= 2)
        const col = (s, el, prop) => {
          for (const m of s.matchAll(/rgba?\(([^)]+)\)/g)) {
            const p = m[1].split(/[ ,\/]+/).map(Number); const a = p.length > 3 ? p[3] : 1
            if (a === 0) continue
            if (a < 1) out.push([prop + ' alpha<1', m[0], el]); else if (!near(p)) out.push([prop, m[0], el])
          }
          if (/color\(|oklab|oklch|lab\(|lch\(|hsl|hwb/.test(s)) out.push([prop + ' non-rgb', s.slice(0, 40), el])
        }
        const nm = (e) => e.tagName.toLowerCase() + (typeof e.className === 'string' && e.className ? '.' + e.className.trim().split(/\s+/)[0] : '')
        for (const e of document.body.querySelectorAll('*')) {
          const s = getComputedStyle(e), b = e.getBoundingClientRect()
          if (s.display === 'none' || !b.width || !b.height || /^(SCRIPT|STYLE|NOSCRIPT|PATH|G|DEFS)$/i.test(e.tagName) && 0) continue
          const n = nm(e)
          col(s.color, n, 'color'); col(s.backgroundColor, n, 'background')
          for (const k of ['Top', 'Right', 'Bottom', 'Left']) if (s['border' + k + 'Style'] !== 'none' && parseFloat(s['border' + k + 'Width']) > 0) col(s['border' + k + 'Color'], n, 'border')
          if (s.outlineStyle !== 'none' && parseFloat(s.outlineWidth) > 0) col(s.outlineColor, n, 'outline')
          if (s.textShadow !== 'none') col(s.textShadow, n, 'text-shadow')
          if (s.boxShadow !== 'none') { col(s.boxShadow, n, 'box-shadow'); if (s.boxShadow.replace(/rgba?\([^)]*\)/g, '').split(',').some((q) => /^\s*-?[\d.]+px\s+-?[\d.]+px\s+[1-9]/.test(q.trim()))) out.push(['blurred box-shadow', s.boxShadow.slice(0, 50), n]) }
          if (e instanceof SVGElement) { for (const p of ['fill', 'stroke']) if (s[p] !== 'none' && !s[p].startsWith('url')) col(s[p], n, p) }
          if (/gradient/.test(s.backgroundImage)) out.push(['gradient', s.backgroundImage.slice(0, 40), n])
          if (s.filter !== 'none') out.push(['filter', s.filter, n])
          if (s.backdropFilter !== 'none' && s.backdropFilter) out.push(['backdrop-filter', s.backdropFilter, n])
          if (s.mixBlendMode !== 'normal') out.push(['mix-blend-mode', s.mixBlendMode, n])
          const rad = ['TopLeft', 'TopRight', 'BottomLeft', 'BottomRight'].some((c) => parseFloat(s['border' + c + 'Radius']) > 0)
          if (rad && !e.matches(ROUND_OK)) out.push(['border-radius', s.borderRadius, n])
        }
        return out
      }, { inks, ROUND_OK }))
      for (const [p, v, el] of r) { const k = `${p} = ${v}`; const o = bad.get(k) || { n: 0, ex: new Set() }; o.n++; if (o.ex.size < 3) o.ex.add(`${route}@${w} ${el}`); bad.set(k, o) }
      await ctx.close()
    }
    for (const [k, o] of [...bad].sort((a, b) => b[1].n - a[1].n).slice(0, 40)) notes.push(`${k}  x${o.n}  e.g. ${[...o.ex].join('; ')}`)
    notes.push(`radius allow-list (contract gap: mark dots/logo/registration target with .dot/.logo/.reg/[data-round]): ${ROUND_OK}`)
    return R(bad.size ? 'FAIL' : 'PASS', bad.size ? [`${bad.size} distinct violations`, ...notes] : notes)
  },

  // 5: one WebGL context per route, no three/gsap/r3f
  async 5({ browser, base, dist }) {
    const notes = []
    const re = /gsap|@react-three|__THREE__|WebGLRenderer|three\/build|three\.module/
    for (const route of ROUTES) {
      const o = await openPage(browser, base + route, { w: 1440, h: 900, settle: 800 })
      const hits = new Set()
      o.page.on('response', async (r) => { if (/\.js(\?|$)/.test(r.url())) { try { const t = await r.text(); const m = t.match(re); if (m) hits.add(m[0] + ' in ' + r.url().slice(-50)) } catch {} } })
      await o.page.reload({ waitUntil: 'load' })
      await o.page.waitForTimeout(800)
      await scrollAll(o.page, 0.7, 120)
      const n = await o.page.evaluate(() => window.__gate.gl)
      const wantMin = route === '/' ? 1 : 0 // only the home route mounts GL sheets; /programs etc. use 2D ProofStatic
      if (n > 1 || n < wantMin) notes.push(`${route}: ${n} WebGL getContext calls (want ${wantMin === 1 ? 'exactly 1' : '<=1'})`)
      else notes.push(`ok ${route}: ${n} WebGL context(s)`)
      if (hits.size) notes.push(`${route}: bundle markers ${[...hits].slice(0, 3).join(', ')}`)
      await o.ctx.close()
    }
    try { const pk = JSON.parse(readFileSync('package.json', 'utf8')); const d = Object.keys({ ...pk.dependencies, ...pk.devDependencies }).filter((k) => /^(three|gsap|@react-three\/.*|@types\/three)$/.test(k)); if (d.length) notes.push('package.json lists ' + d.join(', ')) } catch {}
    return R(notes.some((n) => !n.startsWith('ok ')) ? 'FAIL' : 'PASS', notes)
  },

  // 6: hero frame 0, GL vs Poster (both reduced motion = all sheets at frame 0)
  async 6({ browser, base, dir }) {
    const notes = [], files = []
    const nogl = await launch(NOGL_ARGS)
    for (const [w, h] of [[1440, 900], [390, 844]]) {
      const a = await openPage(browser, base + '/', { w, h, reduced: true })
      const b = await openPage(nogl, base + '/', { w, h, reduced: true })
      const ga = await a.page.evaluate(() => window.__gate.gl)
      const [A, B] = [await a.page.screenshot(), await b.page.screenshot()]
      files.push(save(dir, `gl_${w}.png`, A), save(dir, `poster_${w}.png`, B))
      const d = await blurDiff(browser, A, B)
      const sh = d.shift
      notes.push(`${w}: 6px-blur diff ${(d.frac * 100).toFixed(2)}% (any channel >32; limit 3%), bob K centroid shift ${sh == null ? 'n/a' : sh.toFixed(2)}px (limit 2), GL contexts on GL run: ${ga}`)
      if (!(d.frac < 0.03) || !(sh <= 2) || ga < 1) notes.push(`${w}: FAIL`)
      await a.ctx.close(); await b.ctx.close()
    }
    await nogl.close()
    return R(notes.some((n) => /FAIL/.test(n)) ? 'FAIL' : 'PASS', notes, files)
  },

  // 7 + 11: freeze CSS animation clock, step it at 70ms; strobe-fan blob count at several phases
  async 7({ browser, base, dir, shared }) {
    const notes = [], files = [], counts = []
    const { ctx, page } = await openPage(browser, base + '/', { w: 1440, h: 900, settle: 4000 })
    for (const t of [0, 1, 2, 3, 4, 5]) {
      await page.waitForTimeout(t === 0 ? 0 : 230) // 230ms != multiple of the 15Hz tick: samples different phases
      const buf = await page.screenshot(); const s = await stats(browser, buf)
      counts.push(s.blueBlobs); files.push(save(dir, `strobe_${t}.png`, buf))
    }
    notes.push(`blue blobs per capture: ${counts.join(', ')} (want >=18 at best mid-swing; overlapping echoes merge, so confirm on the images)`)
    notes.push('bunching at turnarounds: confirm on strobe_*.png')
    await ctx.close()
    return R('MANUAL', notes.concat(['blob count includes halftone dots, so it is not a reliable exposure counter; count echoes on strobe_*.png']), files)
  },
  async 11({ browser, base, dir }) {
    const notes = [], files = [], rows = []
    const { ctx, page } = await openPage(browser, base + '/', { w: 1440, h: 900, freeze: true, wait: 'commit', settle: 400 })
    // hero region only: below the nav, inside #hero and the fold
    const clip = await page.evaluate(() => { const h = document.querySelector('#hero'), n = document.querySelector('header'); const hb = h.getBoundingClientRect(); const y = Math.max(hb.top, n ? n.getBoundingClientRect().bottom : 0); return { x: 0, y: Math.round(y), width: innerWidth, height: Math.round(Math.min(hb.bottom, innerHeight) - y) } })
    notes.push(`hero clip ${JSON.stringify(clip)} (nav excluded)`)
    for (let t = 0; t <= 1400; t += 70) {
      await page.evaluate((t) => document.getAnimations().forEach((a) => { try { a.pause(); a.currentTime = t } catch {} }), t)
      await page.waitForTimeout(60)
      const buf = await page.screenshot({ clip })
      const s = await stats(browser, buf); rows.push({ t, ...s.frac, blobs: s.blueBlobs })
      files.push(save(dir, `load_${String(t).padStart(4, '0')}.png`, buf))
    }
    const first = (f) => rows.find(f)?.t
    const yFull = first((r) => r.y > 0.3), bFirst = first((r) => r.blue > 0.002 && r.t >= 140), kFirst = first((r) => r.k > 0.01 && r.t >= 140)
    notes.push(`t(first yellow>30%)=${yFull} t(blue appears)=${bFirst} t(K appears)=${kFirst}  [spec: Y 0-350, B 280-630, K 420-720; tol +-70]`)
    notes.push('per-frame ink fractions: ' + rows.map((r) => `${r.t}:y${r.y} b${r.blue} k${r.k}`).join(' | '))
    const y0 = rows[0].y, y350 = rows.find((r) => r.t === 350).y
    notes.push(`yellow fraction at t=0: ${y0} (want < 0.25, ground is stock), at t=350: ${y350} (want > 0.8)`)
    const good = y0 < 0.25 && y350 > 0.8 && yFull !== undefined && yFull <= 350 + 70 && bFirst >= 280 - 70 && bFirst <= 630 + 70 && kFirst >= 420 - 70 && kFirst <= 720 + 70 && bFirst <= kFirst + 140
    notes.push('page animations seen: ' + (await page.evaluate(() => document.getAnimations().length)) + ' (GL pass is only exact if it reads the same CSS clock; verify on images)')
    const boot = await page.evaluate(() => Object.keys(window).filter((k) => /^(?!on)(.*press|.*sheet|.*boot)/i.test(k) && k !== '__gate').map((k) => k + '=' + JSON.stringify(window[k])?.slice(0, 60)).concat([...document.querySelectorAll('[data-boot],[data-press-boot],canvas[data-boot]')].map((e) => 'data-boot=' + e.getAttribute('data-boot'))))
    notes.push('GL sheet boot clock: ' + (boot.length ? boot.join(', ') : 'not exposed (HeroSheet derives it from FCP internally; no window/data hook)'))
    await ctx.close()
    return R(good ? 'PASS' : 'FAIL', notes, files)
  },

  // 8: touch scroll over the hero is never blocked; grab tracking is manual
  async 8({ browser, base, dir }) {
    const { ctx, page } = await openPage(browser, base + '/', { w: 390, h: 844, settle: 2500 })
    const cdp = await ctx.newCDPSession(page)
    await cdp.send('Input.synthesizeScrollGesture', { x: 195, y: 500, yDistance: -300, gestureSourceType: 'touch', speed: 800 })
    await page.waitForTimeout(500)
    const y = await page.evaluate(() => scrollY)
    await ctx.close()
    return R('MANUAL', [`touch swipe over hero scrolled page by ${y}px (${y > 100 ? 'ok' : 'BLOCKED?'}); grab 1:1, trail, release velocity need a human/Fable pass on :port with a mouse`])
  },

  // 9 + 10 + 12: captures only (no stable selectors in contract)
  async 9({ browser, base, dir }) {
    const files = [], notes = []
    const { ctx, page } = await openPage(browser, base + '/', { w: 1440, h: 900, settle: 3500 })
    const clip = { x: 500, y: 250, width: 400, height: 300 }
    const base0 = await page.screenshot({ clip }); files.push(save(dir, 'loupe_off.png', base0))
    await page.mouse.move(700, 400, { steps: 5 }); await page.waitForTimeout(700)
    const on = await page.screenshot({ clip }); files.push(save(dir, 'loupe_on.png', on))
    const d = await diff(browser, base0, on)
    await page.mouse.move(700, 400); await page.mouse.wheel(0, 300); await page.waitForTimeout(700); await page.evaluate(() => scrollTo(0, 0)); await page.waitForTimeout(700)
    const after = await page.screenshot({ clip }); files.push(save(dir, 'loupe_after_scroll.png', after))
    notes.push(`loupe on vs off region diff ${(d.frac * 100).toFixed(1)}% (pendulum motion also contributes)`)
    await ctx.close()
    return R('MANUAL', notes, files)
  },
  async 10({ browser, base, dir }) {
    const files = [], notes = []
    const { ctx, page } = await openPage(browser, base + '/', { w: 1440, h: 900, freeze: true, wait: 'commit', settle: 400 })
    for (const t of [630, 700, 770]) {
      await page.evaluate((t) => document.getAnimations().forEach((a) => { try { a.pause(); a.currentTime = t } catch {} }), t)
      await page.waitForTimeout(80)
      const buf = await page.screenshot(); files.push(save(dir, `register_${t}.png`, buf))
      const s = await stats(browser, buf)
      notes.push(`t=${t}: --over px ${(s.frac.over * 100).toFixed(3)}%, stock px ${(s.frac.stock * 100).toFixed(2)}% (want both >0 while blue is off-register)`)
    }
    await ctx.close()
    return R('MANUAL', [...notes, 'zoom the images: stock sliver trailing, --over sliver leading, never a transparent blend'], files)
  },
  async 12({ browser, base, dir }) {
    const files = [], notes = []
    const { ctx, page } = await openPage(browser, base + '/', { w: 1440, h: 900, settle: 3000 })
    await page.mouse.move(10, 10)
    for (const [i, dy] of [600, 600, 900].entries()) {
      await page.mouse.wheel(0, dy); await page.waitForTimeout(40)
      files.push(save(dir, `slip_moving_${i}.png`, await page.screenshot()))
      await page.waitForTimeout(70 * 3 + 80)
      files.push(save(dir, `slip_rest_${i}.png`, await page.screenshot()))
    }
    await ctx.close()
    return R('MANUAL', ['moving/rest pairs: blue tear <=10px, re-registered 3 ticks after stop; roller once per band; DOM vs GL slip together'], files)
  },

  // 13: proofs
  async 13({ browser, base, dir }) {
    const { ctx, page } = await openPage(browser, base + '/', { w: 1440, h: 900 })
    await scrollAll(page, 0.6, 200)
    const r = await page.evaluate(() => { const a = [...document.querySelectorAll('a[href*="/programs#"]')].filter((e) => e.querySelector('canvas,svg,img')); return { n: a.length, tab: a.filter((e) => e.tabIndex >= 0).length, w: a.slice(0, 3).map((e) => e.getBoundingClientRect().width | 0) } })
    await ctx.close()
    return R('MANUAL', [`proof links with a visual: ${r.n} (want 10), tabbable ${r.tab}, sample widths ${r.w}`, 'recognisability at 169px + <=2 animating at once: Fable visual pass'].concat(r.n === 10 ? [] : ['FAIL signal: not 10 proofs']))
  },
  // 14: pointerdown same frame
  async 14({ browser, base, dir }) {
    const { ctx, page } = await openPage(browser, base + '/', { w: 1440, h: 900 })
    const sel = 'a[href="' + CTA_HREF + '"]:not(header *)'
    const r = await page.evaluate(async (sel) => {
      const a = document.querySelector(sel); if (!a) return null
      const read = () => { const s = getComputedStyle(a); return s.transform + '|' + s.boxShadow }
      const before = read()
      a.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, pointerType: 'mouse', button: 0 }))
      return { before, same: read() }
    }, sel)
    await ctx.close()
    return R('MANUAL', [r ? `synthetic pointerdown same-frame style change: ${r.before !== r.same ? 'yes' : 'NO (may need :active, use a real mouse)'}` : 'CTA not found', 'final band bob settle + CTA thunk: Fable visual pass'])
  },

  // 16: reduced motion
  async 16({ browser, base, dir }) {
    const notes = [], files = []
    for (const route of ['/', '/about', '/programs']) {
      const { ctx, page } = await openPage(browser, base + route, { w: 1440, h: 900, reduced: true, settle: 800 })
      await scrollAll(page, 0.7, 150)
      await page.evaluate(() => scrollTo(0, 0)); await page.waitForTimeout(300)
      const r0 = await page.evaluate(() => window.__gate.raf)
      await page.waitForTimeout(2000)
      const r1 = await page.evaluate(() => window.__gate.raf)
      await page.waitForTimeout(2000)
      const r2 = await page.evaluate(() => window.__gate.raf) // a loop is sustained; a lone settling redraw is not
      const run = await page.evaluate(() => document.getAnimations().filter((a) => a.playState === 'running' && a.effect?.getComputedTiming().progress !== 1).map((a) => a.animationName || a.transitionProperty || 'anim').slice(0, 5))
      const hid = await page.evaluate(() => [...document.querySelectorAll('body *')].filter((e) => { const s = getComputedStyle(e); const bb = e.getBoundingClientRect(); return bb.width > 2 && bb.height > 2 && (e.childNodes.length && [...e.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim())) && (+s.opacity < 1 || s.visibility === 'hidden' || e.classList.contains('pre')) }).map((e) => e.tagName + '.' + e.className).slice(0, 5))
      const rate = Math.min(r1 - r0, r2 - r1) / 2
      if (rate > 0) notes.push(`${route}: sustained ${rate} app rAF/s (windows: ${r1 - r0}, ${r2 - r1} callbacks per 2s)`)
      else if (r1 - r0) notes.push(`${route}: info: ${r1 - r0} settling app rAF callback(s) in first 2s, 0 after (not a loop)`)
      if (run.length) notes.push(`${route}: running animations ${run}`)
      if (hid.length) notes.push(`${route}: hidden/faded text ${hid}`)
      if (route === '/') files.push(save(dir, 'reduced_home_full.png', await page.screenshot({ fullPage: true })))
      await ctx.close()
    }
    return R(notes.some((n) => !/: info:/.test(n)) ? 'FAIL' : 'PASS', notes.length ? notes : ['0 rAF/s, 0 running animations, text visible on /, /about, /programs'], files)
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
        return { empty, hid, poster, h: document.documentElement.scrollHeight }
      })
      files.push(save(dir, `${tag}_${route.replace(/\W+/g, '_') || 'home'}_full.png`, await page.screenshot({ fullPage: true })))
      if (r.empty.length) notes.push(`${tag} ${route}: collapsed ${r.empty}`)
      if (r.hid.length) notes.push(`${tag} ${route}: hidden text ${r.hid}`)
      if (route === '/' && !r.poster) notes.push(`${tag} /: no Poster element found by [class*=oster]/[data-poster] heuristic`)
      if (tag === 'nogl' && errors.length) notes.push(`nogl ${route}: errors ${errors.slice(0, 2)}`)
      await ctx.close()
    }
    await nogl.close()
    return R(notes.length ? 'FAIL' : 'MANUAL', notes.length ? notes : ['automated checks clean; eyeball full-page captures for blank bands'], files)
  },

  // 19: rAF p95 at 4x throttle while scrolling; idle rAF
  async 19({ browser, base }) {
    const notes = []
    const { ctx, page } = await openPage(browser, base + '/', { w: 390, h: 844, settle: 2500 })
    const cdp = await ctx.newCDPSession(page)
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 })
    await page.evaluate(() => { window.__gate.probe = []; window.__gate.probing = true })
    const total = await page.evaluate(() => document.documentElement.scrollHeight)
    for (let y = 0; y < total; y += 250) { await page.mouse.wheel(0, 250); await page.waitForTimeout(60) }
    await page.evaluate(() => { window.__gate.probing = false })
    const d = await page.evaluate(() => window.__gate.probe)
    const p95 = pct(d, 0.95)
    notes.push(`rAF interval p50 ${pct(d, 0.5)?.toFixed(1)}ms p95 ${p95?.toFixed(1)}ms n=${d.length} (limit 20ms)`)
    // idle: scroll so no canvas intersects the viewport
    const spot = await page.evaluate(() => { const cs = [...document.querySelectorAll('canvas')].map((c) => { const b = c.getBoundingClientRect(); return [b.top + scrollY, b.bottom + scrollY] }); const H = document.documentElement.scrollHeight, vh = innerHeight; for (let y = 0; y <= H - vh; y += 50) if (!cs.some(([a, b]) => b > y && a < y + vh)) return y; return null })
    let idleOk = true
    if (spot === null) notes.push('no scroll position without a visible canvas; idle check skipped (FAIL by contract if any sheet is always visible)')
    else {
      await page.evaluate((y) => scrollTo(0, y), spot); await page.waitForTimeout(800)
      const g = () => page.evaluate(() => ({ raf: window.__gate.raf, frames: window.__gate.frames, all: window.__gate.all }))
      const a = await g(); await page.waitForTimeout(2000); const b = await g()
      idleOk = b.frames - a.frames === 0 && b.raf - a.raf === 0
      notes.push(`idle at y=${spot}: ${b.frames - a.frames} app rAF frames, ${b.raf - a.raf} app callbacks, ${b.all - a.all} total callbacks incl. Next dev/HMR/framework, in 2s (want 0 app frames)`)
    }
    await ctx.close()
    notes.push('tick GPU on a real phone: MANUAL')
    return R(p95 !== null && p95 <= 20 && idleOk && spot !== null ? 'PASS' : 'FAIL', notes)
  },

  // 21: keyboard
  async 21({ browser, base, dir }) {
    const notes = [], files = []
    const { ctx, page } = await openPage(browser, base + '/', { w: 1440, h: 900, settle: 1500 })
    await page.keyboard.press('Tab')
    const first = await page.evaluate(() => { const e = document.activeElement; return { t: (e.textContent || '').trim().slice(0, 30), h: e.getAttribute('href') } })
    if (!/skip/i.test(first.t) || !(first.h || '').startsWith('#')) notes.push(`first Tab stop is not a skip link: ${JSON.stringify(first)}`)
    const grounds = new Map(), bad = []
    const seen = new Set()
    for (let i = 0; i < 80; i++) {
      const r = await page.evaluate(() => {
        const e = document.activeElement; if (!e || e === document.body || e.tagName === 'NEXTJS-PORTAL' || e.closest('nextjs-portal')) return null // Next dev overlay
        const s = getComputedStyle(e)
        let g = e, bg = 'rgb(242, 237, 225)'; while (g) { const c = getComputedStyle(g).backgroundColor; if (!/rgba\(.*, 0\)|transparent/.test(c)) { bg = c; break } g = g.parentElement }
        const vis = (s.outlineStyle !== 'none' && parseFloat(s.outlineWidth) >= 2) || /\d/.test(s.boxShadow.replace(/rgba?\([^)]*\)/g, '').replace(/none/, ''))
        const wrap = !!e.__gateSeen; e.__gateSeen = true
        return { wrap, id: e.tagName + '|' + (e.getAttribute('href') || '') + '|' + (e.textContent || '').trim().slice(0, 18), bg, vis, ol: s.outlineColor + ' ' + s.outlineWidth }
      })
      if (!r) { await page.keyboard.press('Tab'); continue }
      if (r.wrap) break // same element focused twice = wrapped around
      seen.add(r.id + '#' + i); grounds.set(r.bg, (grounds.get(r.bg) || 0) + 1)
      if (!r.vis) bad.push(r.id + ' on ' + r.bg)
      await page.keyboard.press('Tab')
    }
    notes.push(`${seen.size} tab stops; grounds seen ${JSON.stringify([...grounds])}`)
    if (seen.size < 8) notes.push('too few tab stops (tiles must be focusable)')
    if (bad.length) notes.push('no visible focus (>=2px outline or shadow): ' + bad.slice(0, 6).join('; '))
    // FAQ
    const faq = await page.evaluate(async () => { const b = document.querySelector('#faq button[aria-expanded], #faq summary, main button[aria-expanded], main summary, main [aria-expanded]'); if (!b) return null; b.scrollIntoView(); b.focus(); const d = b.closest('details'); return { ae: b.getAttribute('aria-expanded'), open: d ? d.open : null } })
    if (faq === null) notes.push('no FAQ control with aria-expanded or <details>/<summary> found')
    else { await page.keyboard.press('Enter'); await page.waitForTimeout(300); const after = await page.evaluate(() => { const e = document.activeElement, d = e.closest('details'); return { ae: e.getAttribute('aria-expanded'), open: d ? d.open : null } }); if (after.ae === faq.ae && after.open === faq.open) notes.push('FAQ did not toggle on Enter'); else notes.push('FAQ toggles on Enter') }
    files.push(save(dir, 'focus_last.png', await page.screenshot()))
    await ctx.close()
    // mobile menu
    const m = await openPage(browser, base + '/', { w: 390, h: 844, settle: 1200 })
    const btn = await m.page.$('header button[aria-expanded], header [aria-controls], button[aria-label*="enu" i]')
    if (!btn) notes.push('mobile: no menu button found')
    else { const a = await btn.getAttribute('aria-expanded'); await btn.focus(); await m.page.keyboard.press('Enter'); await m.page.waitForTimeout(400); const b = await btn.getAttribute('aria-expanded'); if (a === b) notes.push('mobile menu did not toggle on Enter'); files.push(save(dir, 'menu_open_390.png', await m.page.screenshot())) }
    await m.ctx.close()
    return R(notes.some((n) => !/tab stops;|FAQ toggles on Enter/.test(n)) ? 'FAIL' : 'PASS', notes, files)
  },

  // 22: contrast
  async 22({ browser, base }) {
    const bad = new Map()
    for (const route of ROUTES.slice(0, 4)) for (const w of [1440, 390]) {
      const { ctx, page } = await openPage(browser, base + route, { w, h: 900, reduced: true, settle: 600 })
      await scrollAll(page, 0.8, 80)
      const r = await page.evaluate(() => {
        const parse = (s) => (s.match(/[\d.]+/g) || []).map(Number)
        const lum = ([r, g, b]) => { const f = (c) => { c /= 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4 }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b) }
        const hex = (a) => '#' + a.slice(0, 3).map((x) => x.toString(16).padStart(2, '0')).join('').toUpperCase()
        const out = []
        for (const e of document.body.querySelectorAll('*')) {
          if (![...e.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim())) continue
          const b = e.getBoundingClientRect(), s = getComputedStyle(e)
          if (!b.width || !b.height || s.visibility === 'hidden' || s.display === 'none' || /^(SCRIPT|STYLE|NOSCRIPT)$/.test(e.tagName)) continue
          const fg = parse(s.color); let bg = [242, 237, 225], g = e
          while (g) { const c = parse(getComputedStyle(g).backgroundColor); if (c.length < 4 || c[3] > 0.01) { if (c.length) { bg = c; break } } g = g.parentElement }
          const [L1, L2] = [lum(fg), lum(bg)].sort((a, b) => b - a)
          const ratio = (L1 + 0.05) / (L2 + 0.05)
          const H = (hx) => hx
          out.push({ fg: hex(fg), bg: hex(bg), ratio: +ratio.toFixed(2), t: (e.textContent || '').trim().slice(0, 24) })
        }
        return out
      })
      for (const x of r) {
        const why = x.ratio < 4.5 ? `${x.ratio}:1` : (x.fg === '#1F3FCF' && x.bg === '#111114') ? 'blue on K' : (x.fg === '#FFD60A' && x.bg === '#F2EDE1') ? 'yellow on stock' : null
        if (why) { const k = `${x.fg} on ${x.bg} (${why})`; const o = bad.get(k) || { n: 0, ex: `${route}@${w} "${x.t}"` }; o.n++; bad.set(k, o) }
      }
      await ctx.close()
    }
    const notes = [...bad].map(([k, o]) => `${k} x${o.n} e.g. ${o.ex}`)
    return R(bad.size ? 'FAIL' : 'PASS', notes.length ? notes : ['all text pairs >= 4.5:1 (ground approximated by nearest opaque ancestor; text over GL sheets uses its CSS ground)'])
  },

  // 23, 24, 26, 27: visual/judgement, give Fable the evidence
  async 23({ browser, base }) {
    const { ctx, page } = await openPage(browser, base + '/', { w: 1440, h: 900, settle: 1000 })
    const r = await page.evaluate(() => {
      const bad = []
      for (const e of document.querySelectorAll('h3,h4,h5,h6')) if (getComputedStyle(e).textTransform === 'uppercase') bad.push('uppercase ' + e.tagName + ' "' + e.textContent.trim().slice(0, 20) + '"')
      const mono = [...document.querySelectorAll('body *')].filter((e) => /mono/i.test(getComputedStyle(e).fontFamily) && [...e.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim())).map((e) => (e.closest('section,header,footer,main')?.className || '?').toString().slice(0, 20))
      const per = {}; mono.forEach((m) => (per[m] = (per[m] || 0) + 1))
      const roles = new Set([...document.querySelectorAll('h1,h2,h3,p')].flatMap((e) => [...e.classList]).filter((c) => /^t-/.test(c)))
      return { bad, per, roles: [...roles] }
    })
    await ctx.close()
    return R(r.bad.length ? 'FAIL' : 'MANUAL', [`non-sentence-case H3+: ${r.bad}`, `mono text nodes per container: ${JSON.stringify(r.per)} (want <=1 group per section)`, `role classes in use on h1/h2/h3/p: ${r.roles}`])
  },
  async 24({ browser, base, dir }) {
    const files = []
    for (const [w, h] of [[1440, 900], [360, 740]]) {
      const { ctx, page } = await openPage(browser, base + '/', { w, h, settle: 3000 })
      await scrollAll(page, 0.6, 250); await page.evaluate(() => scrollTo(0, 0)); await page.waitForTimeout(500)
      files.push(save(dir, `home_${w}_full.png`, await page.screenshot({ fullPage: true })))
      await ctx.close()
    }
    return R('MANUAL', ['full-page captures at 1440 and 360 for the empty-half / collision review'], files)
  },
  async 26() { return R('MANUAL', ['unslop template check is a judgement call (Fable on captures); see text dumps in item 3 for eyebrow / "01/02" / middot / arrow greps'].concat([])) },
  async 27() { return R('MANUAL', ['Owner feel pass on localhost with Reduce Motion off. Not automatable.']) },
}
