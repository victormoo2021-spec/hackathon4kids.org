'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'

// One shared observer per route. Highlighter strokes (.hl) sweep in once (`js` lets CSS hide them first);
// without scroll-driven animations, [data-reveal] gets .in once on enter.
export default function RevealObserver() {
  const pathname = usePathname()
  useEffect(() => {
    const root = document.documentElement
    const calm = matchMedia('(prefers-reduced-motion: reduce)').matches
    const fallback = !calm && !CSS.supports('animation-timeline: view()')
    root.classList.add('js')
    if (fallback) root.classList.add('rv-js')
    const io = new IntersectionObserver(
      (es) =>
        es.forEach((e) => {
          if (!e.isIntersecting) return
          io.unobserve(e.target)
          const t = e.target as HTMLElement
          if (t.classList.contains('hl')) {
            const sibs = Array.from((t.closest('h1,h2,h3') ?? document).querySelectorAll('.hl'))
            t.style.setProperty('--hl-d', `${sibs.indexOf(t) * 550 + 250}ms`)
            t.classList.add('hl-in')
          } else t.classList.add('in')
        }),
      { rootMargin: '0px 0px -8% 0px' },
    )
    document.querySelectorAll('.hl:not(.hero-h1 .hl)').forEach((el) => io.observe(el))
    if (fallback) document.querySelectorAll('[data-reveal]').forEach((el) => io.observe(el))
    return () => { io.disconnect(); root.classList.remove('rv-js') }
  }, [pathname])
  return null
}
