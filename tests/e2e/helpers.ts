import { expect, type Page } from '@playwright/test'

/** Wait for CSS/WAAPI animations and GSAP tweens to reach their resting state. */
export async function settle(page: Page) {
  // ignore animations that never "finish": infinite loops (caret blink) and
  // scroll-linked ones (animation-timeline: view()), which follow scroll position
  await page.evaluate(() =>
    Promise.all(
      document
        .getAnimations()
        .filter((a) => a.timeline === document.timeline)
        .filter((a) => a.effect?.getComputedTiming().iterations !== Infinity)
        .map((a) => a.finished.catch(() => {})),
    ),
  )
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
    // software-GL perf chatter is not an app error
    if (m.type() === 'error' && !/GPU stall|GL Driver Message/i.test(m.text())) list.push(`console: ${m.text()}`)
  })
  return { list }
}

type FxWin = { __fx: { get(): Record<string, unknown> } }

/** Current fx store state (window.__fx is exposed by the shader canvas). */
export const fxState = (page: Page) => page.evaluate(() => (window as unknown as FxWin).__fx?.get())

export const FINAL = { glow: 'purple', streaks: 5, sparkle: true, followMouse: true }

/** Count of sampled pixels in a viewport screenshot clearly brighter than black, canvas only. */
export async function brightPixels(page: Page): Promise<number> {
  // hide everything but the canvas so text does not count
  const style = await page.addStyleTag({
    content: 'html{background:#000!important}*:not(canvas){color:transparent!important;background:transparent!important;border-color:transparent!important;box-shadow:none!important;text-shadow:none!important}img,svg,video{visibility:hidden!important}',
  })
  const png = await page.screenshot()
  await style.evaluate((e) => (e as Element).remove())
  return page.evaluate(async (b64) => {
    const img = new Image()
    img.src = `data:image/png;base64,${b64}`
    await img.decode()
    const c = document.createElement('canvas')
    c.width = img.width
    c.height = img.height
    const g = c.getContext('2d')!
    g.drawImage(img, 0, 0)
    const d = g.getImageData(0, 0, c.width, c.height).data
    let n = 0
    for (let i = 0; i < d.length; i += 16) if (d[i] + d[i + 1] + d[i + 2] > 60) n++
    return n
  }, png.toString('base64'))
}
