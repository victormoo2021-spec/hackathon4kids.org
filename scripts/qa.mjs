// QA harness: node scripts/qa.mjs --url http://localhost:3001 --out dir [--routes /,/about] [--label x]
import { chromium } from '@playwright/test'
import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i > 0 ? process.argv[i + 1] : d }
const base = arg('url', 'http://localhost:3001').replace(/\/$/, '')
const out = arg('out', 'qa-out')
const routes = arg('routes', '/,/about,/programs').split(',')
const label = arg('label', '')
const GL_ARGS = ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader']
const VPS = [[1440, 900], [1024, 768], [768, 1024], [390, 844], [360, 740]]
mkdirSync(out, { recursive: true })

const browser = await chromium.launch({ args: GL_ARGS })
const results = []
for (const route of routes) for (const [w, h] of VPS) {
  const mobile = w < 768
  const slug = (route === '/' ? 'home' : route.replace(/^\//, '').replace(/\//g, '-')) + `_${w}x${h}`
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, hasTouch: mobile, isMobile: mobile })
  const page = await ctx.newPage()
  const errors = [], failed = []
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text().slice(0, 200)))
  page.on('pageerror', (e) => errors.push('pageerror: ' + e.message.slice(0, 200)))
  page.on('response', (r) => r.status() >= 400 && failed.push(`${r.status()} ${r.url()}`))
  page.on('requestfailed', (r) => failed.push(`FAIL ${r.url()}`))
  await page.addInitScript(() => {
    window.__cls = 0
    new PerformanceObserver((l) => { for (const e of l.getEntries()) if (!e.hadRecentInput) window.__cls += e.value }).observe({ type: 'layout-shift', buffered: true })
  })
  const r = { route, viewport: `${w}x${h}`, errors, failed }
  try {
    await page.goto(base + route, { waitUntil: 'commit' })
    await page.waitForTimeout(300)
    await page.screenshot({ path: join(out, `${slug}_t300.png`) })
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1500)
    await page.screenshot({ path: join(out, `${slug}_fold.png`) })
    // step-scroll so scroll-triggered reveals fire, then return to top for the full-page shot
    await page.evaluate(async () => {
      for (let y = 0; y < document.documentElement.scrollHeight; y += innerHeight * 0.6) { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 120)) }
      window.scrollTo(0, 0); await new Promise((r) => setTimeout(r, 600))
    })
    await page.screenshot({ path: join(out, `${slug}_full.png`), fullPage: true })
    await page.evaluate(async () => { window.scrollTo(0, document.documentElement.scrollHeight); await new Promise((res) => setTimeout(res, 500)) })
    const m = await page.evaluate((mobile) => {
      const name = (el) => {
        if (el.id) return '#' + el.id
        let s = el.tagName.toLowerCase()
        const c = (typeof el.className === 'string' ? el.className : '').trim().split(/\s+/).filter(Boolean).slice(0, 2)
        return c.length ? s + '.' + c.join('.') : s
      }
      const vw = innerWidth
      const all = [...document.querySelectorAll('body *')]
      const vis = (el) => { const b = el.getBoundingClientRect(); const s = getComputedStyle(el); return b.width > 0 && b.height > 0 && s.visibility !== 'hidden' && s.display !== 'none' }
      const overflowEls = all.filter((e) => vis(e) && e.getBoundingClientRect().right > vw + 1).map(name)
      const small = new Set()
      for (const e of all) {
        if (!vis(e)) continue
        const own = [...e.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim())
        if (own && parseFloat(getComputedStyle(e).fontSize) < 12) small.add(name(e))
      }
      const tap = mobile ? [...new Set(all.filter((e) => e.matches('a[href],button,input,select,textarea,[role=button]') && vis(e)).filter((e) => { const b = e.getBoundingClientRect(); return b.width < 44 || b.height < 44 }).map(name))] : []
      return {
        overflow: document.documentElement.scrollWidth > vw, overflowEls: [...new Set(overflowEls)].slice(0, 15),
        noAlt: [...document.images].filter((i) => !i.hasAttribute('alt')).map((i) => i.currentSrc.slice(-60)),
        small: [...small].slice(0, 15), smallCount: small.size, tap: tap.slice(0, 15), tapCount: tap.length, cls: +(window.__cls || 0).toFixed(4),
      }
    }, mobile)
    Object.assign(r, m)
  } catch (e) { r.errors.push('harness: ' + e.message.slice(0, 200)) }
  results.push(r)
  await ctx.close()
}
await browser.close()

writeFileSync(join(out, 'report.json'), JSON.stringify({ base, label, results }, null, 2))
const md = [`# QA ${label} ${base}`, '', '| route | viewport | errors | failed req | overflow | cls | small text | tap<44 | no-alt |', '|---|---|---|---|---|---|---|---|---|']
for (const r of results) md.push(`| ${r.route} | ${r.viewport} | ${r.errors.length} | ${r.failed.length} | ${r.overflow ? 'YES ' + (r.overflowEls || []).slice(0, 3).join(' ') : 'no'} | ${r.cls ?? '?'} | ${r.smallCount ?? '?'} | ${r.tapCount ?? '-'} | ${r.noAlt?.length ?? '?'} |`)
const det = results.filter((r) => r.errors.length || r.failed.length)
if (det.length) { md.push('', '## Errors / failed requests'); for (const r of det) md.push(`- ${r.route} ${r.viewport}: ${[...r.errors, ...r.failed].slice(0, 5).join(' | ')}`) }
writeFileSync(join(out, 'report.md'), md.join('\n') + '\n')
console.log(md.join('\n'))
