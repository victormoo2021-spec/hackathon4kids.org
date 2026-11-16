'use client'

import { useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useGSAP } from '@gsap/react'
import Reveal from '../motion/Reveal'
import EmailCta from '../EmailCta'

gsap.registerPlugin(ScrollTrigger, useGSAP)

export default function FinalCta() {
  const ref = useRef<HTMLElement>(null)
  // The yellow eye path ends here: the trail draws down into the button as you scroll.
  useGSAP(
    () => {
      const mm = gsap.matchMedia()
      mm.add('(prefers-reduced-motion: no-preference)', () => {
        gsap.fromTo(
          '[data-trail]',
          { strokeDashoffset: 1 },
          { strokeDashoffset: 0, ease: 'none', scrollTrigger: { trigger: '[data-trail]', start: 'top 85%', end: 'top 45%', scrub: 0.6 } },
        )
      })
      return () => mm.revert()
    },
    { scope: ref },
  )
  return (
    <section ref={ref} id="join" aria-labelledby="join-title" className="final-cta container-x section-y relative isolate text-center">
      <Reveal>
        <h2 id="join-title" data-reveal className="t-display mx-auto max-w-4xl">Get the next class dates.</h2>
      </Reveal>
      <svg aria-hidden viewBox="0 0 2 100" className="trail mx-auto mt-10 h-24 w-1">
        <path data-trail d="M1 0V100" pathLength={1} strokeDasharray={1} strokeDashoffset={0} stroke="#ffd60a" strokeWidth="2" strokeLinecap="round" fill="none" />
      </svg>
      <Reveal>
        <div data-reveal className="mt-2">
          <EmailCta size="lg" reassure align="center" />
        </div>
        <p data-reveal className="mt-6 text-ink-soft">For parents and guardians. We never sell or share your email.</p>
      </Reveal>
    </section>
  )
}
