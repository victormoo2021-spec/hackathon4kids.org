import { expect, test } from '@playwright/test'
import { expectNoOverflow, scrollThrough, settle } from './helpers'

// Motion runtime is [data-ink] (src/app/press/observe.ts): JS adds .pre below the fold, .in on entry.
for (const reducedMotion of ['no-preference', 'reduce'] as const) {
  test.describe(`ink reveal (${reducedMotion})`, () => {
    test.use({ reducedMotion })

    test('every [data-ink] ends visible after scrolling through', async ({ page }) => {
      await page.goto('/')
      await scrollThrough(page, { step: 600, delay: 20 })
      await settle(page)
      const els = page.locator('[data-ink]')
      expect(await els.count()).toBeGreaterThan(0)
      const bad = await els.evaluateAll((e) =>
        e.flatMap((x) => {
          const c = getComputedStyle(x)
          return x.classList.contains('pre') || c.visibility !== 'visible' || c.opacity !== '1'
            ? [`${x.tagName}.${x.className} vis=${c.visibility} op=${c.opacity}`]
            : []
        }),
      )
      expect(bad).toEqual([])
      await expectNoOverflow(page)
    })
  })
}
