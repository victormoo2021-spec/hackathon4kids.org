import { expect, test } from '@playwright/test'
import { CONTACT_EMAIL, MAILING_LIST, ROUTES } from './routes'
import { expectNoOverflow, scrollThrough, trackErrors } from './helpers'

for (const route of ROUTES) {
  test.describe(`page contract ${route.path}`, () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(route.path)
    })

    test('has the expected title', async ({ page }) => {
      await expect(page).toHaveTitle(route.title)
    })

    test('has exactly one h1 and main#main', async ({ page }) => {
      await expect(page.locator('h1')).toHaveCount(1)
      await expect(page.locator('main#main')).toHaveCount(1)
    })

    test('skip link is the first tab stop', async ({ page }) => {
      await page.keyboard.press('Tab')
      const skip = page.locator(':focus')
      await expect(skip).toHaveAttribute('href', '#main')
      await expect(skip).toBeVisible()
    })

    test('header has navigation', async ({ page }) => {
      await expect(page.locator('header nav').first()).toBeAttached()
    })

    test('footer has contact email and current year', async ({ page }) => {
      const footer = page.locator('footer')
      await expect(footer.locator(`a[href="mailto:${CONTACT_EMAIL}"]`).first()).toBeAttached()
      await expect(footer).toContainText(String(new Date().getFullYear()))
    })

    test('links to the mailing list safely', async ({ page }) => {
      const links = page.locator(`a[href="${MAILING_LIST}"]`)
      expect(await links.count()).toBeGreaterThan(0)
      for (const rel of await links.evaluateAll((els) => els.map((e) => e.getAttribute('rel') ?? ''))) {
        expect(rel).toContain('noopener')
      }
    })

    test('has no horizontal overflow', async ({ page }) => {
      await expectNoOverflow(page)
    })

    test('images have alt text and load', async ({ page }) => {
      await page.evaluate(() =>
        document.querySelectorAll('img[loading="lazy"]').forEach((i) => ((i as HTMLImageElement).loading = 'eager')),
      )
      const imgs = await page
        .locator('img')
        .evaluateAll((els) => (els as HTMLImageElement[]).map((i) => ({ src: i.currentSrc || i.src, alt: i.getAttribute('alt') })))
      for (const i of imgs) expect(i.alt, `alt for ${i.src}`).not.toBeNull()
      await expect
        .poll(() =>
          page.locator('img').evaluateAll((els) => (els as HTMLImageElement[]).every((i) => i.complete && i.naturalWidth > 0)),
        )
        .toBe(true)
    })

    test('has no console or page errors while scrolling', async ({ page, isMobile }) => {
      test.skip(isMobile, 'wheel scrolling is a desktop interaction')
      const errors = trackErrors(page)
      await page.reload()
      await scrollThrough(page)
      expect(errors.list).toEqual([])
    })
  })
}

test.describe('navigation', () => {
  test.describe('desktop', () => {
    test.skip(({ isMobile }) => isMobile)

    for (const [name, path] of [
      ['Programs', '/programs'],
      ['About', '/about'],
    ] as const) {
      test(`${name} link goes to ${path} and is aria-current`, async ({ page }) => {
        await page.goto('/')
        await page.locator('header nav').getByRole('link', { name }).first().click()
        await expect(page).toHaveURL(path)
        await expect(page.locator('header nav a[aria-current="page"]').first()).toBeVisible()
      })
    }

    test('Contest link goes to /code.org', async ({ page }) => {
      await page.goto('/')
      await page.locator('header nav').getByRole('link', { name: /contest/i }).first().click()
      await expect(page).toHaveURL(/\/code\.org$/)
    })
  })

  test.describe('mobile menu', () => {
    test.skip(({ isMobile }) => !isMobile)

    test('Escape closes the menu and returns focus to the toggle', async ({ page }) => {
      await page.goto('/')
      const toggle = page.locator('header button[aria-expanded]').first()
      await expect(toggle).toHaveAttribute('aria-expanded', 'false')
      await toggle.click()
      await expect(toggle).toHaveAttribute('aria-expanded', 'true')
      const menu = page.locator(`#${await toggle.getAttribute('aria-controls')}`)
      await expect(menu).toBeVisible()
      await page.keyboard.press('Escape')
      await expect(toggle).toHaveAttribute('aria-expanded', 'false')
      await expect(menu).toBeHidden()
      await expect(toggle).toBeFocused()
    })

    test('choosing Programs navigates and closes the menu', async ({ page }) => {
      await page.goto('/')
      const toggle = page.locator('header button[aria-expanded]').first()
      await toggle.click()
      const menu = page.locator(`#${await toggle.getAttribute('aria-controls')}`)
      await menu.getByRole('link', { name: 'Programs' }).click()
      await expect(page).toHaveURL(/\/programs$/)
      await expect(toggle).toHaveAttribute('aria-expanded', 'false')
      await expect(menu).toBeHidden()
    })
  })
})

test.describe('page content', () => {
  test('about has an instructors section with team images', async ({ page }) => {
    await page.goto('/about#instructors')
    const section = page.locator('#instructors')
    await expect(section).toBeAttached()
    expect(await section.locator('img').count()).toBeGreaterThan(0)
  })

  test('contest page links to Code.org resources', async ({ page }) => {
    await page.goto('/code.org')
    await expect(page.locator('a[href="https://studio.code.org/"]').first()).toBeAttached()
    await expect(page.locator('a[href="https://code.org/athome"]').first()).toBeAttached()
  })

  test('programs page links flyers to full-size images', async ({ page }) => {
    await page.goto('/programs')
    const flyers = page.locator('main a[href$=".png"], main a[href$=".jpg"], main a[href$=".jpeg"], main a[href$=".webp"]')
    expect(await flyers.count()).toBeGreaterThan(0)
  })
})

test.describe('SEO and system routes', () => {
  test('robots.txt mentions the sitemap', async ({ request }) => {
    const res = await request.get('/robots.txt')
    expect(res.status()).toBe(200)
    expect((await res.text()).toLowerCase()).toContain('sitemap')
  })

  test('sitemap.xml lists all four routes', async ({ request }) => {
    const res = await request.get('/sitemap.xml')
    expect(res.status()).toBe(200)
    const xml = await res.text()
    for (const p of ['/programs', '/about', '/code.org']) expect(xml).toContain(p)
    expect((xml.match(/<loc>/g) ?? []).length).toBe(4)
  })

  test('opengraph image is a png', async ({ request }) => {
    const res = await request.get('/opengraph-image')
    expect(res.status()).toBe(200)
    expect(res.headers()['content-type']).toContain('image/png')
  })

  test('unknown route is a branded 404 linking home', async ({ page }) => {
    const res = await page.goto('/nope')
    expect(res?.status()).toBe(404)
    await expect(page.locator('h1')).toHaveCount(1)
    await expect(page.locator('main a[href="/"]').first()).toBeVisible()
  })
})
