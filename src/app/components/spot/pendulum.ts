// Real pendulum: theta'' = -k sin(theta). Semi-implicit Euler, small substeps.
// Period ~3.6s. Undamped (it is a poster, it keeps swinging); pointer kicks are clamped.
const K = (2 * Math.PI / 3.6) ** 2

export class Pendulum {
  th: number
  w = 0
  constructor(public amp = 1) { this.th = 0.55 * amp }
  step(dt: number) {
    const n = Math.ceil(dt / 0.004)
    const h = dt / n
    for (let i = 0; i < n; i++) {
      this.w += -K * Math.sin(this.th) * h
      this.th += this.w * h
    }
    // keep the swing alive and bounded
    const e = 0.5 * this.w * this.w + K * (1 - Math.cos(this.th))
    const lo = K * (1 - Math.cos(0.45 * this.amp)), hi = K * (1 - Math.cos(0.85 * this.amp))
    if (e < lo) this.w *= 1.004
    else if (e > hi) this.w *= 0.985
  }
  kick(v: number) { this.w = Math.max(-3.2, Math.min(3.2, this.w + v)) }
}

/** Hero geometry in CSS px. Desktop: pivot at 72% so the whole swing stays in the right ~40%.
 *  Phone: pivot just under the "Grades" tag (slabY), rod fills the space down to the CTA, swing spans the width.
 *  amp scales the swing so the bob never leaves its zone. Keep the poster's CSS in spot.css in step with this. */
export function geo(W: number, H: number, slabY = H * 0.36) {
  const wide = W >= 768
  const px = wide ? W * 0.72 : W * 0.5
  const py = wide ? -H * 0.02 : slabY
  const len = wide ? Math.min(H * 0.82, W * 1.15) : Math.max(200, Math.min(H - py - 190, W * 1.1))
  const half = wide ? W * 0.19 : W * 0.46
  const amp = Math.max(0.3, Math.min(1, Math.asin(Math.min(0.97, half / len)) / 0.85))
  return { px, py, len, amp }
}
