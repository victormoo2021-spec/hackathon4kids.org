import { expect, test } from '@playwright/test'
import { ROUTES } from '../routes'
import { scrollThrough, settle, trackErrors } from '../helpers'

const VIEWPORTS = [
  { w: 1440, h: 900 },
  { w: 1024, h: 768 },
  { w: 768, h: 1024 },
  { w: 390, h: 844 },
  { w: 360, h: 740 },
  { w: 360, h: 640 },
  { w: 1920, h: 1080 },
]

for (const { w, h } of VIEWPORTS) {
  test.describe(`${w}x${h}`, () => {
    test.use({ viewport: { width: w, height: h } })

    for (const route of ROUTES) {
      test(`${route.path}: layout, h1, footer, no errors`, async ({ page }) => {
        const errors = trackErrors(page)
        await page.goto(route.path)
        await settle(page)

        const h1 = page.getByRole('heading', { level: 1 }).first()
        await expect(h1).toBeVisible()
        const box = await h1.boundingBox()
        expect(box!.y, 'h1 top above fold').toBeLessThan(h)

        await scrollThrough(page)
        await settle(page)

        // name the elements that poke past the right edge (ignoring ones clipped by an ancestor)
        const offenders = await page.evaluate(() => {
          const vw = document.documentElement.clientWidth
          const out: string[] = []
          for (const el of Array.from(document.body.querySelectorAll('*'))) {
            const r = el.getBoundingClientRect()
            if (r.width === 0 || r.height === 0 || r.right <= vw + 1) continue
            let clipped = false
            for (let p = el.parentElement; p && p !== document.documentElement; p = p.parentElement) {
              if (getComputedStyle(p).overflowX !== 'visible' && p.getBoundingClientRect().right <= vw + 1) {
                clipped = true
                break
              }
            }
            if (!clipped) out.push(`${el.tagName.toLowerCase()}${el.id ? '#' + el.id : ''} right=${Math.round(r.right)}`)
          }
          return out.slice(0, 8)
        })
        const sw = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
        expect(sw, `scroll overflow; offenders: ${offenders.join(', ')}`).toBeLessThanOrEqual(0)
        expect(offenders, 'elements past viewport edge').toEqual([])

        await expect(page.getByRole('contentinfo')).toBeVisible()
        expect(errors.list).toEqual([])
      })
    }

    test('header nav usable by keyboard', async ({ page }) => {
      await page.goto('/')
      await settle(page)
      const header = page.getByRole('banner')
      const toggle = header.getByRole('button', { name: /menu|navigation/i }).first()
      if (await toggle.isVisible()) {
        await toggle.focus()
        await page.keyboard.press('Enter')
        await expect(toggle).toHaveAttribute('aria-expanded', 'true')
        await expect(page.getByRole('link', { name: /programs/i }).first()).toBeVisible()
        await page.keyboard.press('Escape')
        await expect(toggle).toHaveAttribute('aria-expanded', 'false')
      } else {
        const nav = header.getByRole('navigation').first()
        await expect(nav.getByRole('link', { name: /programs/i })).toBeVisible()
        await expect(nav.getByRole('link', { name: /about/i })).toBeVisible()
      }
    })
  })
}
