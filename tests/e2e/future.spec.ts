import { expect, test } from '@playwright/test'

test('blueprint layer reveals on pointer move (desktop only)', async ({ page }, info) => {
  await page.goto('/')
  const bp = page.getByTestId('blueprint')
  await expect(bp).toHaveCount(1)
  if (info.project.name === 'mobile') {
    await expect(bp).toBeHidden()
    return
  }
  await expect(bp).toHaveCSS('opacity', '0')
  await page.mouse.move(400, 300)
  await page.mouse.move(420, 320)
  await expect(bp).toHaveCSS('opacity', '1')
})

test('Home to Programs keeps the h1 visible after transition', async ({ page }, info) => {
  await page.goto('/')
  if (info.project.name === 'mobile') await page.goto('/programs')
  else await page.locator('header').getByRole('link', { name: 'Programs' }).first().click()
  await expect(page).toHaveURL(/\/programs/)
  await expect(page.locator('h1').first()).toBeVisible()
})
