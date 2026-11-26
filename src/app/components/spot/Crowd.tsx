'use client'
import { useEffect, useRef } from 'react'
import { scene } from '../../motion'
import { mountSheet } from '../../press/gl/press'
import { INK } from '../../press/ink'
import { pack, type Prim } from './fields'
import { paintProof, rgb } from './paint2d'

// 20 kids in a 5x4 grid (x 0.14..0.94, y 0.16..0.76, r .07) + 1 instructor. The instructor sits clear of the grid,
// right of and below dot 20: centre distance .23 > .07 + .10 + gap, so the two never touch (the old CSS crowd overlapped them).
const A = 1.25 // sheet aspect w/h; unit = height
const kids: Prim[] = Array.from({ length: 20 }, (_, i) => [1, 0.14 + (i % 5) * 0.2, 0.16 + Math.floor(i / 5) * 0.2, 0, 0, 0.07, 1, 0])
// n kids in reading order, plus the instructor when gain > 0. A flat disc has no dot gain, so the pulse swells its radius (1.5 -> +8%, stays inside the sheet).
const dots = (n: number, gain: number, pop = 1): Prim[] => [
  ...kids.slice(0, Math.floor(n)).map((k) => k.slice() as Prim),
  ...(n % 1 && n < 20 ? [[1, kids[Math.floor(n)][1], kids[Math.floor(n)][2], 0, 0, 0.07 * pop, 1, 0] as Prim] : []), // the next kid pops in
  ...(gain ? [[1, 1.13, 0.89, 0, 0, 0.1 * (1 + (gain - 1) * 0.16), 1, 2] as Prim] : []),
]

// Fills with scroll (direction 7.4): mounts at the finished 20 + instructor (SSR parity); the GSAP scrub scene replays 0 -> 20, reversibly.
export default function Crowd({ paper = INK.bg, ink = INK.text, yellow = INK.accent, className }: { paper?: string; ink?: string; yellow?: string; className?: string }) {
  const cv = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const c = cv.current!
    const out = document.querySelector('#class-size [data-crowd-n]')
    let n = 20, pop = 1, gain = 1
    const dpr = Math.min(devicePixelRatio || 1, 1.5)
    const size = () => { const w = Math.round(c.clientWidth * dpr); if (w && c.width !== w) { c.width = w; c.height = Math.round(w / A); return true } }
    size()
    const sheet = mountSheet(c, 'prims', {
      dprCap: 1.5,
      fallback: (g, w, h) => paintProof(g, w, h, dots(n, gain, pop), { paper, ink, ghost: paper, yellow }, 0, 1, dpr, true),
    })
    const upload = () => {
      const { pa, pb, n: count } = pack(dots(n, gain, pop))
      sheet.set({ uPa: pa, uPb: pb, uN: count, uDev: 1, uAng: 0, uRes: [c.width, c.height], uDpr: dpr, uOff: [1.5 * dpr, dpr] })
      sheet.dirty()
      const txt = String(Math.floor(n))
      if (out && out.textContent !== txt) out.textContent = txt
    }
    sheet.set({ uInk: rgb(ink), uPaperCol: rgb(paper), uGhost: rgb(paper), uYel: rgb(yellow), uGain: 0.06, uSolid: 1 })
    upload()
    const off = scene(c, ({ gsap, takeover }) => {
      const s = { n: 20 }, g = { gain: 1 }, ease = gsap.parseEase('back.out(2)')
      const pulse = gsap.timeline({ paused: true, onUpdate: () => { gain = g.gain; upload() } })
        .set(g, { gain: 1.5 }, 0).set(g, { gain: 1.2 }, 0.07).set(g, { gain: 1 }, 0.14)
      let full = true // SSR state
      const draw = () => {
        const was = n
        n = s.n; pop = ease(n % 1)
        if (n >= 20 && !full) { full = true; pulse.restart(); return }
        if (n < 20) { if (full) { full = false; pulse.pause(0) } g.gain = gain = 0 }
        if (n !== was || !full) upload()
      }
      const tw = gsap.to(s, { n: 20, startAt: { n: 0 }, ease: 'none', snap: { n: 0.1 }, scrollTrigger: { trigger: c, start: 'top 75%', end: 'bottom 75%', scrub: 0.3 }, onUpdate: draw })
      s.n = 20 * (tw.scrollTrigger?.progress ?? 1) // first state is the true position (below the fold: 0, above: 20)
      draw()
      takeover(tw, 1) // in view at arm: ease from the SSR 20 down to the scroll position
      return () => { pulse.kill(); n = 20; pop = 1; gain = 1; upload() }
    })
    const ro = new ResizeObserver(() => size() && upload()); ro.observe(c)
    return () => { off(); ro.disconnect(); sheet.destroy() }
  }, [paper, ink, yellow])
  return <canvas ref={cv} aria-hidden className={className} style={{ display: 'block', width: '100%', aspectRatio: `${A}` }} />
}
