'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useGSAP } from '@gsap/react'
import type Lenis from 'lenis'

gsap.registerPlugin(ScrollTrigger, useGSAP)
ScrollTrigger.config({ ignoreMobileResize: true })

/**
 * Motion runtime for the whole site.
 * - Lenis smooth scroll only on fine-pointer devices with motion allowed (never on touch).
 * - Lenis is driven by gsap.ticker so ScrollTrigger stays in sync.
 * - Rebuilt on every route change; ScrollTrigger refreshed after fonts load.
 * - Adds `motion-ok` to <html> when motion is allowed; components key off it.
 */
export default function MotionProviders({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  useEffect(() => {
    const root = document.documentElement
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)')
    const fine = window.matchMedia('(pointer: fine)')
    root.classList.toggle('motion-ok', !reduce.matches)

    let lenis: Lenis | null = null
    let tick: ((time: number) => void) | null = null
    let dead = false

    if (!reduce.matches && fine.matches) {
      // Loaded only here so touch / reduced-motion visitors never download Lenis.
      import('lenis').then(({ default: Lenis }) => {
        if (dead) return
        const l = new Lenis({ duration: 1.1, smoothWheel: true, syncTouch: false, anchors: { offset: -80 } })
        lenis = l
        l.on('scroll', ScrollTrigger.update)
        tick = (time: number) => l.raf(time * 1000)
        gsap.ticker.add(tick)
        gsap.ticker.lagSmoothing(0)
      })
    }

    window.scrollTo(0, 0)
    document.fonts?.ready.then(() => ScrollTrigger.refresh())

    return () => {
      dead = true
      if (tick) gsap.ticker.remove(tick)
      lenis?.destroy()
    }
  }, [pathname])

  return <>{children}</>
}
