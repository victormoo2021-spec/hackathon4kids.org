import { expect, test } from '@playwright/test'
import { FINAL, brightPixels, expectNoOverflow, fxState, scrollThrough, settle, trackErrors } from './helpers'

test.describe('motion allowed (desktop)', () => {
  test.skip(({ isMobile }) => isMobile, 'pinned motion is desktop only')

  test('fixed full-viewport WebGL canvas exists, motion-ok is set', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('html.motion-ok')).toBeAttached()
    const cv = page.locator('canvas[aria-hidden]').first()
    await expect(cv).toBeAttached()
    const r = await cv.evaluate((c) => {
      const b = c.getBoundingClientRect()
      return { pos: getComputedStyle(c).position, w: b.width, h: b.height, vw: innerWidth, vh: innerHeight }
    })
    expect(r.pos).toBe('fixed')
    expect(r.w).toBeGreaterThanOrEqual(r.vw - 1)
    expect(r.h).toBeGreaterThanOrEqual(r.vh - 1)
  })

  test('story section pins while scrolling without overflow or errors', async ({ page }) => {
    const errors = trackErrors(page)
    await page.goto('/')
    await scrollThrough(page, { step: 300 })
    // the story stage pins with CSS sticky (no GSAP pin-spacer, so no layout shift)
    await expect(page.locator('#hero .hero-pin:has(#story)')).toHaveCSS('position', 'sticky')
    await expectNoOverflow(page)
    expect(errors.list).toEqual([])
  })

  test('fx reaches the final state and the canvas paints light after the hero', async ({ page }) => {
    await page.goto('/')
    await scrollThrough(page, { step: 300 })
    await page.locator('#hero').scrollIntoViewIfNeeded()
    // scroll back is reversible, so read the state while at the bottom of the hero story
    await page.evaluate(() => {
      const h = document.querySelector('#hero')!.getBoundingClientRect()
      window.scrollTo(0, scrollY + h.bottom - innerHeight - 50)
    })
    await expect.poll(() => fxState(page)).toMatchObject(FINAL)
    await expect.poll(() => brightPixels(page), { timeout: 8000 }).toBeGreaterThan(500)
  })

  test('scrolling through the story causes no layout shift', async ({ page }) => {
    await page.goto('/')
    await page.evaluate(() => {
      ;(window as unknown as { __cls: number }).__cls = 0
      new PerformanceObserver((list) => {
        for (const e of list.getEntries() as unknown as { value: number; hadRecentInput: boolean }[])
          if (!e.hadRecentInput) (window as unknown as { __cls: number }).__cls += e.value
      }).observe({ type: 'layout-shift', buffered: true })
    })
    await scrollThrough(page, { step: 300 })
    const cls = await page.evaluate(() => (window as unknown as { __cls: number }).__cls)
    expect(cls).toBeLessThan(0.05)
  })
})

const heroPinPosition = (page: import('@playwright/test').Page) =>
  page.locator('#hero .hero-pin').evaluate((el) => getComputedStyle(el).position)

test.describe('reduced motion', () => {
  test.use({ reducedMotion: 'reduce' })

  test('no pinning, no motion-ok class', async ({ page }) => {
    await page.goto('/')
    await scrollThrough(page, { step: 600, delay: 20 })
    expect(await heroPinPosition(page)).not.toBe('sticky')
    await expect(page.locator('html.motion-ok')).toHaveCount(0)
  })

  test('fx autoplays to the final state without scrolling', async ({ page }) => {
    await page.goto('/')
    await page.waitForTimeout(9000)
    expect(await fxState(page)).toMatchObject(FINAL)
  })

  test('every [data-reveal] ends visible after scrolling through', async ({ page }) => {
    await page.goto('/')
    await scrollThrough(page, { step: 600, delay: 20 })
    await settle(page)
    const opacities = await page.locator('[data-reveal]').evaluateAll((els) => els.map((e) => getComputedStyle(e).opacity))
    expect(opacities.length).toBeGreaterThan(0)
    for (const o of opacities) expect(o).toBe('1')
  })

  // Calm tier is opacity-only: after settling, nothing keeps a transform.
  // Exclusion: descendants of <canvas> (none expected; canvas drawing is not CSS motion).
  test('no element keeps a computed transform after settling', async ({ page }) => {
    await page.goto('/')
    await scrollThrough(page, { step: 600, delay: 20 })
    await settle(page)
    const bad = await page.evaluate(() =>
      Array.from(document.querySelectorAll<HTMLElement>('body *'))
        .filter((e) => !e.closest('canvas'))
        .map((e) => [e, getComputedStyle(e).transform] as const)
        .filter(([, t]) => t !== 'none' && t !== 'matrix(1, 0, 0, 1, 0, 0)')
        .map(([e, t]) => `${e.tagName}.${String(e.className).slice(0, 40)} ${t}`),
    )
    expect(bad).toEqual([])
  })
})

test.describe('load choreography and sections (desktop, no-preference)', () => {
  test.skip(({ isMobile }) => isMobile)

  test('hero h1 words rise in and end at identity', async ({ page }) => {
    await page.goto('/', { waitUntil: 'commit' })
    await page.waitForSelector('#hero h1 .w > span', { state: 'attached' })
    const ty = () =>
      page.locator('#hero h1 .w > span').evaluateAll((els) =>
        els.map((e) => new DOMMatrixReadOnly(getComputedStyle(e).transform).m42),
      )
    expect(Math.max(...(await ty()))).toBeGreaterThan(0)
    await page.waitForTimeout(1500)
    for (const y of await ty()) expect(Math.abs(y)).toBeLessThan(0.5)
  })

  test('FAQ answer is visible after opening', async ({ page }) => {
    await page.goto('/')
    const item = page.locator('details.faq-item').first()
    await item.scrollIntoViewIfNeeded()
    await item.locator('summary').click()
    await page.waitForTimeout(500)
    await expect(item.locator('p').first()).toBeVisible()
  })

  test('final CTA button is visible after scrolling to #join', async ({ page }) => {
    await page.goto('/')
    await scrollThrough(page, { step: 400, delay: 30 })
    await page.locator('#join').scrollIntoViewIfNeeded()
    await page.waitForTimeout(1500)
    await expect(page.locator('#join .btn').first()).toBeVisible()
  })

  test('scrolling to #join dispatches fx:arrive', async ({ page }) => {
    await page.goto('/')
    await page.evaluate(() => {
      ;(window as unknown as { __arrive: number }).__arrive = 0
      addEventListener('fx:arrive', () => (window as unknown as { __arrive: number }).__arrive++)
    })
    await scrollThrough(page, { step: 400, delay: 30 })
    await page.locator('#join').scrollIntoViewIfNeeded()
    await expect
      .poll(() => page.evaluate(() => (window as unknown as { __arrive: number }).__arrive))
      .toBeGreaterThan(0)
    await expect(page.locator('#join .btn').first()).toBeVisible()
  })
})

test.describe('mobile', () => {
  test.skip(({ isMobile }) => !isMobile)

  test('does not pin anything', async ({ page }) => {
    await page.goto('/')
    await page.locator('#story').scrollIntoViewIfNeeded()
    expect(await heroPinPosition(page)).not.toBe('sticky')
  })

  test('fx autoplays to the final state', async ({ page }) => {
    await page.goto('/')
    await page.waitForTimeout(9000)
    expect(await fxState(page)).toMatchObject(FINAL)
  })
})
