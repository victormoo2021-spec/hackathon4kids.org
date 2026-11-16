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
    // highlighter strokes sweep in once, in order within their heading; `js` lets CSS hide them first
    document.documentElement.classList.add('js')
    const io = new IntersectionObserver(
      (es) =>
        es.forEach((e) => {
          if (!e.isIntersecting) return
          io.unobserve(e.target)
          const sibs = Array.from((e.target.closest('h1,h2,h3') ?? document).querySelectorAll('.hl'))
          ;(e.target as HTMLElement).style.setProperty('--hl-d', `${sibs.indexOf(e.target) * 550 + 250}ms`)
          e.target.classList.add('hl-in')
        }),
      { rootMargin: '0px 0px -10% 0px' },
    )
    document.querySelectorAll('.hl:not(.hero-h1 .hl)').forEach((el) => io.observe(el))
    window.scrollTo(0, 0)
    document.fonts?.ready.then(() => ScrollTrigger.refresh())
    return () => io.disconnect()
  }, [pathname])

  return <>{children}</>
}
