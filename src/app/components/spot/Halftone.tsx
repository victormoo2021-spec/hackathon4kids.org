'use client'
import { useEffect, useRef } from 'react'
import { fields, toneAt } from './fields'

// Canvas2D halftone of a course's demo maths. Drawn once (and again if the tile resizes), then static.
export default function Halftone({ name, fg, ghost }: { name: string; fg: string; ghost: string }) {
  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const c = ref.current!, prims = fields[name], tile = c.closest<HTMLElement>('.tile')
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches
    let gain = !reduce && c.getBoundingClientRect().top > innerHeight ? 0 : 1 // below the fold: nothing printed until it scrolls in
    let ang = 0, target = 0
    const w0 = window as any
    const ric: (f: () => void) => number = w0.requestIdleCallback ? (f) => w0.requestIdleCallback(f) : (f) => window.setTimeout(f, 60)
    const cic = (i: number) => (w0.cancelIdleCallback ? w0.cancelIdleCallback(i) : clearTimeout(i))
    const paint = (cv: HTMLCanvasElement, ang: number) => {
      const dpr = Math.min(devicePixelRatio || 1, 2), w = c.clientWidth, h = c.clientHeight
      if (!w) return false
      cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr)
      const g = cv.getContext('2d')!
      g.scale(dpr, dpr); g.fillStyle = fg
      const cell = Math.max(4, w / 40)
      // plate 2: a second ink on another screen angle, a pixel or two out of register
      const plate = (ink: string, ang: number, c: number, k: number, ox: number, oy: number) => {
        g.fillStyle = ink; g.beginPath()
        const co = Math.cos(ang), si = Math.sin(ang), nn = Math.ceil(Math.hypot(w, h) / c / 2) + 1
        for (let i = -nn; i <= nn; i++)
          for (let j = -nn; j <= nn; j++) {
            const x = w / 2 + (i * co - j * si) * c + ox, y = h / 2 + (i * si + j * co) * c + oy
            if (x < -c || y < -c || x > w + c || y > h + c) continue
            const t = toneAt(prims, (x - ox) / w, (y - oy) / h) * k * gain
            if (t < 0.04) continue
            const r = Math.sqrt(t) * c * 0.74
            g.moveTo(x + r, y); g.arc(x, y, r, 0, 6.2832)
          }
        g.fill()
      }
      if (gain > 0) { plate(ghost, 0.26 + ang, cell * 1.15, 0.55, 3, 2); plate(fg, Math.PI / 4 + ang, cell, 1, 0, 0) }
      return true
    }
    // hover frames: the 4 screen angles (0, 5, 10, 15deg) are pre-rendered once the tile is fully developed, then hover only blits
    let frames: HTMLCanvasElement[] = [], idle = 0
    const key = (a: number) => (a >= 0.25 ? 3 : Math.round(a / 0.087))
    const draw = () => {
      const k = key(ang)
      if (gain === 1 && frames[k] && frames[k].width === Math.round(c.clientWidth * Math.min(devicePixelRatio || 1, 2))) {
        if (c.width !== frames[k].width) { c.width = frames[k].width; c.height = frames[k].height }
        const g = c.getContext('2d')!; g.clearRect(0, 0, c.width, c.height); g.drawImage(frames[k], 0, 0); return
      }
      paint(c, ang)
    }
    const warm = () => {
      cic(idle); frames = []
      if (gain !== 1 || reduce) return
      const as = [0, 0.087, 0.174, 0.26]
      const next = (i: number) => { if (i >= 4) return; const f = document.createElement('canvas'); if (paint(f, as[i])) frames[i] = f; idle = ric(() => next(i + 1)) }
      idle = ric(() => next(0))
    }
    draw(); warm()
    const ro = new ResizeObserver(() => { frames = []; draw(); warm() }); ro.observe(c)
    // develop: four exposures, dots swell like a proof coming up
    const timers: number[] = []
    const develop = () => [0.25, 0.5, 0.75, 1].forEach((g, k) => timers.push(window.setTimeout(() => { gain = g; draw(); if (g === 1) warm() }, 120 + k * 70)))
    const mo = new MutationObserver(() => { if (tile?.classList.contains('in') && gain === 0) { mo.disconnect(); develop() } })
    if (gain === 0 && tile) mo.observe(tile, { attributes: true, attributeFilter: ['class'] })
    // hover re-screen: the screen angle steps 5deg per 50ms toward its target; entering or leaving mid-way just retargets
    let iv = 0
    const step = () => { const d = target - ang; if (Math.abs(d) < 0.01) { ang = target; clearInterval(iv); iv = 0 } else ang += Math.sign(d) * 0.087; draw() }
    const go = (t: number) => { target = t; if (!iv) iv = window.setInterval(step, 50) }
    const fine = matchMedia('(hover: hover) and (pointer: fine)').matches && !reduce
    const on = () => go(0.26), off = () => go(0)
    if (fine && tile) { tile.addEventListener('pointerenter', on); tile.addEventListener('pointerleave', off) }
    return () => { cic(idle); ro.disconnect(); mo.disconnect(); timers.forEach(clearTimeout); clearInterval(iv); tile?.removeEventListener('pointerenter', on); tile?.removeEventListener('pointerleave', off) }
  }, [name, fg, ghost])
  return <canvas ref={ref} className="spot-ht" aria-hidden />
}
