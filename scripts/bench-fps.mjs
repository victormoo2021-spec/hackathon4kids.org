// FPS benchmark: rAF frame-time p50/p95/max in idle hero, hero scroll, full-page scroll,
// at desktop and at 390x844 with 4x CPU throttle (CDP). Prints JSON.
// Usage (serve a production build first):  BASE_URL=http://localhost:3000 node scripts/bench-fps.mjs
import { chromium } from '@playwright/test'

const BASE = process.env.BASE_URL || 'http://localhost:3000'
const GL = ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader']

const stats = (a) => {
  const s = [...a].sort((x, y) => x - y)
  const q = (p) => +s[Math.min(s.length - 1, Math.floor(p * s.length))].toFixed(1)
  return { frames: s.length, p50: q(0.5), p95: q(0.95), max: +s[s.length - 1].toFixed(1) }
}

const record = (page, ms) =>
  page.evaluate(
    (ms) =>
      new Promise((res) => {
        const t = []
        let last = performance.now()
        const end = last + ms
        const tick = (now) => {
          t.push(now - last)
          last = now
          now < end ? requestAnimationFrame(tick) : res(t)
        }
        requestAnimationFrame(tick)
      }),
    ms,
  )

// scroll y0 -> y1 in small steps over ms while recording frames
async function scrollRun(page, y0, y1, ms) {
  const rec = record(page, ms)
  const steps = Math.round(ms / 50)
  for (let i = 1; i <= steps; i++) {
    await page.evaluate((y) => window.scrollTo(0, y), y0 + ((y1 - y0) * i) / steps)
    await page.waitForTimeout(50)
  }
  return rec
}

async function profile(browser, name, ctxOpts, throttle) {
  const ctx = await browser.newContext(ctxOpts)
  const page = await ctx.newPage()
  if (throttle) {
    const cdp = await ctx.newCDPSession(page)
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: throttle })
  }
  await page.goto(BASE, { waitUntil: 'load' })
  await page.waitForTimeout(1500)
  const { heroEnd, total } = await page.evaluate(() => ({
    heroEnd: document.querySelector('#hero')?.getBoundingClientRect().bottom + scrollY - innerHeight || innerHeight,
    total: document.documentElement.scrollHeight - innerHeight,
  }))
  const out = {}
  out.idleHero3s = stats(await record(page, 3000))
  out.scrollHero = stats(await scrollRun(page, 0, Math.max(heroEnd, 1), 6000))
  out.scrollFull = stats(await scrollRun(page, 0, total, 10000))
  await ctx.close()
  return [name, out]
}

const browser = await chromium.launch({ args: GL })
const results = Object.fromEntries([
  await profile(browser, 'desktop1440x900', { viewport: { width: 1440, height: 900 } }),
  await profile(
    browser,
    'mobile390x844_cpu4x',
    { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 },
    4,
  ),
])
await browser.close()
console.log(JSON.stringify({ base: BASE, results }, null, 2))
