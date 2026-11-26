import { expect, test, type Page } from '@playwright/test'
import { armed, expectNoOverflow, scrollThrough, settle } from './helpers'

// Motion runtime is GSAP (src/app/motion): a deferred chunk armed at idle. SSR is the rest state; every [data-m] must end visible.
const GSAP = /ScrollTrigger|GreenSock|gsapVersions/
const restless = (page: Page) =>
  page.locator('[data-m]').evaluateAll((e) =>
    e.flatMap((x) => {
      const c = getComputedStyle(x)
      return c.visibility !== 'visible' || c.opacity !== '1' ? [`${x.tagName}.${x.className} vis=${c.visibility} op=${c.opacity}`] : []
    }),
  )
const count = (page: Page) => page.evaluate(() => (window as unknown as { __motion: { count(): number } }).__motion.count())

for (const reducedMotion of ['no-preference', 'reduce'] as const) {
  test.describe(`reveals (${reducedMotion})`, () => {
    test.use({ reducedMotion })

    test('every [data-m] ends visible after scrolling through', async ({ page }) => {
      await page.goto('/?gate')
      if (reducedMotion === 'no-preference') await armed(page)
      await scrollThrough(page, { step: 600, delay: 20 })
      await settle(page)
      expect(await page.locator('[data-m]').count()).toBeGreaterThan(0)
      expect(await restless(page)).toEqual([])
      await expectNoOverflow(page)
    })
  })
}

test('gsap chunk aborted: the static page is complete', async ({ page }) => {
  await page.route(/\.js(\?|$)/, async (route) => {
    const r = await route.fetch()
    const t = await r.text()
    return GSAP.test(t) ? route.abort() : route.fulfill({ response: r, body: t })
  })
  await page.goto('/')
  await scrollThrough(page, { step: 600, delay: 20 })
  expect(await restless(page)).toEqual([])
  await expect(page.locator('#class-size [data-crowd-n]')).toHaveText('20')
})

test.describe('reduced motion', () => {
  test.use({ reducedMotion: 'reduce' })
  test('never requests the gsap chunk', async ({ page }) => {
    const hits: string[] = []
    page.on('response', async (r) => {
      if (/\.js(\?|$)/.test(r.url())) GSAP.test(await r.text().catch(() => '')) && hits.push(r.url())
    })
    await page.goto('/')
    await scrollThrough(page, { step: 600, delay: 20 })
    expect(hits).toEqual([])
  })
})

test('home -> /programs -> home leaves no leaked triggers', async ({ page }) => {
  await page.goto('/?gate')
  await armed(page)
  // lazy Crowd/JoinFx register their triggers after the DOM scenes: wait until the count stops changing
  let first = -1
  await expect.poll(async () => { const n = await count(page); const same = n === first; first = n; return same }, { intervals: [1000], timeout: 15000 }).toBe(true)
  expect(first).toBeGreaterThan(5)
  await page.evaluate(() => document.querySelector<HTMLAnchorElement>('footer a[href="/programs"]')!.click()) // client-side nav without scrolling: scroll position decides which scenes arm (C3)
  await expect(page).toHaveURL(/\/programs/)
  await page.goBack()
  await expect(page).toHaveURL(/\/(\?gate)?$/)
  await expect.poll(() => count(page), { timeout: 15000 }).toBe(first)
})

test('join plays once and does not replay on scroll back', async ({ page }) => {
  await page.goto('/?gate')
  await armed(page)
  await page.evaluate(() => {
    const j = document.querySelector('#join')!
    ;(window as unknown as { __rolls: number }).__rolls = 0
    let had = j.classList.contains('rolled')
    new MutationObserver(() => {
      const h = j.classList.contains('rolled')
      if (h && !had) (window as unknown as { __rolls: number }).__rolls++
      had = h
    }).observe(j, { attributes: true, attributeFilter: ['class'] })
    j.scrollIntoView()
  })
  await expect(page.locator('#join')).toHaveClass(/stamped/, { timeout: 8000 })
  await page.evaluate(() => scrollTo(0, 0))
  await page.waitForTimeout(400)
  await page.evaluate(() => document.querySelector('#join')!.scrollIntoView())
  await page.waitForTimeout(1500)
  expect(await page.evaluate(() => (window as unknown as { __rolls: number }).__rolls)).toBe(1)
})
