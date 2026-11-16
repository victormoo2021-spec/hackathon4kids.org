'use client'

import dynamic from 'next/dynamic'
import { useCallback, useEffect, useRef, useState } from 'react'
import { gpuTier } from '../fx/gpu'
import './laptop.css'

const Laptop3D = dynamic(() => import('./Laptop3D'), { ssr: false })

function canUse3D() {
  if (!window.matchMedia('(min-width: 900px)').matches) return false
  const conn = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection
  if (conn?.saveData) return false
  // no GPU (software GL or none): keep the CSS laptop. Shared, memoised probe (one context for the whole page)
  return gpuTier() === 'gpu'
}

// Space-black laptop. CSS hardware renders first (no CLS, works without WebGL); on wide screens a lazy
// R3F laptop is laid over it and the CSS hardware fades out once the first 3D frame is drawn.
// `children` render once, inside `.lap-host`, which is moved (not re-mounted) between the CSS and 3D screens.
export default function Laptop({ children, progress }: { children: React.ReactNode; progress: number }) {
  const screenRef = useRef<HTMLDivElement>(null)
  const hostRef = useRef<HTMLDivElement>(null)
  const [enabled, setEnabled] = useState(false)
  const [ready, setReady] = useState(false)
  const [host, setHost] = useState<HTMLDivElement | null>(null)

  useEffect(() => {
    setHost(hostRef.current)
    let cancelled = false
    let idle = 0
    const start = () => {
      const go = () => !cancelled && canUse3D() && setEnabled(true)
      idle = window.requestIdleCallback ? window.requestIdleCallback(go, { timeout: 3000 }) : window.setTimeout(go, 200)
    }
    if (document.readyState === 'complete') start()
    else window.addEventListener('load', start, { once: true })
    const mq = window.matchMedia('(min-width: 900px)')
    const onMq = () => {
      if (!mq.matches) {
        setEnabled(false)
        setReady(false)
      }
    }
    mq.addEventListener('change', onMq)
    return () => {
      cancelled = true
      window.removeEventListener('load', start)
      mq.removeEventListener('change', onMq)
      if (window.cancelIdleCallback) window.cancelIdleCallback(idle)
    }
  }, [])

  // exactly one element carries data-fx-origin; Laptop3D moves the host into the 3D screen before onReady
  useEffect(() => {
    const s = screenRef.current
    const h = hostRef.current
    if (!s || !h) return
    if (ready) {
      s.removeAttribute('data-fx-origin')
      h.setAttribute('data-fx-origin', '')
    } else {
      h.removeAttribute('data-fx-origin')
      s.setAttribute('data-fx-origin', '')
      if (h.parentElement !== s) s.prepend(h)
    }
  }, [ready])

  const onReady = useCallback(() => setReady(true), [])
  const onFail = useCallback(() => {
    setReady(false)
    setEnabled(false)
  }, [])

  return (
    <div className="laptop" data-3d={ready ? '' : undefined}>
      <div className="lap-hw" aria-hidden>
        <div className="lap-lid">
          <div className="lap-bezel">
            <div className="screen" ref={screenRef} data-fx-origin="">
              <div className="lap-host" ref={hostRef}>{children}</div>
              <div className="lap-notch"><i /></div>
            </div>
          </div>
        </div>
        <div className="lap-base"><span /></div>
      </div>
      {enabled && host && (
        <div className="lap-3d" aria-hidden>
          <Laptop3D progress={progress} host={host} onReady={onReady} onFail={onFail} />
        </div>
      )}
    </div>
  )
}
