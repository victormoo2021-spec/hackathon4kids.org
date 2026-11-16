import { expect, test } from '@playwright/test'

// hover cards are a fine-pointer feature
test.skip(({ isMobile }) => isMobile, 'desktop only')

for (const reduced of [false, true]) {
  test(`course hover card shows a drawn demo${reduced ? ' (reduced motion)' : ''}`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: reduced ? 'reduce' : 'no-preference' })
    await page.goto('/')
    const row = page.locator('#courses li[data-course-group]').first()
    await row.evaluate((e) => e.scrollIntoView({ block: 'center', behavior: 'instant' }))
    await page.waitForTimeout(2500)
    const box = (await row.boundingBox())!
    await page.mouse.move(box.x + 40, box.y + box.height / 2)
    await page.mouse.move(box.x + 60, box.y + box.height / 2, { steps: 4 })
    const card = page.locator('.course-card')
    await expect(card).toHaveAttribute('data-on', '')
    await expect(card).toBeVisible()
    await page.waitForTimeout(reduced ? 300 : 1800)
    const drawn = await card.locator('canvas').evaluate((c: HTMLCanvasElement) => {
      const d = c.getContext('2d')!.getImageData(0, 0, c.width, c.height).data
      for (let i = 3; i < d.length; i += 4) if (d[i] > 0) return true
      return false
    })
    expect(drawn).toBe(true)
  })
}
