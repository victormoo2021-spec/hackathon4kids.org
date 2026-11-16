import { test, expect } from '@playwright/test'

const NAV = [
  { name: /programs/i, path: '/programs' },
  { name: /about/i, path: '/about' },
]

test.describe('desktop navigation', () => {
  test.skip(({ isMobile }) => isMobile, 'desktop only')

  for (const item of NAV) {
    test(`nav goes to ${item.path} and marks it current`, async ({ page }) => {
      await page.goto('/')
      const nav = page.getByRole('navigation').first()
      await nav.getByRole('link', { name: item.name }).first().click()
      await expect(page).toHaveURL(item.path)
      await expect(nav.locator('[aria-current="page"]').first()).toBeVisible()
    })
  }

  test('contest link reaches the instructions page', async ({ page }) => {
    await page.goto('/')
    await page.locator('header a[href="/code.org"]').first().click()
    await expect(page).toHaveURL('/code.org')
  })
})

test.describe('mobile menu', () => {
  test.skip(({ isMobile }) => !isMobile, 'mobile only')

  test('opens, navigates, and closes with Escape', async ({ page }) => {
    await page.goto('/')
    const toggle = page.locator('header button[aria-expanded]')
    await expect(toggle).toHaveAttribute('aria-expanded', 'false')

    await toggle.click()
    await expect(toggle).toHaveAttribute('aria-expanded', 'true')
    const menuId = await toggle.getAttribute('aria-controls')
    const menu = page.locator(`#${menuId}`)
    await expect(menu).toBeVisible()

    await page.keyboard.press('Escape')
    await expect(toggle).toHaveAttribute('aria-expanded', 'false')

    await toggle.click()
    await menu.getByRole('link', { name: /programs/i }).first().click()
    await expect(page).toHaveURL('/programs')
    await expect(page.locator('header button[aria-expanded]')).toHaveAttribute('aria-expanded', 'false')
  })
})
