'use client'

import { useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useGSAP } from '@gsap/react'

// Plugins are registered once in Providers.tsx.

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
 * Reveals every [data-reveal] descendant once, as it enters the viewport.
 *   data-reveal="" | "rise"  opacity 0->1 + y 16->0 (700ms out)
 *   data-reveal="fade"       opacity only (800ms)
 *   data-reveal="clip"       clip-path inset(0 0 100% 0)->0 (800ms expo.out); calm: plain fade
 *   data-reveal="rule"       tweens CSS var --rule 0->1 (900ms out); opacity untouched
 *   data-delay="120"         extra delay in ms
 * Calm (reduced motion): rise becomes a 500ms fade, rule is set to 1 immediately.
 * Without JS everything is visible: the hidden state is applied here only.
 */
export default function Reveal({ children, className, as: Tag = 'div', stagger = 0.06, ...rest }: RevealProps) {
  const ref = useRef<HTMLElement>(null)

  useGSAP(
    () => {
      const mm = gsap.matchMedia()
      mm.add({ full: '(prefers-reduced-motion: no-preference)', calm: '(prefers-reduced-motion: reduce)' }, (ctx) => {
        const calm = !!ctx.conditions?.calm
        const items = gsap.utils.toArray<HTMLElement>('[data-reveal]', ref.current)
        if (!items.length) return
        const kind = (el: HTMLElement) => el.dataset.reveal || 'rise'
        // opacity only (never visibility) so unrevealed content stays focusable for keyboard users
        items.forEach((el) => {
          if (kind(el) === 'rule') gsap.set(el, { '--rule': calm ? 1 : 0 })
          else if (kind(el) === 'clip' && !calm) gsap.set(el, { opacity: 1, clipPath: 'inset(0 0 100% 0)' })
          else gsap.set(el, { opacity: 0, y: kind(el) === 'rise' && !calm ? 16 : 0 })
        })
        const show = (els: Element[]) =>
          els.forEach((el, i) => {
            const e = el as HTMLElement
            const delay = i * stagger + (Number(e.dataset.delay) || 0) / 1000
            const k = kind(e)
            if (k === 'rule') {
              if (!calm) gsap.to(e, { '--rule': 1, duration: 0.6, ease: 'power3.out', delay, overwrite: true })
            } else if (k === 'clip' && !calm) {
              gsap.to(e, { opacity: 1, clipPath: 'inset(0 0 0% 0)', duration: 0.8, ease: 'expo.out', delay, overwrite: true, onComplete: () => { e.style.clipPath = '' } })
            } else if (k === 'fade') {
              gsap.to(e, { opacity: 1, duration: 0.8, ease: 'power1.out', delay, overwrite: true })
            } else if (calm) {
              gsap.to(e, { opacity: 1, duration: 0.5, ease: 'power1.out', delay, overwrite: true })
            } else {
              gsap.to(e, { opacity: 1, y: 0, duration: 0.7, ease: 'expo.out', delay, overwrite: true })
            }
          })
        const onFocus = (e: FocusEvent) => {
          items
            .filter((el) => el.contains(e.target as Node))
            .forEach((el) =>
              kind(el) === 'rule' ? gsap.set(el, { '--rule': 1, overwrite: true }) : gsap.set(el, { opacity: 1, y: 0, clipPath: 'none', overwrite: true }),
            )
        }
        ref.current?.addEventListener('focusin', onFocus)
        ScrollTrigger.batch(items, { start: 'top 88%', once: true, onEnter: (batch) => show(batch) })
        // safety: print / PDF / full-page capture never scrolls, so reveal everything then
        const showAll = () => items.forEach((el) => (kind(el) === 'rule' ? gsap.set(el, { '--rule': 1 }) : gsap.set(el, { opacity: 1, y: 0, clipPath: 'none' })))
        window.addEventListener('beforeprint', showAll)
        return () => {
          ref.current?.removeEventListener('focusin', onFocus)
          window.removeEventListener('beforeprint', showAll)
        }
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
