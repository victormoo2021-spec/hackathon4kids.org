import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
import { settle } from './routes'

const PATH = '/'
const openAll = (page: import('@playwright/test').Page) =>
  page.locator('section#faq details').evaluateAll((els) => els.forEach((e) => ((e as HTMLDetailsElement).open = true)))

test.beforeEach(async ({ page }) => {
  await page.goto(PATH)
  await settle(page)
})

test('FAQ has its heading', async ({ page }) => {
  await expect(
    page.locator('section#faq').getByRole('heading', { level: 2, name: 'Questions parents ask' }),
  ).toBeVisible()
})

test('every question toggles by click and keyboard', async ({ page }) => {
  const items = page.locator('section#faq details')
  const n = await items.count()
  expect(n).toBeGreaterThanOrEqual(8)
  for (let i = 0; i < n; i++) {
    const d = items.nth(i)
    const s = d.locator('summary')
    await s.click()
    await expect(d).toHaveAttribute('open', '')
    await s.click()
    await expect(d).not.toHaveAttribute('open', '')
    await s.focus()
    await page.keyboard.press('Enter')
    await expect(d).toHaveAttribute('open', '')
    await page.keyboard.press('Space')
    await expect(d).not.toHaveAttribute('open', '')
  }
})

test('answers cover cost, class size and donating', async ({ page }) => {
  const faq = page.locator('section#faq')
  await openAll(page)
  await expect(faq).toContainText(/free/i)
  await expect(faq).toContainText('20')
  await expect(
    faq.locator('a[href^="mailto:hackathon4kidsevent@gmail.com"][href*="subject=Helping%20Hackathon4Kids"]'),
  ).toBeVisible()
})

test('open FAQ has no serious accessibility violations', async ({ page }) => {
  await openAll(page)
  const results = await new AxeBuilder({ page })
    .include('section#faq')
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze()
  const serious = results.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical').map((v) => v.id)
  expect(serious).toEqual([])
})
