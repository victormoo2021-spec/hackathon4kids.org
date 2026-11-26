'use client'
import { useEffect, useRef } from 'react'
import { mountSheet } from '../../press/gl/press'
import { pack, type Prim } from './fields'
import { paintProof, rgb } from './paint2d'

// 20 kids in a 5x4 grid (x 0.14..0.94, y 0.16..0.76, r .07) + 1 instructor. The instructor sits clear of the grid,
// right of and below dot 20: centre distance .23 > .07 + .10 + gap, so the two never touch (the old CSS crowd overlapped them).
const A = 1.25 // sheet aspect w/h; unit = height
const kids: Prim[] = Array.from({ length: 20 }, (_, i) => [1, 0.14 + (i % 5) * 0.2, 0.16 + Math.floor(i / 5) * 0.2, 0, 0, 0.07, 1, 0])
const teacher: Prim = [1, 1.13, 0.89, 0, 0, 0.1, 1, 2]
const rows = (n: number) => [...kids.slice(0, Math.min(n, 4) * 5), ...(n > 4 ? [teacher] : [])] // 5 steps: four rows, then the instructor

export default function Crowd({ paper = '#1F3FCF', ink = '#F2EDE1', yellow = '#FFD60A', className }: { paper?: string; ink?: string; yellow?: string; className?: string }) {
  const cv = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const c = cv.current!, reduce = matchMedia('(prefers-reduced-motion: reduce)').matches
    let step = reduce ? 5 : 0
    const dpr = Math.min(devicePixelRatio || 1, 1.5)
    const size = () => { const w = Math.round(c.clientWidth * dpr); if (w && c.width !== w) { c.width = w; c.height = Math.round(w / A); return true } }
    size()
    const sheet = mountSheet(c, 'prims', {
      dprCap: 1.5,
      fallback: (g, w, h) => paintProof(g, w, h, rows(step), { paper, ink, ghost: paper, yellow }, 0, 1, dpr, true),
    })
    const upload = () => {
      const { pa, pb, n } = pack(rows(step))
      sheet.set({ uPa: pa, uPb: pb, uN: n, uDev: 1, uAng: 0, uRes: [c.width, c.height], uDpr: dpr, uOff: [1.5 * dpr, dpr] })
      sheet.dirty()
    }
    sheet.set({ uInk: rgb(ink), uPaperCol: rgb(paper), uGhost: rgb(paper), uYel: rgb(yellow), uGain: 0.12, uSolid: 1 })
    upload()
    const timers: number[] = []
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return
      io.disconnect()
      for (let i = 1; i <= 5 && !reduce; i++) timers.push(window.setTimeout(() => { step = i; upload() }, i * 70))
    }, { threshold: 0.3 })
    io.observe(c)
    const ro = new ResizeObserver(() => size() && upload()); ro.observe(c)
    return () => { io.disconnect(); ro.disconnect(); timers.forEach(clearTimeout); sheet.destroy() }
  }, [paper, ink, yellow])
  return <canvas ref={cv} aria-hidden className={className} style={{ display: 'block', width: '100%', aspectRatio: `${A}` }} />
}
