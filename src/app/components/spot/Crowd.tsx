'use client'
import { useEffect, useRef } from 'react'
import { mountSheet } from '../../press/gl/press'
import { INK } from '../../press/ink'
import { pack, type Prim } from './fields'
import { paintProof, rgb } from './paint2d'

// 20 kids in a 5x4 grid (x 0.14..0.94, y 0.16..0.76, r .07) + 1 instructor. The instructor sits clear of the grid,
// right of and below dot 20: centre distance .23 > .07 + .10 + gap, so the two never touch (the old CSS crowd overlapped them).
const A = 1.25 // sheet aspect w/h; unit = height
const kids: Prim[] = Array.from({ length: 20 }, (_, i) => [1, 0.14 + (i % 5) * 0.2, 0.16 + Math.floor(i / 5) * 0.2, 0, 0, 0.07, 1, 0])
const PULSE = [1.5, 1.2, 1] // instructor landing, one value per 70ms tick
// n kids in reading order, plus the instructor when gain > 0. A flat disc has no dot gain, so the pulse swells its radius (1.5 -> +8%, stays inside the sheet).
const dots = (n: number, gain: number): Prim[] => [...kids.slice(0, n), ...(gain ? [[1, 1.13, 0.89, 0, 0, 0.1 * (1 + (gain - 1) * 0.16), 1, 2] as Prim] : [])]

// Fills with scroll (direction 7.4): one IntersectionObserver, no scroll listener, no rAF, reversible.
export default function Crowd({ paper = INK.bg, ink = INK.text, yellow = INK.accent, className }: { paper?: string; ink?: string; yellow?: string; className?: string }) {
  const cv = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const c = cv.current!, reduce = matchMedia('(prefers-reduced-motion: reduce)').matches
    const out = document.querySelector('#class-size [data-crowd-n]')
    let n = reduce ? 20 : 0, gain = reduce ? 1 : 0
    const dpr = Math.min(devicePixelRatio || 1, 1.5)
    const size = () => { const w = Math.round(c.clientWidth * dpr); if (w && c.width !== w) { c.width = w; c.height = Math.round(w / A); return true } }
    size()
    const sheet = mountSheet(c, 'prims', {
      dprCap: 1.5,
      fallback: (g, w, h) => paintProof(g, w, h, dots(n, gain), { paper, ink, ghost: paper, yellow }, 0, 1, dpr, true),
    })
    const upload = () => {
      const { pa, pb, n: count } = pack(dots(n, gain))
      sheet.set({ uPa: pa, uPb: pb, uN: count, uDev: 1, uAng: 0, uRes: [c.width, c.height], uDpr: dpr, uOff: [1.5 * dpr, dpr] })
      sheet.dirty()
      if (out) out.textContent = String(n)
    }
    sheet.set({ uInk: rgb(ink), uPaperCol: rgb(paper), uGhost: rgb(paper), uYel: rgb(yellow), uGain: 0.06, uSolid: 1 })
    upload()
    const timers: number[] = []
    const io = new IntersectionObserver(([e]) => {
      const rb = e.rootBounds, r = e.boundingClientRect
      // 1 = as much of the box as the root can hold (a short viewport still reaches 20); a box leaving through the top stays full
      const ratio = rb && r.top < rb.top ? 1 : Math.min(1, e.intersectionRatio / Math.min(1, rb ? rb.height / r.height : 1))
      n = Math.round(ratio * 20)
      if (ratio < 0.999) { timers.forEach(clearTimeout); timers.length = 0; gain = 0 }
      else if (!gain) { gain = PULSE[0]; PULSE.slice(1).forEach((g, i) => timers.push(window.setTimeout(() => { gain = g; upload() }, (i + 1) * 70))) }
      upload()
    }, { rootMargin: '0px 0px -25% 0px', threshold: Array.from({ length: 21 }, (_, i) => i / 20) })
    if (!reduce) io.observe(c)
    const ro = new ResizeObserver(() => size() && upload()); ro.observe(c)
    return () => { io.disconnect(); ro.disconnect(); timers.forEach(clearTimeout); sheet.destroy() }
  }, [paper, ink, yellow])
  return <canvas ref={cv} aria-hidden className={className} style={{ display: 'block', width: '100%', aspectRatio: `${A}` }} />
}
