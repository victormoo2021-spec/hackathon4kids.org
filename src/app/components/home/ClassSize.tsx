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
        gsap.fromTo(
          dots,
          { scale: 0.7, backgroundColor: '#d2d2d7' },
          {
            scale: 1,
            backgroundColor: '#1d1d1f',
            duration: 1,
            stagger: 0.12,
            ease: 'sine.inOut',
            scrollTrigger: { trigger: '[data-dots]', start: 'top 85%', end: 'bottom 40%', scrub: 1 },
          },
        )
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
          <div className="grid w-fit grid-cols-5 gap-4 sm:gap-6">
            {Array.from({ length: 20 }, (_, i) => (
              <span key={i} data-dot className="size-9 rounded-full bg-ink sm:size-11" />
            ))}
          </div>
          <div className="flex items-center gap-4">
            <span data-teacher className="size-11 rounded-full bg-accent shadow-[0_0_0_6px_rgb(36_72_245/0.12),0_8px_28px_-6px_rgb(36_72_245/0.6)]" />
            <span className="text-lg font-semibold text-ink">1 instructor</span>
          </div>
        </div>
      </div>
    </section>
  )
}
