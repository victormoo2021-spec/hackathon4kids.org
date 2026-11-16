'use client'

import { useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useGSAP } from '@gsap/react'

gsap.registerPlugin(ScrollTrigger, useGSAP)

type Props = {
  id: string
  lines: readonly string[]
  /** lines from this index on render dim */
  dimFrom?: number
  /** phrase inside the lines to render yellow */
  hl?: string
  className?: string
  start?: string
}

/** Display headline whose lines slide up out of a mask once on enter. Fades under reduced motion. */
export default function MaskLines({ id, lines, dimFrom = Infinity, hl, className = '', start = 'top 85%' }: Props) {
  const ref = useRef<HTMLHeadingElement>(null)
  useGSAP(
    () => {
      const mm = gsap.matchMedia()
      mm.add('(prefers-reduced-motion: no-preference)', () => {
        gsap.fromTo(
          '[data-line]',
          { yPercent: 110 },
          // plays once on enter: a scrubbed mask could be parked half-revealed, which reads as clipped text
          { yPercent: 0, duration: 0.9, stagger: 0.12, ease: 'expo.out', scrollTrigger: { trigger: ref.current, start, once: true } },
        )
      })
      // calm: no movement, lines fade in once
      mm.add('(prefers-reduced-motion: reduce)', () => {
        gsap.fromTo(
          '[data-line]',
          { opacity: 0 },
          { opacity: 1, duration: 0.7, stagger: 0.15, ease: 'power1.out', scrollTrigger: { trigger: ref.current, start: 'top 85%', once: true } },
        )
      })
      return () => mm.revert()
    },
    { scope: ref },
  )
  return (
    <h2 ref={ref} id={id} data-spectral className={`t-display ${className}`}>
      {lines.map((l, i) => (
        <span key={l} className="block overflow-hidden pb-[0.1em]">
          <span data-line className={`block ${i >= dimFrom ? 'text-text-dim' : ''}`}>{hl && l.includes(hl) ? <>{l.split(hl)[0]}<span className="hl">{hl}</span>{l.split(hl)[1]}</> : l}</span>
        </span>
      ))}
    </h2>
  )
}
