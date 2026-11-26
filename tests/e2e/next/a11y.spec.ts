import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Page } from '@playwright/test'
import { ROUTES } from '../routes'
import { scrollToBottom, scrollToTop, settle } from '../helpers'

async function serious(page: Page) {
  const { violations } = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze()
  return violations
    .filter((v) => v.impact === 'serious' || v.impact === 'critical')
    .map((v) => `${v.id}: ${v.nodes.slice(0, 3).map((n) => n.target.join(' ')).join(' | ')}`)
}

for (const motion of ['no-preference', 'reduce'] as const) {
  test.describe(`axe, motion=${motion}`, () => {
    test.use({ reducedMotion: motion })
    for (const route of ROUTES) {
      test(`${route.path}: 0 serious/critical`, async ({ page }) => {
        await page.goto(route.path)
        await scrollToBottom(page)
        await scrollToTop(page)
        await settle(page)
        expect(await serious(page)).toEqual([])
      })
    }
  })
}

test.describe('keyboard focus', () => {
  for (const route of ROUTES) {
    test(`${route.path}: interactive elements focusable with visible focus`, async ({ page }) => {
      await page.goto(route.path)
      await settle(page)
      // Tab through the page like a user so :focus-visible applies.
      const seen = new Set<string>()
      const bad: string[] = []
      for (let i = 0; i < 80; i++) {
        await page.keyboard.press('Tab')
        const r = await page.evaluate(() => {
          const el = document.activeElement as HTMLElement | null
          if (!el || el === document.body) return null
          const f = getComputedStyle(el)
          const ok = (f.outlineStyle !== 'none' && parseFloat(f.outlineWidth) > 0) || f.boxShadow !== 'none'
          const id = el.tagName + '|' + (el.getAttribute('href') ?? '') + '|' + (el.textContent ?? '').trim().slice(0, 20)
          return { id, ok }
        })
        if (!r || seen.has(r.id)) { if (r) break; continue }
        seen.add(r.id)
        if (!r.ok) bad.push(r.id)
      }
      expect(seen.size, 'tabbable elements reached').toBeGreaterThan(3)
      expect(bad, 'focused without outline or box-shadow').toEqual([])
    })
  }

  test('every visible link/button is keyboard-reachable (not tabindex=-1)', async ({ page }) => {
    await page.goto('/')
    await settle(page)
    const bad = await page.evaluate(() =>
      Array.from(document.querySelectorAll<HTMLElement>('a[href], button, input, select, textarea, summary'))
        .filter((e) => e.tabIndex < 0 && e.getBoundingClientRect().width > 0 && !e.closest('[hidden],[inert],[aria-hidden="true"]'))
        .map((e) => e.tagName + ':' + (e.textContent ?? '').trim().slice(0, 20)),
    )
    expect(bad).toEqual([])
  })
})
