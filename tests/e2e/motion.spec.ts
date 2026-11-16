import { expect, test } from '@playwright/test'
import { FINAL, expectNoOverflow, fxState, scrollThrough, settle, trackErrors } from './helpers'

test.describe('motion allowed (desktop)', () => {
  test.skip(({ isMobile }) => isMobile, 'desktop motion tier')

  test('motion-ok is set', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('html.motion-ok')).toBeAttached()
  })

  test('page scrolls without pinning, overflow or errors', async ({ page }) => {
    const errors = trackErrors(page)
    await page.goto('/')
    await scrollThrough(page, { step: 300 })
    expect(await stickyInHero(page)).toEqual([])
    await expectNoOverflow(page)
    expect(errors.list).toEqual([])
  })

  test('the laptop types the sketch on its own', async ({ page }) => {
    await page.goto('/')
    // no scrolling: the hero types once after load and each finished line drives the shader
    await expect.poll(() => fxState(page), { timeout: 15000 }).toMatchObject(FINAL)
  })

  test('scrolling the page causes no layout shift', async ({ page }) => {
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

// the hero has no pinned story any more: nothing inside it may be position: sticky
const stickyInHero = (page: import('@playwright/test').Page) =>
  page.locator('#hero').evaluate((h) => Array.from(h.querySelectorAll('*')).filter((e) => getComputedStyle(e).position === 'sticky').map((e) => e.className))

test.describe('reduced motion', () => {
  test.use({ reducedMotion: 'reduce' })

  test('no pinning, no motion-ok class', async ({ page }) => {
    await page.goto('/')
    await scrollThrough(page, { step: 600, delay: 20 })
    expect(await stickyInHero(page)).toEqual([])
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
    // deterministic: every word runs the rise animation, starting below its mask (reading a live
    // transform mid-load raced the animation under CI load)
    const starts = await page.locator('#hero h1 .w > span').evaluateAll((els) =>
      els.map((e) => {
        const a = e.getAnimations().find((x) => (x as CSSAnimation).animationName === 'h-word')
        const k = (a?.effect as KeyframeEffect | undefined)?.getKeyframes()[0]
        return k ? String(k.transform) : 'none'
      }),
    )
    for (const t of starts) expect(t).toContain('translateY')
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

  test('no fixed element is mix-blended, and every fixed canvas sits behind content (z < 0)', async ({ page }) => {
    await page.goto('/')
    const bad = await page.evaluate(() =>
      Array.from(document.querySelectorAll<HTMLElement>('body *'))
        .map((e) => [e, getComputedStyle(e)] as const)
        .filter(([, c]) => c.position === 'fixed' && c.mixBlendMode !== 'normal')
        .map(([e]) => e.tagName + '.' + String(e.className).slice(0, 40)),
    )
    expect(bad).toEqual([])
    const canvases = await page.locator('canvas').evaluateAll((els) =>
      els.map((e) => getComputedStyle(e)).filter((c) => c.position === 'fixed').map((c) => c.zIndex),
    )
    for (const z of canvases) expect(Number(z)).toBeLessThan(0)
  })
})

test.describe('mobile', () => {
  test.skip(({ isMobile }) => !isMobile)

  test('does not pin anything', async ({ page }) => {
    await page.goto('/')
    await page.locator('#story').scrollIntoViewIfNeeded()
    expect(await stickyInHero(page)).toEqual([])
  })

  test('fx autoplays to the final state', async ({ page }) => {
    await page.goto('/')
    await page.waitForTimeout(11000)
    expect(await fxState(page)).toMatchObject(FINAL)
  })
})
