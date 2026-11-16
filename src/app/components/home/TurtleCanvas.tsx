'use client'

import { useEffect, useRef } from 'react'
import { RUN } from './program'

// Uniform scale + offset that centers the drawing (origin included) in a w x h box.
export function fit(w: number, h: number, pad = 0.1) {
  let x0 = 0, x1 = 0, y0 = 0, y1 = 0
  for (const g of RUN.segments) {
    x0 = Math.min(x0, g.x1, g.x2); x1 = Math.max(x1, g.x1, g.x2)
    y0 = Math.min(y0, g.y1, g.y2); y1 = Math.max(y1, g.y1, g.y2)
  }
  const s = Math.min((w * (1 - 2 * pad)) / (x1 - x0 || 1), (h * (1 - 2 * pad)) / (y1 - y0 || 1))
  return { s, ox: w / 2 - ((x0 + x1) / 2) * s, oy: h / 2 + ((y0 + y1) / 2) * s }
}

function draw(c: HTMLCanvasElement, p: number) {
  const w = c.clientWidth, h = c.clientHeight, ctx = c.getContext('2d')
  if (!w || !h || !ctx) return
  const dpr = window.devicePixelRatio || 1
  if (c.width !== Math.round(w * dpr) || c.height !== Math.round(h * dpr)) {
    c.width = Math.round(w * dpr); c.height = Math.round(h * dpr)
  }
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  ctx.clearRect(0, 0, w, h)
  const { s, ox, oy } = fit(w, h)
  const segs = RUN.segments
  const f = Math.min(Math.max(p, 0), 1) * segs.length
  const whole = Math.floor(f)
  ctx.lineCap = 'round'
  let hx = ox, hy = oy
  for (let i = 0; i < Math.min(segs.length, whole + 1); i++) {
    const g = segs[i], t = i < whole ? 1 : f - whole
    if (t <= 0) break
    hx = ox + (g.x1 + (g.x2 - g.x1) * t) * s; hy = oy - (g.y1 + (g.y2 - g.y1) * t) * s
    ctx.strokeStyle = g.color
    ctx.lineWidth = g.width * 1.25
    ctx.beginPath(); ctx.moveTo(ox + g.x1 * s, oy - g.y1 * s); ctx.lineTo(hx, hy); ctx.stroke()
  }
  if (f > 0) {
    ctx.fillStyle = '#fff'
    ctx.beginPath(); ctx.arc(hx, hy, 3, 0, Math.PI * 2); ctx.fill()
  }
}

export default function TurtleCanvas({ progress = 1 }: { progress?: number }) {
  const ref = useRef<HTMLCanvasElement>(null)
  const p = useRef(progress)
  p.current = progress

  useEffect(() => {
    const c = ref.current!
    const ro = new ResizeObserver(() => draw(c, p.current))
    ro.observe(c)
    return () => ro.disconnect()
  }, [])
  useEffect(() => { draw(ref.current!, progress) }, [progress])

  return <canvas ref={ref} className="turtle-canvas" aria-hidden />
}
