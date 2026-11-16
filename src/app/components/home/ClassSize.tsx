'use client'

import { useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useGSAP } from '@gsap/react'

gsap.registerPlugin(ScrollTrigger, useGSAP)

export default function ClassSize() {
  const ref = useRef<HTMLElement>(null)
  useGSAP(
    () => {
      const mm = gsap.matchMedia()
      mm.add('(prefers-reduced-motion: no-preference)', () => {
        const dots = gsap.utils.toArray<HTMLElement>('[data-dot]', ref.current)
        gsap.set(dots, { scale: 0.2, opacity: 0.15 })
        gsap.to(dots, {
          scale: 1,
          opacity: 1,
          stagger: 0.08,
          ease: 'none',
          scrollTrigger: { trigger: '[data-dots]', start: 'top 85%', end: 'bottom 45%', scrub: 0.6 },
        })
        gsap.from('[data-teacher]', {
          scale: 0,
          ease: 'back.out(2)',
          scrollTrigger: { trigger: '[data-dots]', start: 'top 80%', toggleActions: 'play none none none' },
        })
      })
      return () => mm.revert()
    },
    { scope: ref },
  )

  return (
    <section ref={ref} id="class-size" aria-labelledby="size-title" className="bg-mist">
      <div className="container-x section-y grid items-center gap-14 lg:grid-cols-2">
        <div>
          <h2 id="size-title" className="t-headline">Small by design.</h2>
          <p className="t-lede mt-5">One instructor. Up to 20 kids per class.</p>
        </div>
        <div data-dots role="img" aria-label="One instructor and up to 20 kids" className="flex flex-col gap-8">
          <div className="grid grid-cols-5 gap-3 sm:gap-5">
            {Array.from({ length: 20 }, (_, i) => (
              <span key={i} data-dot className="aspect-square rounded-full bg-ink" />
            ))}
          </div>
          <div className="flex items-center gap-4">
            <span data-teacher className="size-16 rounded-full bg-accent shadow-[0_8px_28px_-6px_rgb(36_72_245/0.6)] sm:size-20" />
            <span className="text-lg font-semibold text-ink">1 instructor</span>
          </div>
        </div>
      </div>
    </section>
  )
}
