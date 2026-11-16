export const MAILING_LIST = 'https://forms.gle/ou5o62fdUXCHUzxA8'
export const CONTACT_EMAIL = 'hackathon4kidsevent@gmail.com'

export const ROUTES = [
  { path: '/', title: /Hackathon4Kids/ },
  { path: '/programs', title: /Programs/ },
  { path: '/about', title: /About/ },
  { path: '/code.org', title: /Contest/ },
] as const

import type { Page } from '@playwright/test'

/** Wait for entrance animations to settle so checks see the resting layout. */
export async function settle(page: Page) {
  await page.evaluate(() => Promise.all(document.getAnimations().map((a) => a.finished.catch(() => {}))))
}
