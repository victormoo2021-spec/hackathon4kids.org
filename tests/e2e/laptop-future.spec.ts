import { expect, test, type Page } from '@playwright/test'

test.skip(({ isMobile }) => isMobile, 'desktop laptop travel + HUD')

const centre = (page: Page, g: string) =>
  page.locator(`[data-group="${g}"]`).evaluate((e) => {
    const r = e.getBoundingClientRect()
    scrollTo(0, scrollY + r.top + r.height / 2 - innerHeight / 2)
  })

// hydrated: the intro has handed over to the code demo (scrolling earlier would land before the listeners exist)
const hydrated = (page: Page) => expect(page.locator('#story .file')).toHaveText('spiral.py', { timeout: 15000 })

const docked = (page: Page) =>
  expect.poll(async () => {
    const [a, b] = await Promise.all(['#story .laptop', '.course-lap-slot'].map((s) => page.locator(s).evaluate((e) => e.getBoundingClientRect().left)))
    return Math.abs(a - b)
  }).toBeLessThan(2)

test('HUD traces a line from the laptop to the active group title', async ({ page }) => {
  await page.goto('/')
  const hud = page.locator('#courses svg.hud')
  await expect(hud).toBeVisible()
  await expect(hud).toHaveAttribute('aria-hidden', 'true')
  await expect(hud.locator('path')).toHaveCount(4)
  await hydrated(page)
  await centre(page, 'build')
  const g = hud.locator('[data-hud="build"]')
  await expect(g).toHaveAttribute('data-on', '')
  await expect(g.locator('path')).toHaveAttribute('d', /^M[\d.-]+ [\d.-]+H/)
  await expect(g.locator('text')).toHaveText('→ build')
  await expect(hud.locator('g[data-on]')).toHaveCount(1)
})

test.describe('reduced motion', () => {
  test.use({ reducedMotion: 'reduce' })

  test('the laptop still docks and follows groups; HUD line is fully drawn', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('.demo-card').first()).toBeHidden()
    await hydrated(page)
    await centre(page, 'math')
    await expect(page.locator('#story .file')).toHaveText('line.py')
    await docked(page)
    const off = await page.locator('[data-hud="math"] path').evaluate((e) => getComputedStyle(e).strokeDashoffset)
    expect(parseFloat(off)).toBe(0)
  })
})
