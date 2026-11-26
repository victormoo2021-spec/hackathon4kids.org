// usage: node scripts/longtasks.mjs [url] ; long tasks on load, 4x CPU throttle, swiftshader (like PSI/Lighthouse mobile)
import { chromium } from '@playwright/test'
const b = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] })
const p = await b.newPage({ viewport: { width: 412, height: 823 } })
const c = await p.context().newCDPSession(p)
await c.send('Emulation.setCPUThrottlingRate', { rate: 4 })
await p.addInitScript(() => {
  window.__lt = []
  new PerformanceObserver((l) => l.getEntries().forEach((e) => window.__lt.push([Math.round(e.startTime), Math.round(e.duration)]))).observe({ type: 'longtask', buffered: true })
})
await p.goto(process.argv[2] || 'http://localhost:3999/')
await p.waitForTimeout(6000)
console.log(JSON.stringify(await p.evaluate(() => window.__lt)))
await b.close()
