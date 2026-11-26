// usage: node scripts/prof.mjs [url] ; top self-time functions on load (4x CPU throttle, swiftshader)
import { chromium } from '@playwright/test'
const b = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] })
const p = await b.newPage({ viewport: { width: 412, height: 823 } })
const c = await p.context().newCDPSession(p)
await c.send('Emulation.setCPUThrottlingRate', { rate: 4 })
await c.send('Profiler.enable')
await c.send('Profiler.start')
await p.goto(process.argv[2] || 'http://localhost:3999/')
await p.waitForTimeout(5000)
const { profile } = await c.send('Profiler.stop')
const self = new Map()
const dt = profile.timeDeltas
const byId = new Map(profile.nodes.map((n) => [n.id, n]))
profile.samples.forEach((id, i) => self.set(id, (self.get(id) || 0) + dt[i] / 1000))
const top = [...self].sort((a, b) => b[1] - a[1]).slice(0, 12).map(([id, ms]) => {
  const f = byId.get(id).callFrame
  return `${Math.round(ms)}ms ${f.functionName || '(anon)'} ${f.url.split('/').pop()}:${f.lineNumber}:${f.columnNumber}`
})
console.log(top.join('\n'))
await b.close()
