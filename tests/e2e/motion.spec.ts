import { expect, test } from '@playwright/test'
import { expectNoOverflow, scrollThrough, settle } from './helpers'

// The only motion left on the lean base is the CSS reveal (data-reveal) and the hero load animation.
for (const reducedMotion of ['no-preference', 'reduce'] as const) {
  test.describe(`reveal (${reducedMotion})`, () => {
    test.use({ reducedMotion })

    test('every [data-reveal] ends visible after scrolling through', async ({ page }) => {
      await page.goto('/')
      await scrollThrough(page, { step: 600, delay: 20 })
      await settle(page)
      const els = page.locator('[data-reveal]')
      expect(await els.count()).toBeGreaterThan(0)
      for (const o of await els.evaluateAll((e) => e.map((x) => getComputedStyle(x).opacity))) expect(o).toBe('1')
      await expectNoOverflow(page)
    })
  })
}
