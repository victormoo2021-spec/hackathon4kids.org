'use client'

import Link from 'next/link'
import { useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useGSAP } from '@gsap/react'

gsap.registerPlugin(ScrollTrigger, useGSAP)

const lines = ['Run by high-school', 'students since 2018.']

export default function DarkBand() {
  const ref = useRef<HTMLElement>(null)
  useGSAP(
    () => {
      const mm = gsap.matchMedia()
      mm.add('(prefers-reduced-motion: no-preference)', () => {
        gsap.fromTo(
          '[data-line]',
          { yPercent: 110 },
          { yPercent: 0, stagger: 0.25, ease: 'none', scrollTrigger: { trigger: ref.current, start: 'top 70%', end: 'top 20%', scrub: 0.6 } },
        )
        gsap.from('[data-rise]', {
          opacity: 0, // opacity only: keep links focusable
          y: 28,
          duration: 0.9,
          ease: 'expo.out',
          stagger: 0.1,
          scrollTrigger: { trigger: '[data-rise]', start: 'top 90%', once: true },
        })
        gsap.to('[data-glyphs]', {
          yPercent: -30,
          ease: 'none',
          scrollTrigger: { trigger: ref.current, start: 'top bottom', end: 'bottom top', scrub: true },
        })
      })
      return () => mm.revert()
    },
    { scope: ref },
  )

  return (
    <section ref={ref} id="run-by-students" aria-labelledby="students-title" className="relative isolate overflow-hidden bg-night text-white">
      <div aria-hidden data-glyphs className="band-glyphs" />
      <div className="container-x section-y relative">
        <h2 id="students-title" className="t-display max-w-5xl">
          {lines.map((l) => (
            <span key={l} className="block overflow-hidden pb-[0.08em]">
              <span data-line className="block">{l}</span>
            </span>
          ))}
        </h2>
        <div className="mt-14 grid gap-10 text-lg text-ink-dim md:grid-cols-3">
          <p data-rise>Hackathon4Kids was founded by two high-school students.</p>
          <p data-rise>Students teach younger kids in their own community.</p>
          <p data-rise>Donations go toward helping underprivileged children.</p>
        </div>
        <p data-rise className="mt-12">
          <Link href="/about#instructors" className="font-semibold text-accent-dark underline underline-offset-4">
            Meet the team
          </Link>
        </p>
      </div>
    </section>
  )
}
