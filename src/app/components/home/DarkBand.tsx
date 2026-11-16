'use client'

import Link from 'next/link'
import { ArrowRightIcon } from '@radix-ui/react-icons'
import { useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useGSAP } from '@gsap/react'

gsap.registerPlugin(ScrollTrigger, useGSAP)

const claims = [
  ['2018', 'Founded by two high-school students.'],
  ['Teens teach', 'High-school students teach younger kids in their community.'],
  ['Free', 'Donations go toward helping underprivileged children.'],
] as const

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
          y: 16,
          duration: 0.7,
          ease: 'expo.out',
          stagger: 0.06,
          scrollTrigger: { trigger: '[data-rise]', start: 'top 90%', once: true },
        })
      })
      return () => mm.revert()
    },
    { scope: ref },
  )

  return (
    <section ref={ref} id="run-by-students" aria-labelledby="students-title" className="relative isolate overflow-hidden border-y border-hairline text-ink">
      <div aria-hidden className="band-glow" />
      <div className="container-x relative py-24 lg:py-36">
        <h2 id="students-title" className="t-display max-w-5xl">
          {lines.map((l) => (
            <span key={l} className="block overflow-hidden pb-[0.08em]">
              <span data-line className="block">{l}</span>
            </span>
          ))}
        </h2>
        <dl className="mt-20 grid gap-12 md:grid-cols-3 md:gap-10">
          {claims.map(([big, cap]) => (
            <div key={big} data-rise>
              <dt className="text-[2.5rem] font-semibold leading-none tracking-tight text-ink">{big}</dt>
              <dd className="mt-4 max-w-[18rem] text-[0.9375rem] leading-relaxed text-ink-soft">{cap}</dd>
            </div>
          ))}
        </dl>
        <p data-rise className="mt-16">
          <Link href="/about#instructors" className="group inline-flex items-center gap-2 font-semibold text-ink underline-offset-4 hover:underline">
            Meet the team <ArrowRightIcon aria-hidden className="transition-transform group-hover:translate-x-1" />
          </Link>
        </p>
      </div>
    </section>
  )
}
