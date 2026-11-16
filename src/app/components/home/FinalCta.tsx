'use client'

import { useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useGSAP } from '@gsap/react'
import Reveal from '../motion/Reveal'
import EmailCta from '../EmailCta'

/** The guide streak curls into the button; it appears as soon as it is on screen. Visible without JS. */
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
        // the main button appears as soon as it is on screen
        ScrollTrigger.create({ trigger: btn, start: 'top 92%', once: true, onEnter: showBtn })
        return () => {
          root.removeEventListener('focusin', onFocus)
          gsap.set(btn, { clearProps: 'all' })
        }
      })
      return () => mm.revert()
    },
    { scope: ref },
  )
  return (
    <div ref={ref} className="md:pb-2">
      <div data-cta-btn data-streak-end>
        <EmailCta size="lg" />
      </div>
    </div>
  )
}

export default function FinalCta() {
  return (
    <Reveal as="section" id="join" aria-labelledby="join-title" className="container-x section-y border-t border-line">
      <div className="grid gap-8 md:grid-cols-[1fr_auto] md:items-end md:gap-12">
        <h2 id="join-title" data-reveal data-spectral className="t-display max-w-3xl">Get the next <span className="hl">class dates</span></h2>
        <CtaButton />
      </div>
    </Reveal>
  )
}
