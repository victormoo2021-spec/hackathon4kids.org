import { expect, test } from '@playwright/test'
import { ROUTES } from '../routes'
import { settle } from '../helpers'

type W = { __raf: number }
const COUNT_RAF = () => {
  const w = window as unknown as W
  w.__raf = 0
  const orig = window.requestAnimationFrame.bind(window)
  window.requestAnimationFrame = (cb) => {
    w.__raf++
    return orig(cb)
  }
}
test.describe.configure({ timeout: 60_000 })
const raf =(page: import('@playwright/test').Page) => page.evaluate(() => (window as unknown as W).__raf)

test.describe('reduced motion', () => {
  test.use({ reducedMotion: 'reduce' })

  for (const route of ROUTES) {
    test(`${route.path}: no infinite CSS animations`, async ({ page }) => {
      await page.goto(route.path)
      await settle(page)
      const running = await page.evaluate(() =>
        document
          .getAnimations()
          .filter((a) => a.playState === 'running' && a.effect?.getComputedTiming().iterations === Infinity)
          .map((a) => {
            const t = (a.effect as KeyframeEffect).target as HTMLElement | null
            return `${t?.tagName?.toLowerCase()}.${String(t?.className ?? '')}`.slice(0, 60)
          }),
      )
      expect(running).toEqual([])
    })

    test(`${route.path}: canvases stop requesting frames after 2s`, async ({ page }) => {
      await page.addInitScript(COUNT_RAF)
      await page.goto(route.path)
      await settle(page)
      await page.waitForTimeout(2000)
      if ((await page.locator('canvas').count()) === 0) return // nothing to animate
      const a = await raf(page)
      await page.waitForTimeout(1500)
      expect((await raf(page)) - a, 'rAF calls in 1.5s').toBe(0)
    })
  }
})

test('rAF loop idles when tab reports hidden (no-preference)', async ({ page }) => {
  await page.addInitScript(COUNT_RAF)
  await page.goto('/')
  await settle(page)
  // Headless Chromium keeps firing rAF, so emulate hidden the way page code observes it.
  await page.evaluate(() => {
    Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'hidden' })
    Object.defineProperty(document, 'hidden', { configurable: true, get: () => true })
    document.dispatchEvent(new Event('visibilitychange'))
  })
  await page.waitForTimeout(500)
  const a = await raf(page)
  await page.waitForTimeout(1500)
  expect((await raf(page)) - a, 'page-scheduled rAF calls while hidden').toBeLessThanOrEqual(2)
})

// Phosphor: reduced motion keeps cross-fades (opacity/colour, <= 240ms) and nothing else; no scroll timelines.
test.describe('reduced motion allows opacity animations only', () => {
  test.use({ reducedMotion: 'reduce' })
  const SAFE = /^(opacity|color|background-?color|border-?\w*color|outline-?color|fill|stroke|offset|composite|easing|computedOffset)$/i

  for (const route of ROUTES) {
    test(`${route.path}: only opacity/colour effects <= 240ms, no scroll timeline`, async ({ page }) => {
      await page.goto(route.path)
      await settle(page)
      const bad = await page.evaluate((src) => {
        const safe = new RegExp(src, 'i')
        return document
          .getAnimations()
          .filter((a) => a.playState === 'running')
          .flatMap((a) => {
            const props = Array.from(new Set((a.effect as KeyframeEffect).getKeyframes().flatMap((k) => Object.keys(k))))
            const dur = Number(a.effect!.getComputedTiming().duration)
            const scroll = !!a.timeline && a.timeline !== document.timeline
            const name = (a as CSSAnimation).animationName ?? (a as CSSTransition).transitionProperty
            return scroll || dur > 240 || props.some((p) => !safe.test(p)) ? [`${name}: ${props} ${dur}ms${scroll ? ' scroll-timeline' : ''}`] : []
          })
      }, SAFE.source)
      expect(bad).toEqual([])
    })
  }

  test('home: crowd numeral reads 20 and no scrub target is left faded', async ({ page }) => {
    await page.goto('/')
    await page.evaluate(() => document.querySelector('#class-size')!.scrollIntoView({ block: 'center' }))
    await expect(page.locator('#class-size [data-crowd-n]')).toHaveText('20')
    const faded = await page.evaluate(
      () => Array.from(document.querySelectorAll('#statement .w, [data-scrub]')).filter((e) => getComputedStyle(e).opacity !== '1').length,
    )
    expect(faded, 'scrub targets left faded under reduced motion').toBe(0)
  })
})
