'use client'

import { useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useGSAP } from '@gsap/react'

gsap.registerPlugin(ScrollTrigger, useGSAP)

const lines = ['One instructor.', 'Up to 20 kids.']

export default function Statement() {
  const ref = useRef<HTMLElement>(null)
  useGSAP(
    () => {
      const mm = gsap.matchMedia()
      mm.add('(prefers-reduced-motion: no-preference)', () => {
        gsap.fromTo(
          '[data-line]',
          { yPercent: 110 },
          { yPercent: 0, stagger: 0.3, ease: 'none', scrollTrigger: { trigger: ref.current, start: 'top 75%', end: 'top 25%', scrub: 0.6 } },
        )
      })
      return () => mm.revert()
    },
    { scope: ref },
  )
  return (
    <section ref={ref} id="class-size" aria-labelledby="class-size-title" className="container-x section-y">
      <h2 id="class-size-title" className="t-display max-w-5xl">
        {lines.map((l, i) => (
          <span key={l} className="block overflow-hidden pb-[0.1em]">
            <span data-line className={`block ${i ? 'text-ink-soft' : ''}`}>{l}</span>
          </span>
        ))}
      </h2>
    </section>
  )
}
