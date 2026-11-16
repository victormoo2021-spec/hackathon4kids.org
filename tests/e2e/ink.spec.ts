import { expect, test } from '@playwright/test'

const stroke = (el: Element) => {
  const cs = getComputedStyle(el, '::before')
  return { bg: cs.backgroundColor, op: Number(cs.opacity), tf: cs.transform }
}

for (const reduced of [false, true]) {
  test.describe(reduced ? 'calm tier' : 'full motion', () => {
    test.use({ reducedMotion: reduced ? 'reduce' : 'no-preference' })

    test('highlighter stroke is visible once its heading has been scrolled to', async ({ page }) => {
      await page.goto('/')
      const hl = page.locator('#class-size-title .hl')
      await hl.scrollIntoViewIfNeeded()
      await page.evaluate(() => window.scrollBy(0, 80))
      await expect(hl).toHaveClass(/hl-in/)
      await page.waitForTimeout(1500)
      const s = await hl.evaluate(stroke)
      expect(s.bg).toBe('rgb(255, 214, 10)')
      expect(s.op).toBe(1)
      expect(s.tf === 'none' || s.tf === 'matrix(1, 0, 0, 1, 0, 0)').toBe(true)
    })

    test('glyph heading settles to its real text', async ({ page }) => {
      await page.goto('/')
      const h = page.locator('#join-title')
      await h.scrollIntoViewIfNeeded()
      await expect(h.locator('.gl-overlay')).toHaveCount(0, { timeout: 5000 })
      await expect(h).toHaveText('Get the next class dates')
      await expect(h.locator('.gl')).not.toHaveClass(/gl-hide/)
    })
  })
}
