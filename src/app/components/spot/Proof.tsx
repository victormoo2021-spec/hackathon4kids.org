'use client'
import Link from 'next/link'
import { useEffect, useRef, type ReactNode } from 'react'
import { mountSheet } from '../../press/gl/press'
import type { Sheet } from '../../press/types'
import type { Course } from '../../content/courses'
import { fields, pack, rest, slug } from './fields'
import { paintProof, rgb } from './paint2d'

const LOOP = 30 // ticks per loop (2s)
const DEG5 = (5 * Math.PI) / 180
const active = new Set<{ halt(): void }>() // animating proofs, oldest first; never more than 2
type Entry = { el: HTMLElement; vis: boolean; start(ticks: number): void; busy(): boolean }
const reg = new Set<Entry>()
let hovered = 0, checkTimer = 0, cursor = 0

// Press check: on touch and when idle, one visible proof at a time runs for 2.1s.
function ensureCheck() {
  if (checkTimer || typeof window === 'undefined' || matchMedia('(prefers-reduced-motion: reduce)').matches) return
  checkTimer = window.setInterval(() => {
    if (hovered || active.size) return
    const vis = Array.from(reg).filter((e) => e.vis)
    if (vis.length) vis[cursor++ % vis.length].start(30)
  }, 2400)
}

export default function Proof({ name, col = 0, paper = '#111114', ink = '#F2EDE1', ghost = '#1F3FCF', yellow = '#FFD60A', className, children }: {
  name: Course; col?: number; paper?: string; ink?: string; ghost?: string; yellow?: string; className?: string; children?: ReactNode
}) {
  const link = useRef<HTMLAnchorElement>(null)
  const cv = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const el = link.current!, c = cv.current!, f = fields[name], r0 = rest[name]
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches
    const fine = matchMedia('(hover: hover) and (pointer: fine)').matches
    const st = { t: r0, ang: 0, dev: reduce ? 1 : 0 }
    const inks = { paper, ink, ghost, yellow }
    let sheet: Sheet
    const upload = () => {
      const { pa, pb, n } = pack(f(st.t))
      sheet.set({ uPa: pa, uPb: pb, uN: n, uDev: st.dev, uAng: st.ang })
      sheet.dirty()
    }
    const size = () => {
      const dpr = Math.min(devicePixelRatio || 1, 1.5), w = Math.round(c.clientWidth * dpr)
      if (!w || (c.width === w && c.height === w)) return
      c.width = c.height = w
      sheet?.set({ uRes: [w, w], uDpr: dpr, uOff: [1.5 * dpr, 1 * dpr] })
      sheet && upload()
    }
    size()
    const dpr = Math.min(devicePixelRatio || 1, 1.5)
    let k = 0, hold = false, left = 0
    sheet = mountSheet(c, 'prims', {
      dprCap: 1.5,
      fallback: (g, w, h) => paintProof(g, w, h, f(st.t), inks, st.ang, st.dev, dpr),
      frame: () => {
        k++
        st.t = (k % LOOP) / LOOP
        const want = hold || left > 0
        left--
        st.ang = want ? Math.min(st.ang + DEG5, 3 * DEG5) /* +15deg over 3 ticks */ : Math.max(st.ang - DEG5, 0)
        if (!want && st.ang === 0 && k % LOOP === 0) return halt() // finish the loop step, angle back, then rest
        upload()
      },
    })
    sheet.set({ uInk: rgb(ink), uPaperCol: rgb(paper), uGhost: rgb(ghost), uYel: rgb(yellow), uGain: 0.12, uSolid: 0, uRes: [c.width, c.height], uDpr: dpr, uOff: [1.5 * dpr, dpr] })
    upload()
    const me = { halt }
    function halt() {
      active.delete(me); sheet.animate(false)
      k = 0; hold = false; left = 0; st.t = r0; st.ang = 0; upload()
    }
    const start = (ticks: number) => {
      if (reduce) return
      if (ticks >= 1e9) hold = true; else left = Math.max(left, ticks)
      if (active.has(me)) return
      while (active.size >= 2) Array.from(active)[0].halt() // oldest yields
      active.add(me); k = 0; sheet.animate(true)
    }
    const release = () => { hold = false }
    const entry: Entry = { el, vis: false, start, busy: () => active.has(me) }
    reg.add(entry); ensureCheck()
    // develop: four exposures, 70ms apart, columns staggered (cap 5)
    let dev = 0
    const timers: number[] = []
    const develop = () => [0.25, 0.5, 0.75, 1].forEach((g, i) => timers.push(window.setTimeout(() => { st.dev = g; upload() }, Math.min(col, 4) * 70 + i * 70)))
    const io = new IntersectionObserver((es) => es.forEach((e) => {
      entry.vis = e.isIntersecting
      if (e.isIntersecting && !dev && !reduce) { dev = 1; develop() }
    }), { threshold: 0.2 })
    io.observe(el)
    const ro = new ResizeObserver(size); ro.observe(c)
    let enter = 0
    const on = () => { if (!enter++) hovered++; start(1e9) }
    const off = () => { if (enter && !--enter) hovered--; if (!enter) release() }
    const pin = (e: PointerEvent) => e.pointerType === 'mouse' && fine && on()
    const pout = (e: PointerEvent) => e.pointerType === 'mouse' && fine && off()
    el.addEventListener('pointerenter', pin); el.addEventListener('pointerleave', pout)
    el.addEventListener('focus', on); el.addEventListener('blur', off)
    return () => {
      if (enter) hovered--
      reg.delete(entry); active.delete(me); io.disconnect(); ro.disconnect(); timers.forEach(clearTimeout); sheet.destroy()
      if (!reg.size) { clearInterval(checkTimer); checkTimer = 0 }
    }
  }, [name, col, paper, ink, ghost, yellow])
  return (
    <Link ref={link} href={`/programs#${slug(name)}`} className={className ? `proof ${className}` : 'proof'}>
      <canvas ref={cv} aria-hidden style={{ display: 'block', width: '100%', aspectRatio: '1' }} />
      {children}
    </Link>
  )
}
