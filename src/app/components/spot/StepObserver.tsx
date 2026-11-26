'use client'
import { useEffect } from 'react'

// Content is visible by default. Only blocks that start below the fold get a stepped entrance (.pre hides them
// until they scroll in); everything on screen at load is left alone.
export default function StepObserver() {
  useEffect(() => {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const els = Array.from(document.querySelectorAll<HTMLElement>('[data-rv],[data-pass],.faq-item')).filter((e) => e.getBoundingClientRect().top > innerHeight)
    els.forEach((e) => e.classList.add('pre'))
    document.documentElement.dataset.rv = '1'
    const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target) } }), { rootMargin: '0px 0px 6% 0px' })
    els.forEach((e) => io.observe(e))
    // the button answers a click with a one-frame second pass: it is about to leave for another tab
    const ack = (e: MouseEvent) => {
      const b = (e.target as Element).closest<HTMLElement>('.btn-primary')
      b?.animate([{ backgroundColor: '#FFD60A', color: '#111114' }, { backgroundColor: '#1F3FCF' }], { duration: 280, easing: 'steps(2)' })
    }
    document.addEventListener('click', ack)
    return () => { io.disconnect(); document.removeEventListener('click', ack); delete document.documentElement.dataset.rv }
  }, [])
  return null
}
