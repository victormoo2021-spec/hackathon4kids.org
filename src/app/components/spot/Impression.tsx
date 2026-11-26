'use client'
// Press feedback (4.5): mount once. pointerdown on any .btn-primary, same frame: translate into the shadow, a halftone ring prints
// (gain 1.5, 1.2, 1 over 3 ticks), every blue plate flinches 10px. Reduced motion: translate only. Also keeps web slip alive (initSlip).
import { useEffect } from 'react'
import { onTick, reduced } from '../../press/clock'
import { initSlip, jolt } from '../../press/slip'

const GAIN = [1.5, 1.2, 1]
const BLEED = 48
const cell = 8

export function Impression() {
  useEffect(() => {
    const offSlip = initSlip()
    const rm = reduced()
    let cv: HTMLCanvasElement | null = null
    let off: (() => void) | undefined
    let down: HTMLElement | null = null

    const ring = (b: HTMLElement, gain: number) => {
      const r = b.getBoundingClientRect(), dpr = Math.min(devicePixelRatio || 1, 1.5)
      cv ||= Object.assign(document.createElement('canvas'), { ariaHidden: 'true' })
      Object.assign(cv.style, { position: 'fixed', pointerEvents: 'none', zIndex: '40' })
      cv.style.left = `${r.left - BLEED}px`; cv.style.top = `${r.top - BLEED}px`
      const w = r.width + 2 * BLEED, h = r.height + 2 * BLEED
      cv.width = w * dpr; cv.height = h * dpr; cv.style.width = `${w}px`; cv.style.height = `${h}px`
      if (!cv.isConnected) document.body.appendChild(cv)
      const g = cv.getContext('2d')!
      g.setTransform(dpr, 0, 0, dpr, 0, 0)
      // ink: blue, or yellow when the button sits on blue
      let bg = '', e: HTMLElement | null = b.parentElement
      for (; e && !bg; e = e.parentElement) { const c = getComputedStyle(e).backgroundColor; if (c !== 'rgba(0, 0, 0, 0)') bg = c }
      g.fillStyle = bg === 'rgb(31, 63, 207)' ? '#FFD60A' : '#1F3FCF'
      for (let y = 0; y < h; y += cell) for (let x = 0; x < w; x += cell) {
        // distance outside the button box; ring band 4..44px
        const dx = Math.max(BLEED - x, x - (BLEED + r.width), 0), dy = Math.max(BLEED - y, y - (BLEED + r.height), 0)
        const d = Math.hypot(dx, dy)
        if (d < 3 || d > BLEED - 4) continue
        const t = 1 - d / BLEED
        g.beginPath(); g.arc(x + cell / 2, y + cell / 2, Math.min(cell * 0.6, cell * 0.5 * t * gain * 1.4), 0, 7); g.fill()
      }
    }
    const clear = () => { off?.(); off = undefined; cv?.remove() }

    const onDown = (e: PointerEvent) => {
      const b = (e.target as Element).closest<HTMLElement>('.btn-primary')
      if (!b) return
      down = b
      b.style.transform = 'translate(6px, 6px)'
      b.style.boxShadow = 'none'
      if (rm) return
      clear()
      ring(b, GAIN[0]); jolt(10)
      let i = 1
      off = onTick(() => { if (i < GAIN.length) ring(b, GAIN[i++]); else clear() })
    }
    const onUp = () => {
      if (!down) return
      down.style.transform = ''; down.style.boxShadow = ''
      down = null
    }
    addEventListener('pointerdown', onDown, { passive: true })
    addEventListener('pointerup', onUp, true)
    addEventListener('pointercancel', onUp, true)
    return () => {
      removeEventListener('pointerdown', onDown); removeEventListener('pointerup', onUp, true); removeEventListener('pointercancel', onUp, true)
      clear(); offSlip()
    }
  }, [])
  return null
}
