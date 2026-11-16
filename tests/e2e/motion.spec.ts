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
    await expect(page.locator('#story .pin-spacer').first()).toBeAttached()
    await expectNoOverflow(page)
    expect(errors.list).toEqual([])
  })
})

test.describe('reduced motion', () => {
  test.use({ reducedMotion: 'reduce' })

  test('no pinning, no Lenis, no motion-ok class', async ({ page }) => {
    await page.goto('/')
    await scrollThrough(page, { step: 600, delay: 20 })
    await expect(page.locator('.pin-spacer')).toHaveCount(0)
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
    await expect(page.locator('.pin-spacer')).toHaveCount(0)
  })
})
