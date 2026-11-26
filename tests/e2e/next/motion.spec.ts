import { expect, test } from '@playwright/test'
import { ROUTES } from '../routes'
import { settle } from '../helpers'

type W = { __raf: number }
const COUNT_RAF = () => {
  const w = window as unknown as W
  w.__raf = 0
  const orig = window.requestAnimationFrame.bind(window)
  window.requestAnimationFrame = (cb) => {
    w.__raf++
    return orig(cb)
  }
}
test.describe.configure({ timeout: 60_000 })
const raf =(page: import('@playwright/test').Page) => page.evaluate(() => (window as unknown as W).__raf)

test.describe('reduced motion', () => {
  test.use({ reducedMotion: 'reduce' })

  for (const route of ROUTES) {
    test(`${route.path}: no infinite CSS animations`, async ({ page }) => {
      await page.goto(route.path)
      await settle(page)
      const running = await page.evaluate(() =>
        document
          .getAnimations()
          .filter((a) => a.playState === 'running' && a.effect?.getComputedTiming().iterations === Infinity)
          .map((a) => {
            const t = (a.effect as KeyframeEffect).target as HTMLElement | null
            return `${t?.tagName?.toLowerCase()}.${String(t?.className ?? '')}`.slice(0, 60)
          }),
      )
      expect(running).toEqual([])
    })

    test(`${route.path}: canvases stop requesting frames after 2s`, async ({ page }) => {
      await page.addInitScript(COUNT_RAF)
      await page.goto(route.path)
      await settle(page)
      await page.waitForTimeout(2000)
      if ((await page.locator('canvas').count()) === 0) return // nothing to animate
      const a = await raf(page)
      await page.waitForTimeout(1500)
      expect((await raf(page)) - a, 'rAF calls in 1.5s').toBe(0)
    })
  }
})

test('rAF loop idles when tab reports hidden (no-preference)', async ({ page }) => {
  await page.addInitScript(COUNT_RAF)
  await page.goto('/')
  await settle(page)
  // Headless Chromium keeps firing rAF, so emulate hidden the way page code observes it.
  await page.evaluate(() => {
    Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'hidden' })
    Object.defineProperty(document, 'hidden', { configurable: true, get: () => true })
    document.dispatchEvent(new Event('visibilitychange'))
  })
  await page.waitForTimeout(500)
  const a = await raf(page)
  await page.waitForTimeout(1500)
  expect((await raf(page)) - a, 'page-scheduled rAF calls while hidden').toBeLessThanOrEqual(2)
})
