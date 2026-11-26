// Real pendulum: theta'' = -k sin(theta). Semi-implicit Euler, small substeps. Period ~3.6s.
// Idle: kept inside an energy band so it never dies. Grabbed: theta is set by the hand; release hands over velocity.
const K = (2 * Math.PI / 3.6) ** 2
export const REST = { x: 1.5, y: 1.0 } // trail plate rest offset, css px (never zero)
export const LOAD_MS = { y: [0, 560, 8], b: [140, 700, 8], k: [420, 840, 6], swing: 980 } as const

export class Pendulum {
  th: number
  w = 0
  constructor(public amp = 1) { this.th = frame0(amp).th0 }
  step(dt: number) {
    const n = Math.ceil(dt / 0.004)
    const h = dt / n
    for (let i = 0; i < n; i++) {
      this.w += -K * Math.sin(this.th) * h
      this.th += this.w * h
    }
    const e = 0.5 * this.w * this.w + K * (1 - Math.cos(this.th))
    const lo = K * (1 - Math.cos(0.45 * this.amp)), hi = K * (1 - Math.cos(0.85 * this.amp))
    if (e < lo) this.w *= 1 + 0.27 * dt // was x1.004 per 4ms substep
    // tuned: was w *= .985 per 4ms substep (killed a throw in ~0.3s); now exponential 1.1/s so a thrown bob visibly carries, then eases to the idle band
    else if (e > hi) this.w *= Math.max(0, 1 - 1.1 * dt)
  }
  kick(v: number) { this.w = Math.max(-5, Math.min(5, this.w + v)) }
}

/** Frame 0, defined once: six seeded exposures at theta0 - i*0.07, weights .88^(4i). GL seeds its accumulator with these; Poster draws them. */
export function frame0(amp: number) {
  const th0 = 0.55 * amp
  return { th0, th: th0, exposures: Array.from({ length: 6 }, (_, i) => ({ th: th0 - i * 0.07, w: 0.88 ** (4 * i) })) }
}

/** Hero geometry in CSS px. Desktop: pivot x 72%, y -2%. Phone: pivot at `slabBottom` + 24 (below the "Grades" slab), x 50%. */
export function geo(W: number, H: number, slabBottom = H * 0.36) {
  const wide = W >= 768
  const px = wide ? W * 0.72 : W * 0.5
  const py = wide ? -H * 0.02 : slabBottom + 24
  const len = wide ? Math.min(H * 0.82, W * 1.15) : Math.max(200, Math.min(H - py - 190, W * 1.1))
  const half = wide ? W * 0.19 : W * 0.46
  const amp = Math.max(0.3, Math.min(1, Math.asin(Math.min(0.97, half / len)) / 0.85))
  return { px, py, len, amp }
}

/** Step-quantised plate progress for the load sequence (CSS steps(n, jump-end) shape) at t ms: [start, end, n]. */
export const plate = (t: number, [a, b, n]: readonly [number, number, number]) => Math.max(0, Math.min(1, Math.floor(((t - a) / (b - a)) * n) / n))
