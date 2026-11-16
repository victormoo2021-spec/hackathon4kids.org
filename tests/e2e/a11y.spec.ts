import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
import { ROUTES, settle } from './routes'

for (const route of ROUTES) {
  test(`${route.path} has no serious accessibility violations`, async ({ page }) => {
    await page.goto(route.path)
    await settle(page)
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze()
    const serious = results.violations
      .filter((v) => v.impact === 'serious' || v.impact === 'critical')
      .map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).slice(0, 3).join(', ')}`)
    expect(serious).toEqual([])
  })
}

test.describe('reduced motion', () => {
  test.use({ reducedMotion: 'reduce' })

  test('hero script does not animate', async ({ page }) => {
    await page.goto('/')
    const animated = await page.evaluate(() =>
      Array.from(document.querySelectorAll('.snap-in > *')).filter(
        (el) => getComputedStyle(el).animationName !== 'none',
      ).length,
    )
    expect(animated).toBe(0)
  })
})
