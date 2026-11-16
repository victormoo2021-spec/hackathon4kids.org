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
        // opacity only (never visibility) so unrevealed content stays focusable for keyboard users
        gsap.set(items, { opacity: 0, y: 28 })
        const show = (els: Element[]) =>
          gsap.to(els, { opacity: 1, y: 0, duration: 0.9, ease: 'expo.out', stagger, overwrite: true })
        const onFocus = (e: FocusEvent) => {
          const hit = items.filter((el) => el.contains(e.target as Node))
          if (hit.length) gsap.set(hit, { opacity: 1, y: 0, overwrite: true })
        }
        ref.current?.addEventListener('focusin', onFocus)
        ScrollTrigger.batch(items, {
          start: 'top 88%',
          once: true,
          onEnter: (batch) => show(batch),
        })
        return () => ref.current?.removeEventListener('focusin', onFocus)
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
