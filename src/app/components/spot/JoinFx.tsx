'use client'
// Join band sequence (one GSAP timeline): roller flood (6 steps) -> title + CTA -> stamp swing (12 steps) -> thunk.
// SSR / no-JS / reduced motion / band in view at arm time: finished accent band with the stamp at rest (nothing hidden by CSS).
import { useEffect, useRef } from 'react'
import { scene } from '../../motion'
import { INK } from '../../press/ink'
import { initSlip, jolt } from '../../press/slip'
import { mountRoller } from '../../press/Roller'
import { mountStamp } from './Stamp'

export default function JoinFx({ pivot = '50%' }: { pivot?: string }) {
  const rollRef = useRef<HTMLCanvasElement>(null)
  const stampRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const rollCv = rollRef.current!, stampCv = stampRef.current!
    const band = stampCv.parentElement!
    const offSlip = initSlip()
    const stamp = mountStamp(stampCv, band, pivot)
    let roller: ReturnType<typeof mountRoller> = null
    const done = () => band.classList.add('rolled', 'stamped')
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) done()

    const off = scene(band, ({ gsap, below, safe }, c, ctx) => {
      if (!below(band)) return done() // in view at arm: stays accent and static
      const st = { line: 0, t: 0 }
      const swing = (amp: number) =>
        gsap.fromTo(st, { t: 0 }, { t: 12, duration: 0.84, ease: 'steps(12)', onUpdate: () => stamp.draw(amp * 0.82 ** st.t * Math.cos(1.1 * st.t), 1) })
      const pulse = (tl: gsap.core.Timeline, at: string) =>
        tl.call(() => stamp.draw(0, 1.5), [], at).call(() => stamp.draw(0, 1.2), [], `${at}+=0.07`).call(() => stamp.draw(0, 1), [], `${at}+=0.14`)
      gsap.set(band, { backgroundColor: INK.bg })
      gsap.set('.final-in', { autoAlpha: 0 })
      gsap.set(stampCv, { autoAlpha: 0 })
      roller = mountRoller(rollCv, band)
      const cta = band.querySelector<HTMLElement>('.final-cta .cta')
      const tl = gsap.timeline({ scrollTrigger: { trigger: band, start: 'top 80%', once: true } })
      tl.to(st, { line: 1, duration: 0.42, ease: 'steps(6)', onUpdate: () => roller?.draw(st.line) })
        .addLabel('ink')
        .set(band, { backgroundColor: INK.accent })
        .set(rollCv, { autoAlpha: 0 })
        .set('.final-in', { autoAlpha: 1 })
        .call(() => { band.classList.add('rolled') })
        .fromTo('#join-title', { clipPath: 'inset(0 0 100% 0)', yPercent: 35 }, { clipPath: 'inset(0 0 0% 0)', yPercent: 0, duration: 0.72, ease: 'power4.out', clearProps: 'clipPath' }, 'ink')
        .fromTo('.final-cta', { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.48, ease: 'power3.out' }, 'ink+=0.12')
        .set(stampCv, { autoAlpha: 1 }, 'ink+=0.1')
        .add(swing(0.5), 'ink+=0.1')
        .addLabel('thunk')
        .call(() => { band.classList.add('stamped'); jolt(6) }, [], 'thunk')
      pulse(tl, 'thunk')
      if (cta) tl.to(cta, { scale: 0.94, duration: 0.07, ease: 'power2.in' }, 'thunk').to(cta, { scale: 1, duration: 0.48, ease: 'elastic.out(1, 0.45)' })

      // hover kick (fine pointers): the bob swings again once the sequence has finished
      let kicking = false
      const kick = safe(ctx, (e: Event) => {
        if (!c.fine || kicking || tl.progress() < 1 || !(e.target as Element).closest('.btn-primary')) return
        kicking = true
        const k = gsap.timeline({ onComplete: () => { kicking = false } })
        k.add(swing(0.8))
        pulse(k, '>')
      })
      band.addEventListener('pointerover', kick)
      return () => {
        band.removeEventListener('pointerover', kick)
        roller?.destroy(); roller = null
        band.classList.remove('rolled', 'stamped')
        stamp.draw(0, 1)
      }
    })
    return () => { off(); offSlip(); roller?.destroy(); stamp.destroy() }
  }, [pivot])

  return (
    <>
      <canvas ref={rollRef} aria-hidden style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }} />
      <canvas ref={stampRef} aria-hidden style={{ position: 'absolute', top: 0, left: 0, width: '100%', pointerEvents: 'none' }} />
    </>
  )
}
