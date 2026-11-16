import { expect, type Page } from '@playwright/test'

/** Wait for CSS/WAAPI animations and GSAP tweens to reach their resting state. */
export async function settle(page: Page) {
  await page.evaluate(() => Promise.all(document.getAnimations().map((a) => a.finished.catch(() => {}))))
  await page.waitForTimeout(1500)
}

/** Scroll the whole page in wheel steps so scroll-driven code runs. */
export async function scrollThrough(page: Page, { step = 400, delay = 40 } = {}) {
  await page.mouse.move(10, 10)
  const total = await page.evaluate(() => document.documentElement.scrollHeight)
  const vh = page.viewportSize()?.height ?? 900
  for (let y = 0; y < total - vh + step; y += step) {
    await page.mouse.wheel(0, step)
    await page.waitForTimeout(delay)
  }
  await page.waitForTimeout(300)
}

export async function scrollToBottom(page: Page) {
  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight))
  await page.waitForTimeout(300)
}

export async function scrollToTop(page: Page) {
  await page.evaluate(() => window.scrollTo(0, 0))
  await page.waitForTimeout(300)
}

export async function expectNoOverflow(page: Page) {
  const over = () => page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
  expect(await over(), 'overflow at top').toBeLessThanOrEqual(0)
  await scrollToBottom(page)
  expect(await over(), 'overflow at bottom').toBeLessThanOrEqual(0)
}

/** Collect console errors and uncaught page errors; read `.list` after interacting. */
export function trackErrors(page: Page) {
  const list: string[] = []
  page.on('pageerror', (e) => list.push(`pageerror: ${e.message}`))
  page.on('console', (m) => {
    if (m.type() === 'error') list.push(`console: ${m.text()}`)
  })
  return { list }
}
