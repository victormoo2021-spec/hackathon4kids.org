'use client'

import { useEffect, useRef, useState } from 'react'
import { fx } from './store'
import { gpuTier } from './gpu'

declare global {
  interface Window {
    __fx?: typeof fx
  }
}

const base = { position: 'fixed', inset: 0, zIndex: -2, pointerEvents: 'none', width: '100%', height: '100%' } as const

/** Fixed background: a glass ring over a warping gradient (WebGL2 on a real GPU), or a CSS gradient. */
export default function Prism() {
  const ref = useRef<HTMLCanvasElement>(null)
  // null until load + idle, so nothing here competes with the hero entrance
  const [mode, setMode] = useState<'gl' | 'css' | null>(null)
  const [on, setOn] = useState(false)

  useEffect(() => {
    window.__fx = fx
    let idle = 0, timer = 0
    const intents = ['scroll', 'touchstart', 'pointerdown', 'keydown']
    // software GL (SwiftShader, llvmpipe) never gets a renderer at all
    const probe = () => {
      intents.forEach((t) => removeEventListener(t, probe))
      clearTimeout(timer)
      setMode(gpuTier() === 'gpu' ? 'gl' : 'css')
    }
    const go = () => {
      idle = (window.requestIdleCallback ?? setTimeout)(() => {
        // phones: three is parsed on a slow core, so it waits for the first touch / scroll, or 4s of calm
        if (matchMedia('(pointer: coarse), (max-width: 899px)').matches) {
          intents.forEach((t) => addEventListener(t, probe, { passive: true, once: true }))
          timer = window.setTimeout(probe, 4000)
        } else probe()
      }, { timeout: 1500 }) as number
    }
    if (document.readyState === 'complete') go()
    else addEventListener('load', go, { once: true })
    return () => {
      removeEventListener('load', go)
      intents.forEach((t) => removeEventListener(t, probe))
      clearTimeout(timer)
      ;(window.cancelIdleCallback ?? clearTimeout)(idle)
    }
  }, [])

  useEffect(() => {
    if (mode !== 'gl' || !ref.current) return
    let stop: (() => void) | undefined, dead = false
    const fail = () => setMode('css')
    import('./prism/scene')
      .then((m) => (dead || !ref.current ? undefined : m.createPrism(ref.current, fail, () => setOn(true))))
      .then((s) => { if (dead) s?.(); else stop = s })
      .catch(fail)
    return () => {
      dead = true
      stop?.()
    }
  }, [mode])

  if (mode === 'gl') return <canvas ref={ref} aria-hidden data-prism="" style={{ ...base, background: '#0a0710', opacity: on ? 1 : 0, transition: 'opacity 900ms cubic-bezier(0.16, 1, 0.3, 1)' }} />
  return (
    <div
      aria-hidden
      data-prism=""
      style={{
        ...base,
        background: mode ? 'radial-gradient(60% 50% at 75% 35%, rgb(99 70 255 / .22), transparent 70%), #0a0710' : '#0a0710',
      }}
    />
  )
}
