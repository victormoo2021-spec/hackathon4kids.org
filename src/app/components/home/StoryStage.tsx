'use client'

import { useRef, useState } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useGSAP } from '@gsap/react'
import Laptop from './Laptop'
import CodeTyper from './CodeTyper'
import { SKETCH } from './program'
import { runSketch } from './sketch'
import { fx, FX_FINAL } from '../fx/store'

gsap.registerPlugin(useGSAP)

const CAPS = [
  'You write the code.',
  'One line turns the lights on.',
  'Five streaks, because you typed five.',
  'Change a number. It moves.',
  'Add some sparkle.',
  'Now it follows you.',
  'This is what coding feels like.',
]
// Scroll beats (% of #hero scroll): each line types between START and END and applies at END.
const START = [12, 18, 32, 46, 58, 70]
const END = [18, 30, 44, 56, 68, 80]
// captions land when their line COMPLETES (last one at the handoff)
const CAP_AT = [...END, 84]
// Autoplay (seconds): when each line starts typing, and when each caption shows.
const CHAR_S = 0.032
const AUTO = [0, 0.9, 2.3, 4.2, 5.4, 6.8]
const AUTO_CAP = [...AUTO.map((t, i) => t + SKETCH[i].length * CHAR_S), 8.4]
const REST = { glow: 'violet', streaks: 1, intensity: 0.4 } as const
const FULL = SKETCH.map((l) => l.length)
const EMPTY = SKETCH.map(() => 0)
const same = (a: number[], b: number[]) => a.every((v, i) => v === b[i])
const doneLines = (c: number[]) => SKETCH.filter((l, i) => c[i] >= l.length).length

export default function StoryStage() {
  const root = useRef<HTMLDivElement>(null)
  const [counts, setCounts] = useState(FULL)
  const [progress, setProgress] = useState(1)

  useGSAP(
    () => {
      const hero = root.current!.closest<HTMLElement>('.hero-pin')!
      const section = hero.closest<HTMLElement>('#hero')!
      const caps = gsap.utils.toArray<HTMLElement>('.cap', hero)
      const mm = gsap.matchMedia()
      let shown = FULL
      let lines = -1

      // one entry point: editor text + the lights behind the page, both derived from the typed characters
      const show = (c: number[]) => {
        if (same(c, shown)) return
        shown = c
        setCounts(c)
        const n = doneLines(c)
        if (n === lines) return
        lines = n
        // living first frame: a faint violet ribbon until `glow = "purple"` lands, which is the visible step-change
        const { glow, streaks, speed, sparkle, followMouse } = runSketch(SKETCH, n)
        fx.set({ glow: glow ?? REST.glow, streaks: Math.max(streaks, REST.streaks), speed, sparkle, followMouse, intensity: n >= 2 ? 1 : REST.intensity })
      }
      const cap = (i: number) => caps.forEach((c, j) => c.classList.toggle('on', j === i))
      const typed = (pct: number) => SKETCH.map((l, i) => Math.round(gsap.utils.clamp(0, 1, (pct - START[i]) / (END[i] - START[i])) * l.length))

      mm.add('(min-width: 900px) and (prefers-reduced-motion: no-preference)', () => {
        const slot = hero.querySelector<HTMLElement>('.stage-laptop')!
        const copy = hero.querySelector<HTMLElement>('.hero-copy')!
        const capsEl = hero.querySelector<HTMLElement>('.caps')!
        const dist = () => section.offsetHeight - window.innerHeight
        show(EMPTY)
        // timeline units are percent of #hero's scroll
        gsap.timeline({
          defaults: { ease: 'none' },
          scrollTrigger: { trigger: section, start: 'top top', end: 'bottom bottom', scrub: 0.6, invalidateOnRefresh: true },
        })
          .to(copy, { opacity: 0, x: -60, duration: 12, ease: 'power2.in' }, 0)
          .to(slot, { x: () => hero.clientWidth / 2 - (slot.offsetLeft + slot.offsetWidth / 2), scale: 1.45, duration: 12, ease: 'power3.inOut' }, 0)
          .to(slot, { scale: 0.92, yPercent: -18, duration: 16, ease: 'power3.in' }, 84)
          .to(capsEl, { opacity: 0, duration: 6, ease: 'power2.in' }, 86)
          // parallax (transforms only): copy drifts up at .15 of scroll, captions down at .1, laptop stays put
          .to(copy, { y: () => -0.15 * dist(), duration: 100, ease: 'none' }, 0)
          .fromTo(capsEl, { y: () => -0.05 * dist() }, { y: () => 0.05 * dist(), duration: 84, ease: 'none' }, 0)
        // typing is driven straight from native scroll (no smoothing), so it's reversible and exact
        const st = ScrollTrigger.create({
          trigger: section,
          start: 'top top',
          end: 'bottom bottom',
          onUpdate: ({ progress: p }) => {
            const pct = p * 100
            show(typed(pct))
            setProgress(Math.round(p * 100) / 100)
            cap(CAP_AT.reduce((a, s, i) => (pct >= s ? i : a), -1))
            const t = gsap.utils.clamp(0, 1, (pct - 84) / 16)
            if (t > 0 || fx.get().pageMode > 0) fx.set({ pageMode: t, intensity: 1 - 0.1 * t })
          },
        })
        return () => { st.kill(); fx.set({ pageMode: 0, intensity: 1 }); cap(-1) }
      })

      // no pin: type once when the laptop is on screen. Reduced motion = whole lines, 600ms apart.
      mm.add('(max-width: 899px), (prefers-reduced-motion: reduce)', () => {
        const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches
        let tl: gsap.core.Timeline | undefined
        show(EMPTY)
        const slot = hero.querySelector<HTMLElement>('.stage-laptop')!
        if (!reduce) gsap.set(slot, { autoAlpha: 0 })
        const st = ScrollTrigger.create({
          trigger: slot,
          start: 'top 75%',
          once: true,
          onEnter: () => {
            if (!reduce) gsap.fromTo(slot, { autoAlpha: 0, y: 16 }, { autoAlpha: 1, y: 0, duration: 0.4, ease: 'power3.out', clearProps: 'transform,opacity,visibility' })
            tl = gsap.timeline({ delay: window.scrollY === 0 ? 1.2 : 0 })
            const at = (i: number) => (reduce ? i * 0.6 : AUTO[i])
            const c = [...EMPTY]
            SKETCH.forEach((l, i) => {
              if (reduce) return tl!.call(() => { c[i] = l.length; show([...c]) }, [], at(i))
              const o = { n: 0 }
              tl!.to(o, { n: l.length, duration: l.length * CHAR_S, ease: 'none', onUpdate: () => { c[i] = Math.round(o.n); show([...c]) } }, at(i))
            })
            CAPS.forEach((_, i) => tl!.call(() => cap(i), [], reduce ? i * 0.6 : AUTO_CAP[i]))
            tl.call(() => { show(FULL); fx.set(FX_FINAL) }, [], reduce ? 4.2 : 8.4)
          },
        })
        return () => { st.kill(); tl?.kill(); gsap.set(slot, { clearProps: 'all' }); cap(CAPS.length - 1); show(FULL) }
      })

      const refresh = () => ScrollTrigger.refresh()
      document.fonts?.ready.then(refresh)
      requestAnimationFrame(refresh)
      return () => mm.revert()
    },
    { scope: root },
  )

  return (
    <div ref={root} className="stage">
      <div className="stage-laptop">
        <Laptop progress={progress}>
          <CodeTyper counts={counts} />
        </Laptop>
      </div>
      <div id="story" className="story">
        <ol className="caps" data-fx-shield-2>
          {CAPS.map((c) => <li key={c} className="cap">{c}</li>)}
        </ol>
      </div>
    </div>
  )
}
