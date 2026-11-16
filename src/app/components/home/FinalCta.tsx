'use client'

import { useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useGSAP } from '@gsap/react'
import Reveal from '../motion/Reveal'
import EmailCta from '../EmailCta'

/** The guide streak curls into the button; it appears on `fx:arrive` or as soon as it is on screen. Visible without JS. */
function CtaButton() {
  const ref = useRef<HTMLDivElement>(null)
  useGSAP(
    () => {
      const mm = gsap.matchMedia()
      mm.add({ full: '(prefers-reduced-motion: no-preference)', calm: '(prefers-reduced-motion: reduce)' }, (ctx) => {
        const calm = !!ctx.conditions?.calm
        const root = ref.current!
        const btn = root.querySelector('[data-cta-btn]') as HTMLElement
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
        root.addEventListener('focusin', onFocus)
        window.addEventListener('fx:arrive', showBtn)
        // safety: the main button must appear as soon as it is on screen, even if the streak
        // can't arrive (tall viewports, short pages, no WebGL)
        ScrollTrigger.create({ trigger: btn, start: 'top 92%', once: true, onEnter: showBtn })
        return () => {
          root.removeEventListener('focusin', onFocus)
          window.removeEventListener('fx:arrive', showBtn)
          gsap.set(btn, { clearProps: 'all' })
        }
      })
      return () => mm.revert()
    },
    { scope: ref },
  )
  return (
    <div ref={ref} className="mt-10">
      <div data-cta-btn data-streak-end>
        <EmailCta size="lg" align="center" />
      </div>
    </div>
  )
}

export default function FinalCta() {
  return (
    <Reveal as="section" id="join" aria-labelledby="join-title" className="container-x section-y text-center">
      <h2 id="join-title" data-reveal data-spectral className="t-display mx-auto max-w-4xl">Get the next <span className="hl">class dates</span>.</h2>
      <CtaButton />
    </Reveal>
  )
}
