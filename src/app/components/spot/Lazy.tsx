'use client'
// Decorative client code (no text, aria-hidden canvases) loads after hydration so it stays out of the home first-load JS.
import dynamic from 'next/dynamic'
import { useEffect, useRef, useState } from 'react'

export const Crowd = dynamic(() => import('./Crowd'), {
  ssr: false,
  loading: () => <canvas aria-hidden style={{ display: 'block', width: '100%', aspectRatio: '1.25' }} />, // same box, no layout shift
})
const JoinFxLoaded = dynamic(() => import('./JoinFx'), { ssr: false })
// Mounts (and paints its canvases) only once the band is within ~1 screen, so it costs nothing in the load window.
export function JoinFx(p: { pivot?: string }) {
  const ref = useRef<HTMLSpanElement>(null)
  const [on, setOn] = useState(false)
  useEffect(() => {
    const io = new IntersectionObserver(([e]) => e.isIntersecting && setOn(true), { rootMargin: '100% 0px' })
    io.observe(ref.current!)
    return () => io.disconnect()
  }, [])
  return on ? <JoinFxLoaded {...p} /> : <span ref={ref} aria-hidden style={{ position: 'absolute', width: 0, height: 0 }} />
}
export const Impression = dynamic(() => import('./Impression').then((m) => m.Impression), { ssr: false })
