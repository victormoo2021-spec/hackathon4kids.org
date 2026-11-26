// CTA stamp draw factory (lazy, owned by JoinFx): the pendulum bob hangs from the band's top edge.
// mountStamp(cv, band, pivot) -> { draw(theta, gain), destroy }. Drawn at rest immediately; the join timeline drives it.
import { INK } from '../../press/ink'

export function mountStamp(cv: HTMLCanvasElement, band: HTMLElement, pivot = '50%') {
  const g = cv.getContext('2d')!
  const dpr = Math.min(devicePixelRatio || 1, 1.5)
  const R = innerWidth >= 768 ? 180 : 100
  const rod = R * 0.9
  const cell = 10
  let px = 0
  let last: [number, number] = [0, 1]
  const size = () => {
    const r = band.getBoundingClientRect()
    cv.width = Math.round(r.width * dpr); cv.height = Math.round((rod + 2 * R + 12) * dpr)
    cv.style.height = `${rod + 2 * R + 12}px`
    px = (parseFloat(pivot) / 100) * r.width
  }
  const draw = (th: number, gain: number) => {
    last = [th, gain]
    g.setTransform(dpr, 0, 0, dpr, 0, 0)
    g.clearRect(0, 0, cv.width, cv.height)
    const bx = px + Math.sin(th) * (rod + R), by = Math.cos(th) * (rod + R)
    g.strokeStyle = INK.bg; g.fillStyle = INK.bg; g.lineWidth = R * 0.045; g.lineCap = 'square' // on the accent band the stamp stays subtractive
    g.beginPath(); g.moveTo(px, 0); g.lineTo(px + Math.sin(th) * rod, Math.cos(th) * rod); g.stroke()
    // halftone disc: lattice cell 10 rotated 15deg, dot size follows a lit-from-upper-left tone ramp (gain swells the dots)
    const c15 = Math.cos(0.2618), s15 = Math.sin(0.2618), N = Math.ceil((R * 1.5) / cell)
    for (let j = -N; j <= N; j++) for (let i = -N; i <= N; i++) {
      const x = (i * c15 - j * s15) * cell, y = (i * s15 + j * c15) * cell
      if (Math.hypot(x, y) > R) continue
      const tone = 0.2 + 0.8 * Math.min(Math.max(0.5 - 0.5 * ((x / R) * -0.58 + (y / R) * -0.81), 0), 1)
      g.beginPath(); g.arc(bx + x, by + y, Math.sqrt(tone) * cell * 0.72 * Math.min(gain, 1.2), 0, 7); g.fill()
    }
    g.beginPath(); g.arc(px + Math.sin(th) * rod, Math.cos(th) * rod, 4, 0, 7); g.fill()
  }
  size(); draw(0, 1)
  const ro = new ResizeObserver(() => { size(); draw(...last) })
  ro.observe(band)
  return { draw, destroy: () => ro.disconnect() }
}
