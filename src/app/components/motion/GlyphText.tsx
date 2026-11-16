'use client'

import { useEffect, useRef } from 'react'

const GLYPHS = '{}[]();=_<>#+*/'
const DUR = 600

/**
 * Text that "compiles" in once on enter: every character flickers through code glyphs and settles left to
 * right. The real text never moves (zero layout shift): an aria-hidden overlay of absolutely placed chars
 * (glyph held in data-c, drawn by ::after, so it adds no text nodes) covers it until it has settled.
 * Calm tier: 300ms fade. Without JS the text is simply there. Nested elements (.hl) are kept as they are.
 */
export default function GlyphText({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLSpanElement>(null)
  useEffect(() => {
    const host = ref.current!
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches
    host.classList.add('gl-hide')
    let raf = 0
    let overlay: HTMLSpanElement | null = null
    const done = () => {
      overlay?.remove()
      host.classList.remove('gl-hide')
    }
    const run = () => {
      if (reduce) {
        host.classList.remove('gl-hide')
        host.animate({ opacity: [0, 1] }, { duration: 300, easing: 'cubic-bezier(0.16,1,0.3,1)' })
        return
      }
      const h = host.getBoundingClientRect()
      const chars: { el: HTMLSpanElement; ch: string; at: number }[] = []
      overlay = document.createElement('span')
      overlay.setAttribute('aria-hidden', 'true')
      overlay.className = 'gl-overlay'
      const range = document.createRange()
      const walker = document.createTreeWalker(host, NodeFilter.SHOW_TEXT)
      const total = (host.textContent ?? '').replace(/\s/g, '').length || 1
      let k = 0
      for (let n = walker.nextNode() as Text | null; n; n = walker.nextNode() as Text | null) {
        const color = getComputedStyle(n.parentElement!).color
        for (let i = 0; i < n.data.length; i++) {
          if (!n.data[i].trim()) continue
          range.setStart(n, i)
          range.setEnd(n, i + 1)
          const r = range.getBoundingClientRect()
          const el = document.createElement('span')
          el.style.cssText = `left:${r.left - h.left}px;top:${r.top - h.top}px;width:${r.width}px;height:${r.height}px;line-height:${r.height}px;color:${color}`
          overlay.append(el)
          chars.push({ el, ch: n.data[i], at: 120 + (k++ / total) * (DUR - 220) })
        }
      }
      host.append(overlay)
      const t0 = performance.now()
      let last = 0
      const tick = (now: number) => {
        const t = now - t0
        if (t >= DUR) return done()
        if (t - last > 45) {
          last = t
          for (const c of chars) c.el.dataset.c = t >= c.at ? c.ch : GLYPHS[(Math.random() * GLYPHS.length) | 0]
        }
        raf = requestAnimationFrame(tick)
      }
      for (const c of chars) c.el.dataset.c = GLYPHS[(Math.random() * GLYPHS.length) | 0]
      raf = requestAnimationFrame(tick)
    }
    const io = new IntersectionObserver(
      (es) => {
        if (!es.some((e) => e.isIntersecting)) return
        io.disconnect()
        run()
      },
      { rootMargin: '0px 0px -12% 0px' },
    )
    io.observe(host)
    return () => {
      io.disconnect()
      cancelAnimationFrame(raf)
      done()
    }
  }, [])
  return <span ref={ref} className="gl">{children}</span>
}
