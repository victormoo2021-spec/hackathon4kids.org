import { expect, test } from '@playwright/test'
import { expectNoOverflow, scrollThrough, trackErrors } from './helpers'

test.describe('motion allowed (desktop)', () => {
  test.skip(({ isMobile }) => isMobile, 'pinned motion is desktop only')

  test('Lenis smooth scroll is active', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('html.lenis')).toBeAttached()
    await expect(page.locator('html.motion-ok')).toBeAttached()
  })

  test('story section pins while scrolling without overflow or errors', async ({ page }) => {
    const errors = trackErrors(page)
    await page.goto('/')
    await scrollThrough(page, { step: 300 })
    // the story stage pins with CSS sticky (no GSAP pin-spacer, so no layout shift)
    await expect(page.locator('#hero .hero-pin:has(#story)')).toHaveCSS('position', 'sticky')
    await expectNoOverflow(page)
    expect(errors.list).toEqual([])
  })

  test('scrolling through the story causes no layout shift', async ({ page }) => {
    await page.goto('/')
    await page.evaluate(() => {
      ;(window as unknown as { __cls: number }).__cls = 0
      new PerformanceObserver((list) => {
        for (const e of list.getEntries() as unknown as { value: number; hadRecentInput: boolean }[])
          if (!e.hadRecentInput) (window as unknown as { __cls: number }).__cls += e.value
      }).observe({ type: 'layout-shift', buffered: true })
    })
    await scrollThrough(page, { step: 300 })
    const cls = await page.evaluate(() => (window as unknown as { __cls: number }).__cls)
    expect(cls).toBeLessThan(0.05)
  })
})

const heroPinPosition = (page: import('@playwright/test').Page) =>
  page.locator('#hero .hero-pin').evaluate((el) => getComputedStyle(el).position)

test.describe('reduced motion', () => {
  test.use({ reducedMotion: 'reduce' })

  test('no pinning, no Lenis, no motion-ok class', async ({ page }) => {
    await page.goto('/')
    await scrollThrough(page, { step: 600, delay: 20 })
    expect(await heroPinPosition(page)).not.toBe('sticky')
    await expect(page.locator('html.lenis')).toHaveCount(0)
    await expect(page.locator('html.motion-ok')).toHaveCount(0)
  })

  test('all reveal elements are visible without scrolling', async ({ page }) => {
    await page.goto('/')
    const opacities = await page.locator('[data-reveal]').evaluateAll((els) => els.map((e) => getComputedStyle(e).opacity))
    for (const o of opacities) expect(o).toBe('1')
  })
})

test.describe('mobile', () => {
  test.skip(({ isMobile }) => !isMobile)

  test('does not pin anything', async ({ page }) => {
    await page.goto('/')
    await page.locator('#story').scrollIntoViewIfNeeded()
    expect(await heroPinPosition(page)).not.toBe('sticky')
  })
})
