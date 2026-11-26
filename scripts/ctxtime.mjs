// usage: node scripts/ctxtime.mjs [url] ; main-thread cost of a fresh webgl2 getContext on the loaded page (swiftshader, 4x throttle)
import { chromium } from '@playwright/test'
const b = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] })
const p = await b.newPage({ viewport: { width: 412, height: 823 } })
const c = await p.context().newCDPSession(p)
await c.send('Emulation.setCPUThrottlingRate', { rate: 4 })
await p.goto(process.argv[2] || 'http://localhost:3999/')
for (const wait of [0, 3000, 3000]) {
  await p.waitForTimeout(wait)
  console.log(wait, await p.evaluate(() => {
    const t = performance.now()
    const g = document.createElement('canvas').getContext('webgl2', { alpha: false, antialias: false })
    const t1 = performance.now()
    g.getParameter(g.RENDERER)
    return [Math.round(t1 - t), Math.round(performance.now() - t1)]
  }))
}
await b.close()
