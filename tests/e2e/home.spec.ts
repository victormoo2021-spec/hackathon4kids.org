import { expect, test, type Page } from '@playwright/test'
import { CONTACT_EMAIL, MAILING_LIST } from './routes'
import { armed } from './helpers'

const STATEMENT = 'Started in 2018 by two high-school students. Still taught by high-school students. Still free, in the Bay Area.'
const DONATE = `mailto:${CONTACT_EMAIL}?subject=Helping%20Hackathon4Kids`

test.beforeEach(async ({ page }) => {
  await page.goto('/')
})

test.describe('home sections', () => {
  for (const id of ['hero', 'statement', 'courses', 'class-size', 'faq', 'join']) {
    test(`#${id} exists`, async ({ page }) => {
      await expect(page.locator(`section#${id}`)).toBeAttached()
    })
  }

  test('#statement is the exact D7.2 sentence', async ({ page }) => {
    const text = ((await page.locator('section#statement').textContent()) ?? '').replace(/\s+/g, ' ').trim()
    expect(text).toBe(STATEMENT)
    expect(await page.locator('section#statement .w').count()).toBe(18)
  })

  test('crowd numeral: SSR 20, 0 above the scene once armed, 20 when the canvas has scrolled in', async ({ page }) => {
    const n = page.locator('#class-size [data-crowd-n]')
    await expect(n).toHaveText('20') // SSR text
    await page.goto('/?gate')
    await armed(page)
    await page.evaluate(() => scrollTo(0, 0))
    await expect(n).toHaveText('0', { timeout: 8000 })
    // canvas bottom at 60% of the viewport: past the scene end (bottom 75%) at every viewport height
    await page.evaluate(() => { const b = document.querySelector('#class-size canvas')!.getBoundingClientRect(); scrollTo(0, scrollY + b.bottom - innerHeight * 0.6) })
    await expect(n).toHaveText('20', { timeout: 8000 })
    await page.evaluate(() => scrollTo(0, 0))
    await expect(n).toHaveText('0', { timeout: 8000 })
  })

  test('hero contains the h1', async ({ page }) => {
    await expect(page.locator('section#hero h1')).toBeVisible()
    await expect(page.locator('h1')).toHaveCount(1)
  })

  test('join section has the mailing-list CTA', async ({ page }) => {
    await expect(page.locator(`section#join a[href="${MAILING_LIST}"]`).first()).toBeAttached()
  })

  test('donate mailto is present', async ({ page }) => {
    await expect(page.locator(`a[href="${DONATE}"]`).first()).toBeAttached()
  })
})

test('mailing-list CTA sits fully inside the first viewport', async ({ page }) => {
  const cta = page.locator(`section#hero a[href="${MAILING_LIST}"]`).first()
  await expect(cta).toBeVisible()
  await expect
    .poll(async () => {
      const box = await cta.boundingBox()
      const vp = page.viewportSize()!
      return !!box && box.x >= 0 && box.y >= 0 && box.x + box.width <= vp.width && box.y + box.height <= vp.height
    })
    .toBe(true)
})

test('mailing-list CTA is inside the first viewport at 390x844', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/')
  const box = await page.locator(`section#hero a[href="${MAILING_LIST}"]`).first().boundingBox()
  expect(box).not.toBeNull()
  expect(box!.x).toBeGreaterThanOrEqual(0)
  expect(box!.y + box!.height).toBeLessThanOrEqual(844)
  expect(box!.x + box!.width).toBeLessThanOrEqual(390)
})

test.describe('FAQ', () => {
  const faq = (page: Page) => page.locator('section#faq')

  test('has the parent-facing heading', async ({ page }) => {
    const h = faq(page).getByRole('heading', { level: 2, name: 'Questions parents ask' })
    await h.scrollIntoViewIfNeeded()
    await expect(h).toBeVisible()
  })

  test('uses native details/summary', async ({ page }) => {
    expect(await faq(page).locator('details > summary').count()).toBeGreaterThan(0)
  })

  test('toggles on click', async ({ page }) => {
    const item = faq(page).locator('details').first()
    const summary = item.locator('summary')
    await summary.scrollIntoViewIfNeeded()
    await summary.click()
    await expect(item).toHaveAttribute('open', '')
    await summary.click()
    await expect(item).not.toHaveAttribute('open', '')
  })

  test('toggles with the keyboard', async ({ page }) => {
    const item = faq(page).locator('details').first()
    await item.locator('summary').scrollIntoViewIfNeeded()
    await item.locator('summary').focus()
    await page.keyboard.press('Enter')
    await expect(item).toHaveAttribute('open', '')
    await page.keyboard.press('Space')
    await expect(item).not.toHaveAttribute('open', '')
  })

  test('answers mention free and 20', async ({ page }) => {
    await faq(page)
      .locator('details')
      .evaluateAll((els) => els.forEach((e) => ((e as HTMLDetailsElement).open = true)))
    // content check: textContent ignores the ::details-content open animation (innerText raced it)
    const text = ((await faq(page).textContent()) ?? '').toLowerCase()
    expect(text).toContain('free')
    expect(text).toContain('20')
  })
})
