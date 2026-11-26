'use client'
// CTA stamp (4.5): the hero pendulum comes to rest hanging from the final band's top edge, then THUNK.
// Place as a direct child of the final band. When the band emits 'rolled', the bob swings in from 0.5rad and settles in 12 ticks
// (A *= .82 per tick). THUNK adds `.stamped` to the band (L4 CSS: .btn-primary shadow 12px -> 6px) and the bob's gain pulses 1.5/1.2/1.
// Hovering a .btn-primary in the band kicks the bob (A += .8). Reduced motion / no tick: static at rest, `.stamped` immediately.
import { useEffect, useRef } from 'react'
import { onTick, reduced } from '../../press/clock'
import { INK } from '../../press/ink'

const PULSE = [1.5, 1.2, 1]

export function Stamp({ pivot = '50%' }: { pivot?: string }) {
  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const cv = ref.current!
    const band = cv.parentElement!
    const g = cv.getContext('2d')!
    const dpr = Math.min(devicePixelRatio || 1, 1.5)
    const R = innerWidth >= 768 ? 180 : 100
    const rod = R * 0.9
    const cell = 10
    let px = 0
    const size = () => {
      const r = band.getBoundingClientRect()
      cv.width = Math.round(r.width * dpr); cv.height = Math.round((rod + 2 * R + 12) * dpr)
      cv.style.height = `${rod + 2 * R + 12}px`
      px = (parseFloat(pivot) / 100) * r.width
    }
    const draw = (th: number, gain: number) => {
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
    size()
    draw(0, 1)
    const stamp = () => band.classList.add('stamped')
    if (reduced()) return stamp()

    let A = 0, n = 0, pulse = -1, off: (() => void) | undefined
    const run = () => {
      off?.()
      off = onTick(() => {
        if (pulse >= 0) {
          draw(0, PULSE[pulse])
          if (++pulse >= PULSE.length) { pulse = -1; off?.(); off = undefined }
          return
        }
        n++; A *= 0.82
        if (A < 0.05) { A = 0; stamp(); pulse = 0; draw(0, PULSE[0]); pulse = 1; return }
        draw(A * Math.cos(n * 1.1), 1)
      })
    }
    const swing = (a: number) => { A = a; n = 0; run() }
    const rolled = () => { band.classList.remove('stamped'); swing(0.5) }
    const kick = (e: Event) => { if ((e.target as Element).closest('.btn-primary') && A === 0 && pulse < 0) { band.classList.remove('stamped'); swing(0.8) } }
    // already rolled (e.g. remount) => static
    if (band.classList.contains('rolled')) stamp()
    band.addEventListener('rolled', rolled)
    band.addEventListener('pointerover', kick)
    const ro = new ResizeObserver(() => { size(); draw(0, 1) })
    ro.observe(band)
    return () => { band.removeEventListener('rolled', rolled); band.removeEventListener('pointerover', kick); ro.disconnect(); off?.() }
  }, [pivot])
  return <canvas ref={ref} aria-hidden style={{ position: 'absolute', top: 0, left: 0, width: '100%', pointerEvents: 'none' }} />
}
