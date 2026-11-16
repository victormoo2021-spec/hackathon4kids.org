import { test, expect } from '@playwright/test'
import { ROUTES, MAILING_LIST, CONTACT_EMAIL, settle } from './routes'

for (const route of ROUTES) {
  test.describe(`page ${route.path}`, () => {
    test('loads with title, one h1 and no console errors', async ({ page }) => {
      const errors: string[] = []
      page.on('pageerror', (e) => errors.push(e.message))
      page.on('console', (m) => m.type() === 'error' && errors.push(m.text()))

      const res = await page.goto(route.path)
      expect(res?.status()).toBe(200)
      await expect(page).toHaveTitle(route.title)
      await expect(page.locator('h1')).toHaveCount(1)
      await expect(page.locator('main#main')).toBeVisible()
      expect(errors).toEqual([])
    })

    test('offers the mailing list and contact email', async ({ page }) => {
      await page.goto(route.path)
      const signup = page.locator(`a[href="${MAILING_LIST}"]`)
      expect(await signup.count()).toBeGreaterThan(0)
      // external links open safely
      for (const a of await signup.all()) {
        await expect(a).toHaveAttribute('rel', /noopener/)
      }
      await expect(page.locator(`footer a[href="mailto:${CONTACT_EMAIL}"]`)).toBeVisible()
    })

    test('every image has alt text and loads', async ({ page }) => {
      await page.goto(route.path)
      await page.waitForLoadState('networkidle')
      const imgs = page.locator('img')
      for (const img of await imgs.all()) {
        expect(await img.getAttribute('alt'), 'img missing alt').not.toBeNull()
        await img.scrollIntoViewIfNeeded()
        await expect
          .poll(() => img.evaluate((el: HTMLImageElement) => el.complete && el.naturalWidth > 0))
          .toBe(true)
      }
    })

    test('has no horizontal scroll, during and after entrance motion', async ({ page }) => {
      const overflow = () =>
        page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
      await page.goto(route.path)
      expect(await overflow()).toBeLessThanOrEqual(0)
      await settle(page)
      expect(await overflow()).toBeLessThanOrEqual(0)
    })
  })
}

test('footer shows the current year', async ({ page }) => {
  await page.goto('/')
  await expect(page.locator('footer')).toContainText(String(new Date().getFullYear()))
})

test('skip link is the first tab stop and jumps to main', async ({ page }) => {
  await page.goto('/')
  await page.keyboard.press('Tab')
  const focused = page.locator(':focus')
  await expect(focused).toHaveAttribute('href', '#main')
  await expect(focused).toBeVisible()
})

test('contest instructions link to code.org correctly', async ({ page }) => {
  await page.goto('/code.org')
  await expect(page.locator('a[href="https://code.org/athome"]')).toHaveCount(1)
  await expect(page.locator('a[href="https://studio.code.org/"]').first()).toBeVisible()
})

test('about page keeps the instructors anchor with team members', async ({ page }) => {
  await page.goto('/about#instructors')
  const team = page.locator('#instructors')
  await expect(team).toBeVisible()
  expect(await team.locator('img').count()).toBeGreaterThan(0)
})
