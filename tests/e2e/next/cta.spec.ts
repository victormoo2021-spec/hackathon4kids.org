import { expect, test } from '@playwright/test'
import { CONTACT_EMAIL, MAILING_LIST } from '../routes'
import { settle } from '../helpers'

test.describe('calls to action', () => {
  test('mailing list link fully visible in first viewport on home', async ({ page }) => {
    await page.goto('/')
    await settle(page)
    const vh = page.viewportSize()!.height
    const boxes = await page.locator(`a[href="${MAILING_LIST}"]`).evaluateAll((els) =>
      els.map((e) => {
        const r = e.getBoundingClientRect()
        return { top: r.top, bottom: r.bottom, vis: r.width > 0 && r.height > 0 }
      }),
    )
    expect(boxes.some((b) => b.vis && b.top >= 0 && b.bottom <= vh)).toBe(true)
  })

  test('mailing list link in final section; all open new tab with noopener', async ({ page }) => {
    await page.goto('/')
    await settle(page)
    const links = page.locator(`a[href="${MAILING_LIST}"]`)
    expect(await links.count()).toBeGreaterThanOrEqual(2)
    for (const l of await links.all()) {
      await expect(l).toHaveAttribute('target', '_blank')
      expect(await l.getAttribute('rel')).toMatch(/noopener/)
    }
    const last = links.last()
    await last.scrollIntoViewIfNeeded()
    await expect(last).toBeVisible()
    const pos = await last.evaluate((e) => (e.getBoundingClientRect().top + scrollY) / document.documentElement.scrollHeight)
    expect(pos).toBeGreaterThan(0.5)
  })

  test('mailto contact present', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator(`a[href^="mailto:${CONTACT_EMAIL}"]`).first()).toBeAttached()
  })
})
