// usage: node scripts/herocap.mjs outDir ; hero screenshots at 1440/390 on real GPU (metal) after 2.5s
import { chromium } from '@playwright/test'
const out = process.argv[2] || '.'
const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=metal'] })
for (const [w, h] of [[1440, 900], [390, 844]]) {
  const p = await b.newPage({ viewport: { width: w, height: h } })
  await p.goto(process.env.BASE_URL || 'http://localhost:3999/')
  await p.waitForTimeout(2500)
  console.log(w, 'data-gl', await p.evaluate(() => document.querySelector('.hs')?.hasAttribute('data-gl')))
  await p.screenshot({ path: `${out}/hero-${w}.png` })
  await p.close()
}
await b.close()
