// Roller draw factory (lazy, owned by JoinFx). mountRoller(cv, band) -> { draw(line01), destroy } or null without GL.
// line01 is the flood progress (0..1); the lag offset is derived: offY = 10 * .55^round(line * 6). The join timeline drives it.
import { INK } from './ink'
import { mountSheet, press } from './gl/press'

const rgb = [1, 3, 5].map((i) => parseInt(INK.accent.slice(i, i + 2), 16) / 255)

export function mountRoller(cv: HTMLCanvasElement, band: HTMLElement) {
  const dpr = Math.min(devicePixelRatio || 1, 1.5)
  const r = band.getBoundingClientRect()
  const w = Math.round(r.width * dpr), h = Math.round(r.height * dpr)
  cv.width = w; cv.height = h
  const sheet = mountSheet(cv, 'roller', { dprCap: 1.5, fallback: () => {} })
  if (!press.ok) { sheet.destroy(); return null }
  sheet.animate(true)
  return {
    draw(line: number) {
      const offY = 10 * 0.55 ** Math.round(line * 6)
      sheet.set({ uRes: [w, h], uLine: h * line, uInk: rgb, uOff: [1.5 * dpr, (1 + offY) * dpr], uDpr: dpr })
      sheet.dirty()
    },
    destroy() { sheet.animate(false); sheet.destroy() },
  }
}
