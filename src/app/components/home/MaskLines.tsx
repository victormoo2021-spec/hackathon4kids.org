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
  className?: string
  start?: string
  end?: string
}

/** Display headline whose lines slide up out of a mask, scrubbed to scroll. Static under reduced motion. */
export default function MaskLines({ id, lines, dimFrom = Infinity, className = '', start = 'top 80%', end = 'top 30%' }: Props) {
  const ref = useRef<HTMLHeadingElement>(null)
  useGSAP(
    () => {
      const mm = gsap.matchMedia()
      mm.add('(prefers-reduced-motion: no-preference)', () => {
        gsap.fromTo(
          '[data-line]',
          { yPercent: 110 },
          { yPercent: 0, stagger: 0.3, ease: 'none', scrollTrigger: { trigger: ref.current, start, end, scrub: 0.6 } },
        )
      })
      return () => mm.revert()
    },
    { scope: ref },
  )
  return (
    <h2 ref={ref} id={id} className={`t-display ${className}`}>
      {lines.map((l, i) => (
        <span key={l} className="block overflow-hidden pb-[0.1em]">
          <span data-line className={`block ${i >= dimFrom ? 'text-text-dim' : ''}`}>{l}</span>
        </span>
      ))}
    </h2>
  )
}
