'use client'
// Roller pass (4.3): put <Roller ink="blue"/> as a direct child of a band ([data-ink="roll"], position:relative, CSS bg stock).
// At 20% visible: 6 ticks, roller line advances H/6, then the band bg becomes the ink, the canvas is removed and 'rolled' bubbles.
import { useEffect, useRef, useState } from 'react'
import { onTick, reduced } from './clock'
import type { mountSheet as MountSheet } from './gl/press'
import { initSlip } from './slip'

const INK = { blue: { css: 'var(--blue)', rgb: [0x1f / 255, 0x3f / 255, 0xcf / 255] }, yellow: { css: 'var(--y)', rgb: [1, 0xd6 / 255, 0x0a / 255] } }
const TICKS = 6

export function Roller({ ink }: { ink: 'blue' | 'yellow' }) {
  const ref = useRef<HTMLCanvasElement>(null)
  const [done, setDone] = useState(false)

  useEffect(() => {
    const cv = ref.current!
    const band = cv.parentElement!
    const { css, rgb } = INK[ink]
    const finish = () => {
      band.style.background = css
      band.classList.add('rolled')
      band.dispatchEvent(new CustomEvent('rolled', { bubbles: false }))
      setDone(true)
    }
    if (reduced() || done) return finish()
    const offSlip = initSlip()
    const dpr = Math.min(devicePixelRatio || 1, 1.5)
    let w = 0, h = 0, line = 0, offY = 10, sheet: ReturnType<typeof MountSheet> | null = null
    const draw = () => {
      sheet?.set({ uRes: [w, h], uLine: line, uInk: rgb, uOff: [1.5 * dpr, (1 + offY) * dpr], uDpr: dpr })
      sheet?.dirty()
    }
    let offTick: (() => void) | undefined, dead = false
    const run = async () => {
      const { mountSheet, press } = await import('./gl/press')
      if (dead) return
      const r = band.getBoundingClientRect()
      w = Math.round(r.width * dpr); h = Math.round(r.height * dpr)
      cv.width = w; cv.height = h
      sheet = mountSheet(cv, 'roller', { dprCap: 1.5, fallback: () => {} })
      if (!press.ok) return finish() // no GL: ink from the start
      let n = 0
      sheet.animate(true)
      offTick = onTick(() => {
        n++
        if (n >= TICKS) { offTick?.(); offTick = undefined; sheet?.animate(false); return finish() }
        line = (h * n) / TICKS
        offY *= 0.55
        draw()
      })
    }
    const io = new IntersectionObserver((es) => es[0].isIntersecting && (io.disconnect(), run()), { threshold: 0.2 })
    io.observe(band)
    return () => {
      dead = true; io.disconnect(); offTick?.(); sheet?.destroy(); offSlip()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ink])

  return done ? null : <canvas ref={ref} aria-hidden style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }} />
}
