// Canvas2D fallback for the proofs: frame 0 from the same prims, cell and angles as prims.frag (port of the old Halftone.paint).
import type { Prim } from './fields'

const AA = 0.008
const cov = (d: number, r: number) => Math.max(0, Math.min(1, (r - d) / AA + 0.5))

/** returns [ink tone, flat-yellow coverage] at u (unit = tile height) */
export function toneAt(prims: Prim[], x: number, y: number): [number, number] {
  let t = 0, yv = 0
  for (const [k, a, b, c, d, w, tone, sh] of prims) {
    let v: number
    if (k === 0) {
      const vx = c - a, vy = d - b, h = Math.max(0, Math.min(1, ((x - a) * vx + (y - b) * vy) / (vx * vx + vy * vy || 1)))
      v = cov(Math.hypot(x - a - vx * h, y - b - vy * h), w / 2)
    } else if (k === 1) {
      const s = Math.min(sh, 1) ? 0.2 + 0.8 * Math.max(0, Math.min(1, 0.5 - 0.5 * (((x - a) * -0.58 + (y - b) * -0.81) / w))) : 1
      v = cov(Math.hypot(x - a, y - b), w) * (1 - Math.min(sh, 1) + Math.min(sh, 1) * s)
    } else v = cov(Math.abs(Math.hypot(x - a, y - b) - c), w / 2)
    if (sh > 1.5) yv = Math.max(yv, v)
    else t = Math.max(t, v * tone)
  }
  return [t, yv]
}

export const rgb = (hex: string): [number, number, number] => {
  const n = parseInt(hex.replace('#', ''), 16)
  return [(n >> 16) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255]
}

export interface Inks { paper: string; ink: string; ghost: string; yellow: string }

export function paintProof(g: CanvasRenderingContext2D, w: number, h: number, prims: Prim[], c: Inks, ang = 0, dev = 1, dpr = 1, solid = false) {
  g.fillStyle = c.paper
  g.fillRect(0, 0, w, h)
  const cell = w / 34
  const plate = (ink: string, a: number, cs: number, k: number, ox: number, oy: number) => {
    g.fillStyle = ink
    g.beginPath()
    const co = Math.cos(a), si = Math.sin(a), nn = Math.ceil(Math.hypot(w, h) / cs / 2) + 1
    for (let i = -nn; i <= nn; i++)
      for (let j = -nn; j <= nn; j++) {
        const x = w / 2 + (i * co - j * si) * cs, y = h / 2 + (i * si + j * co) * cs
        if (x < -cs || y < -cs || x > w + cs || y > h + cs) continue
        const t = toneAt(prims, (x - ox) / h, (y - oy) / h)[0] * k * dev
        if (t < 0.04) continue
        const r = Math.sqrt(Math.min(1, t)) * cs * 0.72
        g.moveTo(x + ox + r, y + oy)
        g.arc(x + ox, y + oy, r, 0, 6.2832)
      }
    g.fill()
  }
  if (solid) {
    g.fillStyle = c.ink
    for (const [k, a, b, , , r, , sh] of prims) if (k === 1 && sh < 1.5) { g.beginPath(); g.arc(a * h, b * h, r * h, 0, 6.2832); g.fill() }
  } else if (dev > 0) {
    plate(c.ghost, Math.PI / 12 + ang, cell * 1.15, 0.55, 1.5 * dpr, 1 * dpr)
    plate(c.ink, Math.PI / 4 + ang, cell, 1, 0, 0)
  }
  // flat yellow flood prims (the instructor dot)
  g.fillStyle = c.yellow
  for (const [k, a, b, , , r, , sh] of prims) if (sh > 1.5 && k === 1) { g.beginPath(); g.arc(a * h, b * h, r * h, 0, 6.2832); g.fill() }
}
