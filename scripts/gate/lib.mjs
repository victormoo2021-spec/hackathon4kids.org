// Shared helpers for the G2 evidence kit.
import { chromium } from '@playwright/test'
import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

export const GL_ARGS = ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader']
export const NOGL_ARGS = ['--disable-webgl', '--disable-webgl2', '--disable-3d-apis']
export const ROUTES = ['/', '/about', '/programs', '/code.org', '/this-route-does-not-exist']
export const INKS = { stock: '#F2EDE1', y: '#FFD60A', k: '#111114', blue: '#1F3FCF', over: '#1F3508', k2: '#504F4D' }
export const hexRgb = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16))

// Installed before any page script: WebGL context counter, rAF counter, CLS, frame probe.
const INIT = () => {
  const g = (window.__gate = { gl: 0, raf: 0, cls: 0, probe: [], probing: false })
  const wrap = (proto) => {
    if (!proto) return
    const o = proto.getContext
    proto.getContext = function (t, ...a) { if (/webgl/i.test(String(t))) g.gl++; return o.call(this, t, ...a) }
  }
  wrap(window.HTMLCanvasElement?.prototype); wrap(window.OffscreenCanvas?.prototype)
  const raf = window.requestAnimationFrame.bind(window)
  window.requestAnimationFrame = (cb) => raf((t) => { g.raf++; cb(t) })
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

/** Class fractions + blue blob count for a PNG buffer. */
export async function stats(browser, buf) {
  const p = await az(browser)
  return p.evaluate(async ({ src, inks }) => {
    const img = new Image(); img.src = src; await img.decode()
    const c = document.createElement('canvas'); c.width = img.width; c.height = img.height
    const x = c.getContext('2d', { willReadFrequently: true }); x.drawImage(img, 0, 0)
    const d = x.getImageData(0, 0, c.width, c.height).data
    const near = Object.fromEntries(Object.entries(inks).map(([k, v]) => [k, v.map(Number)]))
    const cnt = { stock: 0, y: 0, k: 0, blue: 0, over: 0, k2: 0, other: 0 }
    const W = c.width, H = c.height, G = 4, gw = Math.ceil(W / G), gh = Math.ceil(H / G), cell = new Uint16Array(gw * gh)
    for (let i = 0, n = W * H; i < n; i++) {
      const r = d[i * 4], g = d[i * 4 + 1], b = d[i * 4 + 2]
      let best = 'other', bd = 36 * 36 * 3 / 4
      for (const k in near) { const q = near[k], e = (r - q[0]) ** 2 + (g - q[1]) ** 2 + (b - q[2]) ** 2; if (e < bd) { bd = e; best = k } }
      cnt[best]++
      if (best === 'blue') cell[((i / W | 0) / G | 0) * gw + ((i % W) / G | 0)]++
    }
    const seen = new Uint8Array(gw * gh); let blobs = 0
    for (let s = 0; s < cell.length; s++) {
      if (seen[s] || cell[s] < 8) continue
      let area = 0; const st = [s]; seen[s] = 1
      while (st.length) { const q = st.pop(); area++; const qx = q % gw, qy = q / gw | 0
        for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const nx = qx + dx, ny = qy + dy; if (nx < 0 || ny < 0 || nx >= gw || ny >= gh) continue; const m = ny * gw + nx; if (!seen[m] && cell[m] >= 8) { seen[m] = 1; st.push(m) } } }
      if (area >= 3) blobs++
    }
    const t = W * H
    return { w: W, h: H, frac: Object.fromEntries(Object.entries(cnt).map(([k, v]) => [k, +(v / t).toFixed(4)])), blueBlobs: blobs }
  }, { src: b64(buf), inks: Object.fromEntries(Object.entries(INKS).map(([k, v]) => [k, hexRgb(v)])) })
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

export const save = (dir, name, buf) => { mkdirSync(dir, { recursive: true }); const f = join(dir, name); writeFileSync(f, buf); return f }
export const pct = (arr, p) => { const s = [...arr].sort((a, b) => a - b); return s.length ? s[Math.min(s.length - 1, Math.floor(s.length * p))] : null }
