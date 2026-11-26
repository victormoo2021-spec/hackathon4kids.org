'use client'
// Decorative client code (no text, aria-hidden canvases) loads after hydration so it stays out of the home first-load JS.
import dynamic from 'next/dynamic'

export const Crowd = dynamic(() => import('./Crowd'), {
  ssr: false,
  loading: () => <canvas aria-hidden style={{ display: 'block', width: '100%', aspectRatio: '1.25' }} />, // same box, no layout shift
})
export const JoinFx = dynamic(() => import('./JoinFx'), { ssr: false })
export const Impression = dynamic(() => import('./Impression').then((m) => m.Impression), { ssr: false })
