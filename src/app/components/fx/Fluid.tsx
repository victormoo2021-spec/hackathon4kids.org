'use client'

import { useEffect, useRef } from 'react'
import { fx } from './store'

declare global {
  interface Window {
    __fx?: typeof fx
  }
}

// Ink-of-light layer behind the page content (above the background canvas); it also draws stirred headings. The sim itself is a separate
// chunk fetched on the first pointer/scroll interaction, so page load never pays for it.
const INTENTS = ['pointermove', 'pointerdown', 'touchstart', 'scroll', 'wheel'] as const
const style = { position: 'fixed', inset: 0, width: '100%', height: '100%', zIndex: -1, pointerEvents: 'none', visibility: 'hidden' } as const

export default function Fluid() {
  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    window.__fx = fx // read by the e2e tests
    let stop: (() => void) | null = null
    let dead = false
    const off = () => INTENTS.forEach((t) => removeEventListener(t, go))
    const go = () => {
      off()
      import('./fluidSim').then((m) => { if (!dead && ref.current) stop = m.createFluid(ref.current) }).catch(() => {})
    }
    INTENTS.forEach((t) => addEventListener(t, go, { passive: true }))
    return () => { dead = true; off(); stop?.() }
  }, [])
  return <canvas ref={ref} aria-hidden style={style} />
}
