'use client'

import { useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useGSAP } from '@gsap/react'

gsap.registerPlugin(ScrollTrigger, useGSAP)

type RevealProps = {
  children: React.ReactNode
  className?: string
  as?: 'div' | 'section' | 'ul' | 'ol' | 'article'
  /** stagger between [data-reveal] children, seconds */
  stagger?: number
  id?: string
  'aria-labelledby'?: string
}

/**
 * Fades and rises every [data-reveal] descendant once, as it enters the viewport.
 * Content is fully visible without JS and under reduced motion.
 */
export default function Reveal({ children, className, as: Tag = 'div', stagger = 0.08, ...rest }: RevealProps) {
  const ref = useRef<HTMLElement>(null)

  useGSAP(
    () => {
      const mm = gsap.matchMedia()
      mm.add('(prefers-reduced-motion: no-preference)', () => {
        const items = gsap.utils.toArray<HTMLElement>('[data-reveal]', ref.current)
        if (!items.length) return
        gsap.set(items, { autoAlpha: 0, y: 28 })
        ScrollTrigger.batch(items, {
          start: 'top 88%',
          once: true,
          onEnter: (batch) =>
            gsap.to(batch, { autoAlpha: 1, y: 0, duration: 0.9, ease: 'expo.out', stagger, overwrite: true }),
        })
      })
      return () => mm.revert()
    },
    { scope: ref },
  )

  return (
    <Tag ref={ref as React.Ref<never>} className={className} {...rest}>
      {children}
    </Tag>
  )
}
