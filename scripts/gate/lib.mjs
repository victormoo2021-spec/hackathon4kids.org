// Shared helpers for the G2 evidence kit.
import { chromium } from '@playwright/test'
import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

// BENCH_ANGLE=metal runs the gate on the real GPU; default is software GL so it works headless anywhere.
export const ANGLE = process.env.BENCH_ANGLE || 'swiftshader'
export const GL_ARGS = ['--use-gl=angle', `--use-angle=${ANGLE}`, ...(ANGLE === 'swiftshader' ? ['--enable-unsafe-swiftshader'] : [])]
export const NOGL_ARGS = ['--disable-webgl', '--disable-webgl2', '--disable-3d-apis']
export const ROUTES = ['/', '/about', '/programs', '/code.org', '/this-route-does-not-exist']
// The 12 Phosphor token hexes (direction.md D3). Keep in sync with src/app/press/tokens.css.
export const INKS = { bg: '#050806', s1: '#0B110D', s2: '#121A15', s3: '#1A241D', line: '#232E26', line2: '#3D4D42', text: '#F2F5F2', text2: '#A9B4AC', text3: '#7F8B83', accent: '#30D158', accentHi: '#5EE07F', glow: '#0F5F2A' }
export const hexRgb = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16))

// Installed before any page script: WebGL context counter, rAF counter, CLS, frame probe.
const INIT = () => {
  const g = (window.__gate = { gl: 0, raf: 0, frames: 0, all: 0, lastT: -1, cls: 0, probe: [], probing: false })
  const wrap = (proto) => {
    if (!proto) return
    const o = proto.getContext
    proto.getContext = function (t, ...a) { if (/webgl/i.test(String(t))) g.gl++; return o.call(this, t, ...a) }
  }
  wrap(window.HTMLCanvasElement?.prototype); wrap(window.OffscreenCanvas?.prototype)
  const raf = window.requestAnimationFrame.bind(window)
  // Classify by registration stack: app = src/app code (press clock, sheets); Next dev overlay/HMR/React/node_modules excluded.
  // raf = app callbacks, frames = distinct app frame timestamps, all = every callback (incl. framework).
  window.requestAnimationFrame = (cb) => {
    const st = new Error().stack || ''
    const app = /[\/_]src[\/_]app|press[\/_]clock|press[\/_]gl/.test(st) && !/node_modules|next[\/_]dist|react-dom|react-refresh|devtools|hot-reloader/i.test(st)
    return raf((t) => { g.all++; if (app) { g.raf++; if (t !== g.lastT) { g.lastT = t; g.frames++ } } cb(t) })
  }
  let last = 0
  const loop = (t) => { if (g.probing) { if (last) g.probe.push(t - last); last = t } else last = 0; raf(loop) }
  raf(loop) // probe uses the unwrapped raf so it never counts as app work
  try { new PerformanceObserver((l) => { for (const e of l.getEntries()) if (!e.hadRecentInput) g.cls += e.value }).observe({ type: 'layout-shift', buffered: true }) } catch {}
}

export async function launch(args = GL_ARGS) { return chromium.launch({ args }) }

export async function openPage(browser, url, o = {}) {
  const { w = 1440, h = 900, mobile = w < 768, reduced = false, js = true, wait = 'load', settle = 1800 } = o
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, hasTouch: mobile, isMobile: mobile, javaScriptEnabled: js, reducedMotion: reduced ? 'reduce' : 'no-preference' })
  const page = await ctx.newPage()
  const errors = []
  page.on('console', (m) => m.type() === 'error' && !/GPU stall|GL Driver Message/i.test(m.text()) && errors.push(m.text().slice(0, 160)))
  page.on('pageerror', (e) => errors.push('pageerror: ' + e.message.slice(0, 160)))
  if (js) await page.addInitScript(INIT)
  if (o.freeze) await page.addInitScript(() => { const s = document.createElement('style'); s.textContent = '*,*::before,*::after{animation-play-state:paused!important}'; document.documentElement.appendChild(s) })
  if (o.inject) await page.route((u) => u.pathname === new URL(url).pathname, async (route) => {
    if (route.request().resourceType() !== 'document') return route.continue()
    const r = await route.fetch(); const html = (await r.text()).replace(/<head[^>]*>/i, (m) => m + o.inject)
    await route.fulfill({ response: r, body: html })
  })
  await page.goto(url, { waitUntil: wait })
  if (settle) await page.waitForTimeout(settle)
  return { ctx, page, errors }
}

export async function scrollAll(page, step = 0.6, delay = 150) {
  await page.evaluate(async ([s, d]) => {
    for (let y = 0; y < document.documentElement.scrollHeight; y += innerHeight * s) { scrollTo(0, y); await new Promise((r) => setTimeout(r, d)) }
  }, [step, delay])
}

// Pixel analysis runs in a blank page so the kit needs no image dependency.
let _az
async function az(browser) { if (!_az) { const c = await browser.newContext(); _az = await c.newPage(); await _az.goto('about:blank') } return _az }
const b64 = (b) => 'data:image/png;base64,' + b.toString('base64')

/**
 * Per-ink pixel fractions + blob counts (accent, text) for a PNG buffer.
 * o.exclude: [{x,y,width,height}] rects (image px) skipped entirely (e.g. H1/CTA when hunting the beam).
 * o.G / o.minCell / o.minArea: blob grid size, min inked px per cell, min cells per blob (small discs need G=2, minCell=2, minArea=1).
 * rowsAccent = share of image rows holding >=2% accent pixels (scan-band / trail extent).
 */
export async function stats(browser, buf, o = {}) {
  const p = await az(browser)
  return p.evaluate(async ({ src, inks, o }) => {
    const img = new Image(); img.src = src; await img.decode()
    const c = document.createElement('canvas'); c.width = img.width; c.height = img.height
    const x = c.getContext('2d', { willReadFrequently: true }); x.drawImage(img, 0, 0)
    const d = x.getImageData(0, 0, c.width, c.height).data
    const near = Object.fromEntries(Object.entries(inks).map(([k, v]) => [k, v.map(Number)]))
    const cnt = Object.fromEntries([...Object.keys(near), 'other'].map((k) => [k, 0]))
    const W = c.width, H = c.height, G = o.G || 4, minCell = o.minCell || 8, minArea = o.minArea || 3
    const gw = Math.ceil(W / G), gh = Math.ceil(H / G)
    const grids = { accent: new Uint16Array(gw * gh), text: new Uint16Array(gw * gh) }
    const skip = new Uint8Array(W * H)
    for (const r of o.exclude || []) for (let yy = Math.max(0, r.y | 0); yy < Math.min(H, (r.y + r.height) | 0); yy++) for (let xx = Math.max(0, r.x | 0); xx < Math.min(W, (r.x + r.width) | 0); xx++) skip[yy * W + xx] = 1
    const rowAcc = new Uint32Array(H); let counted = 0
    for (let i = 0, n = W * H; i < n; i++) {
      if (skip[i]) continue
      counted++
      const r = d[i * 4], g = d[i * 4 + 1], b = d[i * 4 + 2]
      let best = 'other', bd = 36 * 36 * 3 / 4
      for (const k in near) { const q = near[k], e = (r - q[0]) ** 2 + (g - q[1]) ** 2 + (b - q[2]) ** 2; if (e < bd) { bd = e; best = k } }
      cnt[best]++
      if (best === 'accent' || best === 'text') grids[best][((i / W | 0) / G | 0) * gw + ((i % W) / G | 0)]++
      if (best === 'accent') rowAcc[i / W | 0]++
    }
    const blobsOf = (cell) => {
      const seen = new Uint8Array(gw * gh); let blobs = 0
      for (let s = 0; s < cell.length; s++) {
        if (seen[s] || cell[s] < minCell) continue
        let area = 0; const st = [s]; seen[s] = 1
        while (st.length) { const q = st.pop(); area++; const qx = q % gw, qy = q / gw | 0
          for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const nx = qx + dx, ny = qy + dy; if (nx < 0 || ny < 0 || nx >= gw || ny >= gh) continue; const m = ny * gw + nx; if (!seen[m] && cell[m] >= minCell) { seen[m] = 1; st.push(m) } } }
        if (area >= minArea) blobs++
      }
      return blobs
    }
    let rows = 0; for (let y = 0; y < H; y++) if (rowAcc[y] >= 0.02 * W) rows++
    const t = Math.max(1, counted)
    return { w: W, h: H, frac: Object.fromEntries(Object.entries(cnt).map(([k, v]) => [k, +(v / t).toFixed(4)])), blobs: { accent: blobsOf(grids.accent), text: blobsOf(grids.text) }, rowsAccent: +(rows / H).toFixed(3) }
  }, { src: b64(buf), inks: Object.fromEntries(Object.entries(INKS).map(([k, v]) => [k, hexRgb(v)])), o })
}

/** Darkest-channel audit (item 10): count of pixels with a channel more than `slack` below the bg token, and pixels brighter than the accent token. */
export async function emissive(browser, buf, slack = 3) {
  const p = await az(browser)
  return p.evaluate(async ({ src, bg, ac, slack }) => {
    const img = new Image(); img.src = src; await img.decode()
    const c = document.createElement('canvas'); c.width = img.width; c.height = img.height
    const x = c.getContext('2d', { willReadFrequently: true }); x.drawImage(img, 0, 0)
    const d = x.getImageData(0, 0, c.width, c.height).data
    let under = 0, over = 0
    for (let i = 0; i < d.length; i += 4) {
      if (d[i] < bg[0] - slack || d[i + 1] < bg[1] - slack || d[i + 2] < bg[2] - slack) under++
      // brighter than accent while still green-dominant (overlap of two accent exposures), not the white beam
      if (d[i + 1] > ac[1] + 6 && d[i] < 200 && d[i + 2] < 200 && d[i] >= ac[0] - 4) over++
    }
    return { under, over, total: c.width * c.height }
  }, { src: b64(buf), bg: hexRgb(INKS.bg), ac: hexRgb(INKS.accent), slack })
}

/** Fraction of pixels whose channel-sum difference exceeds 60. */
export async function diff(browser, a, b) {
  const p = await az(browser)
  return p.evaluate(async ({ a, b }) => {
    const ld = async (s) => { const i = new Image(); i.src = s; await i.decode(); const c = document.createElement('canvas'); c.width = i.width; c.height = i.height; const x = c.getContext('2d', { willReadFrequently: true }); x.drawImage(i, 0, 0); return x.getImageData(0, 0, c.width, c.height) }
    const A = await ld(a), B = await ld(b)
    if (A.width !== B.width || A.height !== B.height) return { error: 'size mismatch' }
    let n = 0; for (let i = 0; i < A.data.length; i += 4) if (Math.abs(A.data[i] - B.data[i]) + Math.abs(A.data[i + 1] - B.data[i + 1]) + Math.abs(A.data[i + 2] - B.data[i + 2]) > 60) n++
    return { frac: +(n / (A.width * A.height)).toFixed(4) }
  }, { a: b64(a), b: b64(b) })
}

/** Item 6 metric: 6px gaussian blur both, pixel differs if any channel delta > 32. Also bob centroid shift (px); the bob is the largest dense --text blob above the floor band, outside `exclude` rects (H1, slab, CTA). */
export async function blurDiff(browser, a, b, exclude = []) {
  const p = await az(browser)
  return p.evaluate(async ({ a, b, k, ex }) => {
    const ld = async (s) => { const i = new Image(); i.src = s; await i.decode(); const c = document.createElement('canvas'); c.width = i.width; c.height = i.height; const x = c.getContext('2d', { willReadFrequently: true }); x.filter = 'blur(6px)'; x.drawImage(i, 0, 0); x.filter = 'none'
      const raw = document.createElement('canvas'); raw.width = i.width; raw.height = i.height; const rx = raw.getContext('2d', { willReadFrequently: true }); rx.drawImage(i, 0, 0)
      return { blur: x.getImageData(0, 0, c.width, c.height), raw: rx.getImageData(0, 0, c.width, c.height) } }
    const A = await ld(a), B = await ld(b)
    if (A.blur.width !== B.blur.width || A.blur.height !== B.blur.height) return { error: 'size mismatch' }
    let n = 0; const d1 = A.blur.data, d2 = B.blur.data
    for (let i = 0; i < d1.length; i += 4) if (Math.abs(d1[i] - d2[i]) > 32 || Math.abs(d1[i + 1] - d2[i + 1]) > 32 || Math.abs(d1[i + 2] - d2[i + 2]) > 32) n++
    // bob mask: largest dense --text blob (density > 0.5 on a 4px grid) above the floor band, centroid of its raw pixels.
    const inEx = (i) => { const q = i / 4, X = q % A.raw.width, Y = q / A.raw.width | 0; return ex.some((r) => X >= r.x && X < r.x + r.width && Y >= r.y && Y < r.y + r.height) }
    const isK = (D, i) => (D[i] - k[0]) ** 2 + (D[i + 1] - k[1]) ** 2 + (D[i + 2] - k[2]) ** 2 < 40 * 40 * 3 / 4 && !inEx(i)
    const W = A.raw.width, H = A.raw.height, G = 4, gw = Math.ceil(W / G), gh = Math.ceil(H / G), floor = Math.floor(H * 0.62 / G)
    const bob = (R) => {
      const dens = new Float32Array(gw * gh)
      for (let i = 0; i < R.length; i += 4) if (isK(R, i)) { const q = i / 4; dens[((q / W | 0) / G | 0) * gw + ((q % W) / G | 0)] += 1 / (G * G) }
      const on = (c) => { let s = 0, m = 0; for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const x = (c % gw) + dx, y = (c / gw | 0) + dy; if (x >= 0 && y >= 0 && x < gw && y < gh) { s += dens[y * gw + x]; m++ } } return (c / gw | 0) < floor && s / m > 0.5 }
      const seen = new Uint8Array(gw * gh); let best = null
      for (let s0 = 0; s0 < dens.length; s0++) {
        if (seen[s0] || !on(s0)) continue
        const st = [s0], cells = []; seen[s0] = 1
        while (st.length) { const q = st.pop(); cells.push(q); const qx = q % gw, qy = q / gw | 0
          for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const nx = qx + dx, ny = qy + dy; if (nx < 0 || ny < 0 || nx >= gw || ny >= gh) continue; const m = ny * gw + nx; if (!seen[m] && on(m)) { seen[m] = 1; st.push(m) } } }
        if (!best || cells.length > best.length) best = cells
      }
      if (!best) return null
      let sx = 0, sy = 0, n = 0
      for (const c of best) { const cx = (c % gw) * G, cy = (c / gw | 0) * G; for (let y = cy; y < cy + G; y++) for (let x = cx; x < cx + G; x++) { if (x < W && y < H && isK(R, (y * W + x) * 4)) { sx += x; sy += y; n++ } } }
      return n ? { x: sx / n, y: sy / n, n, cells: best.length } : null
    }
    const ca = bob(A.raw.data), cb = bob(B.raw.data)
    return { frac: n / (A.blur.width * A.blur.height), ca, cb, shift: ca && cb ? Math.hypot(ca.x - cb.x, ca.y - cb.y) : null }
  }, { a: b64(a), b: b64(b), k: hexRgb(INKS.text), ex: exclude })
}

export const save = (dir, name, buf) => { mkdirSync(dir, { recursive: true }); const f = join(dir, name); writeFileSync(f, buf); return f }
export const pct = (arr, p) => { const s = [...arr].sort((a, b) => a - b); return s.length ? s[Math.min(s.length - 1, Math.floor(s.length * p))] : null }
