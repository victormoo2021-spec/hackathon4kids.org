'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useGSAP } from '@gsap/react'

gsap.registerPlugin(ScrollTrigger, useGSAP)
ScrollTrigger.config({ ignoreMobileResize: true })

/**
 * Motion runtime for the whole site. Native scrolling (no smooth-scroll library: owner wants it snappy).
 * - Resets scroll on route change; refreshes ScrollTrigger after fonts load.
 * - Adds `motion-ok` to <html> when motion is allowed; components key off it.
 */
export default function MotionProviders({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)')
    document.documentElement.classList.toggle('motion-ok', !reduce.matches)
    window.scrollTo(0, 0)
    document.fonts?.ready.then(() => ScrollTrigger.refresh())
  }, [pathname])

  return <>{children}</>
}
