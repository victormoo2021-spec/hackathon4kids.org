import { expect, test } from '@playwright/test'
import { scrollThrough } from '../helpers'

test.describe.configure({ timeout: 60_000 })

test('home: CLS < 0.02 through load and scroll', async ({ page }) => {
  await page.addInitScript(() => {
    const w = window as unknown as { __cls: number }
    w.__cls = 0
    new PerformanceObserver((l) => {
      for (const e of l.getEntries() as unknown as { value: number; hadRecentInput: boolean }[])
        if (!e.hadRecentInput) w.__cls += e.value
    }).observe({ type: 'layout-shift', buffered: true })
  })
  await page.goto('/')
  await page.waitForLoadState('networkidle')
  await scrollThrough(page)
  expect(await page.evaluate(() => (window as unknown as { __cls: number }).__cls)).toBeLessThan(0.02)
})

test('home: LCP is text or image, under 2.5s on desktop', async ({ page }, info) => {
  type L = { t: number; tag: string } | null
  await page.addInitScript(() => {
    const w = window as unknown as { __lcp: L }
    w.__lcp = null
    new PerformanceObserver((l) => {
      const e = l.getEntries().at(-1) as unknown as { startTime: number; element: Element | null }
      w.__lcp = { t: e.startTime, tag: e.element?.tagName.toLowerCase() ?? 'none' }
    }).observe({ type: 'largest-contentful-paint', buffered: true })
  })
  await page.goto('/')
  await page.waitForLoadState('networkidle')
  await page.waitForFunction(() => (window as unknown as { __lcp: unknown }).__lcp !== null, null, { timeout: 15_000 }).catch(() => {})
  await page.mouse.click(5, 5) // input finalises LCP
  await page.waitForTimeout(300)
  const lcp = await page.evaluate(() => (window as unknown as { __lcp: L }).__lcp)
  expect(lcp, 'LCP entry recorded').not.toBeNull()
  expect(lcp!.tag, 'LCP element must not be a canvas').not.toBe('canvas')
  if (info.project.name === 'desktop') expect(lcp!.t, `LCP ${lcp!.tag}`).toBeLessThan(2500)
})
