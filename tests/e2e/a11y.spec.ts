import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Page } from '@playwright/test'
import { ROUTES } from './routes'
import { scrollToBottom, scrollToTop, settle } from './helpers'

async function seriousViolations(page: Page) {
  const { violations } = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze()
  return violations
    .filter((v) => v.impact === 'serious' || v.impact === 'critical')
    .map((v) => `${v.id}: ${v.nodes.slice(0, 3).map((n) => n.target.join(' ')).join(' | ')}`)
}

async function prepare(page: Page) {
  await scrollToBottom(page)
  await scrollToTop(page)
  await settle(page)
}

test.describe('accessibility (axe)', () => {
  for (const route of ROUTES) {
    test(`${route.path} has no serious violations`, async ({ page }) => {
      await page.goto(route.path)
      await prepare(page)
      expect(await seriousViolations(page)).toEqual([])
    })
  }

  test('404 page has no serious violations', async ({ page }) => {
    await page.goto('/nope')
    await prepare(page)
    expect(await seriousViolations(page)).toEqual([])
  })

  test('home with all FAQ items open has no serious violations', async ({ page }) => {
    await page.goto('/')
    await page
      .locator('#faq details')
      .evaluateAll((els) => els.forEach((e) => ((e as HTMLDetailsElement).open = true)))
    await prepare(page)
    expect(await seriousViolations(page)).toEqual([])
  })
})
