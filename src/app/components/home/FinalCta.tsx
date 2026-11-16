'use client'

import { useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useGSAP } from '@gsap/react'
import Reveal from '../motion/Reveal'
import EmailCta from '../EmailCta'

/** The trail draws with scroll (full) or on enter (calm); the button appears once it is done. Visible without JS. */
function CtaTrail() {
  const ref = useRef<HTMLDivElement>(null)
  useGSAP(
    () => {
      const mm = gsap.matchMedia()
      mm.add({ full: '(prefers-reduced-motion: no-preference)', calm: '(prefers-reduced-motion: reduce)' }, (ctx) => {
        const calm = !!ctx.conditions?.calm
        const root = ref.current!
        const path = root.querySelector('path')!
        const btn = root.querySelector('[data-cta-btn]') as HTMLElement
        const trigger = root.querySelector('svg')!
        let shown = false
        const showBtn = () => {
          if (shown) return
          shown = true
          gsap.to(btn, calm ? { opacity: 1, duration: 0.4, ease: 'power1.out' } : { opacity: 1, scale: 1, duration: 0.5, ease: 'back.out(1.4)' })
        }
        const onFocus = () => {
          shown = true
          gsap.set(btn, { opacity: 1, scale: 1, overwrite: true })
        }
        gsap.set(btn, { opacity: 0, scale: calm ? 1 : 0.94 })
        gsap.set(path, { strokeDashoffset: 1 })
        root.addEventListener('focusin', onFocus)
        // safety: the main button must appear as soon as it is on screen, even if the page
        // can't scroll far enough for the trail to finish (tall viewports, short pages)
        ScrollTrigger.create({ trigger: btn, start: 'top 92%', once: true, onEnter: showBtn })
        if (calm) {
          ScrollTrigger.create({
            trigger,
            start: 'top 85%',
            once: true,
            onEnter: () => gsap.to(path, { strokeDashoffset: 0, duration: 0.8, ease: 'power1.inOut', onComplete: showBtn }),
          })
        } else {
          gsap.to(path, {
            strokeDashoffset: 0,
            ease: 'none',
            scrollTrigger: {
              trigger,
              start: 'top 85%',
              end: 'top 50%',
              scrub: 0.6,
              onUpdate: (s) => s.progress === 1 && showBtn(),
              onLeave: showBtn,
            },
          })
        }
        return () => {
          root.removeEventListener('focusin', onFocus)
          gsap.set([btn, path], { clearProps: 'all' })
        }
      })
      return () => mm.revert()
    },
    { scope: ref },
  )
  return (
    <div ref={ref}>
      <svg aria-hidden viewBox="0 0 2 96" className="cta-trail mt-12">
        <path d="M1 0V96" pathLength={1} />
      </svg>
      <div data-cta-btn className="mt-2">
        <EmailCta size="lg" align="center" />
      </div>
    </div>
  )
}

export default function FinalCta() {
  return (
    <Reveal as="section" id="join" aria-labelledby="join-title" className="container-x section-y text-center">
      <h2 id="join-title" data-reveal className="t-display mx-auto max-w-4xl">Get the next class dates.</h2>
      <CtaTrail />
      <p data-reveal className="mt-6 text-text-dim">For parents and guardians.</p>
    </Reveal>
  )
}
