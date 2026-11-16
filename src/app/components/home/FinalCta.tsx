'use client'

import { useRef } from 'react'
import Reveal from '../motion/Reveal'
import EmailCta from '../EmailCta'

export default function FinalCta() {
  const ref = useRef<HTMLDivElement>(null)
  // Magnetic: button drifts up to 8px toward the cursor; fine pointer + motion only.
  const move = (e: React.PointerEvent) => {
    const a = ref.current?.querySelector<HTMLElement>('a.btn')
    if (!a || e.pointerType !== 'mouse' || !window.matchMedia('(prefers-reduced-motion: no-preference)').matches) return
    const r = a.getBoundingClientRect()
    const dx = e.clientX - (r.left + r.width / 2)
    const dy = e.clientY - (r.top + r.height / 2)
    const d = Math.hypot(dx, dy) || 1
    const k = Math.min(8, d / 20) / d
    a.style.translate = `${dx * k}px ${dy * k}px`
  }
  const leave = () => ref.current?.querySelector<HTMLElement>('a.btn')?.style.removeProperty('translate')
  return (
    <section id="join" aria-labelledby="join-title" className="container-x pb-20 lg:pb-28">
      <Reveal className="final-cta relative isolate overflow-hidden rounded-[2.5rem] px-6 py-24 text-center md:py-32">
        <div aria-hidden className="final-ribbon" />
        <h2 id="join-title" data-reveal className="t-display mx-auto max-w-4xl">Get the next class dates.</h2>
        <div ref={ref} data-reveal onPointerMove={move} onPointerLeave={leave} className="mx-auto mt-12 inline-block p-8">
          <EmailCta size="lg" reassure align="center" />
        </div>
        <p data-reveal className="mt-2 text-ink-soft">For parents and guardians. We never sell or share your email.</p>
      </Reveal>
    </section>
  )
}
