'use client'

import { useRef, useState } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useGSAP } from '@gsap/react'
import Device from './Device'
import Trail from './Trail'
import TurtleCanvas, { fit } from './TurtleCanvas'
import { RUN } from './program'

gsap.registerPlugin(useGSAP)

const CAPS = [
  'You write the code.',
  'Run it.',
  'The turtle draws it.',
  'Then robotics, games, math, and physics.',
]
const SCALE = 1.08
const SEGS = RUN.segments.length
// the loop starts on line 5 of the program (index 4); its body is stepped through like a debugger
const LOOP_FIRST = 4

// position of el inside root, ignoring transforms
function offsetIn(el: HTMLElement, root: HTMLElement) {
  let x = 0, y = 0
  for (let e: HTMLElement | null = el; e && e !== root; e = e.offsetParent as HTMLElement | null) {
    x += e.offsetLeft; y += e.offsetTop
  }
  return { x, y }
}

export default function StoryStage() {
  const root = useRef<HTMLDivElement>(null)
  const trail = useRef<SVGPathElement>(null)
  const [progress, setProgress] = useState(1)

  useGSAP(
    () => {
      const section = root.current!.closest<HTMLElement>('#hero')!
      const hero = section.querySelector<HTMLElement>('.hero-pin')!
      const $ = (s: string) => hero.querySelector<HTMLElement>(s)!
      const $$ = (s: string) => gsap.utils.toArray<HTMLElement>(s, hero)
      const mm = gsap.matchMedia()
      const lines = $$('.device .ln')
      const terms = $$('.term em')
      // one entry point: canvas progress, debugger line, terminal output
      const setP = (p: number, showTerm = true) => {
        setProgress(p)
        const on = p >= 1 ? lines.length - 1 : p <= 0 ? LOOP_FIRST : LOOP_FIRST + 1 + (Math.floor(p * SEGS * 3) % 6)
        lines.forEach((l, i) => l.classList.toggle('on', i === on))
        if (showTerm) gsap.set(terms, { opacity: p >= 1 ? 1 : 0 })
      }

      mm.add('(min-width: 900px) and (prefers-reduced-motion: no-preference)', () => {
        const wrap = $('.device-wrap')
        const caps = $$('.cap')
        const prog = { p: 0 }
        // timeline units are percent of #hero's scroll, so positions below read straight off the spec
        const capIn = { autoAlpha: 1, y: 0, duration: 4, ease: 'power2.out' }
        const capFrom = { autoAlpha: 0, y: 26 }
        const capOut = { autoAlpha: 0, y: -26, duration: 4, ease: 'power2.in' }

        setP(0)

        // the trail runs from the CTA to the drawing's start point, over the laptop's final position
        const buildTrail = () => {
          const path = trail.current!
          const cta = $('.hero-copy .btn')
          const s = offsetIn(cta, hero)
          const sx = s.x + cta.offsetWidth + 6, sy = s.y + cta.offsetHeight / 2
          const canvas = $('.out canvas')
          const o = offsetIn(canvas, wrap)
          const f = fit(canvas.offsetWidth, canvas.offsetHeight)
          const W = wrap.offsetWidth, H = wrap.offsetHeight
          const cx = hero.clientWidth / 2, cy = wrap.offsetTop + H / 2
          const ex = cx + (o.x + f.ox - W / 2) * SCALE, ey = cy + (o.y + f.oy - H / 2) * SCALE
          const top = cy - (H * SCALE) / 2 - 60
          const arc = Math.max(top, 80)
          path.setAttribute('d', `M${sx} ${sy} C${sx + 220} ${sy - 30} ${ex - 40} ${arc} ${ex} ${ey}`)
          const len = path.getTotalLength()
          path.style.strokeDasharray = `${len}`
          return len
        }

        const tl = gsap.timeline({
          defaults: { ease: 'none' },
          scrollTrigger: {
            // CSS position: sticky does the pinning (no JS layout switch, so no CLS)
            trigger: section,
            start: 'top top',
            end: 'bottom bottom',
            scrub: 0.6,
            invalidateOnRefresh: true,
          },
        })

        tl.to($('.hero-copy'), { autoAlpha: 0, x: -90, duration: 11, ease: 'power2.in' }, 0)
          .to(wrap, { x: () => hero.clientWidth / 2 - (wrap.offsetLeft + wrap.offsetWidth / 2), scale: SCALE, duration: 15, ease: 'power3.inOut' }, 0)
          .fromTo($('.trail path'), { strokeDashoffset: () => buildTrail() }, { strokeDashoffset: 0, duration: 31, ease: 'power1.inOut' }, 3)
          .fromTo(caps[0], capFrom, capIn, 9)
          .to(caps[0], capOut, 31)
          // b) run: the pill presses at 38
          .fromTo(caps[1], capFrom, capIn, 33)
          .to($('.run-btn'), { scale: 0.92, backgroundColor: 'rgb(167 139 255 / 0.34)', duration: 1.5, ease: 'power2.out' }, 38)
          .to($('.run-btn'), { scale: 1, backgroundColor: 'rgb(167 139 255 / 0.16)', duration: 2.5, ease: 'power2.out' }, 39.5)
          .to($('.trail'), { opacity: 0, duration: 6 }, 36)
          .to(caps[1], capOut, 44)
          // c) execution: the active line walks the loop while the drawing builds (44-85)
          .fromTo(caps[2], capFrom, capIn, 46)
          .to(prog, { p: 1, duration: 41, onUpdate: () => setP(prog.p) }, 44)
          .to(caps[2], capOut, 86)
          // d) it printed, then keep going
          .fromTo(caps[3], capFrom, capIn, 90)
          .to({}, { duration: 0.01 }, 99.99)

        return () => setP(1)
      })

      // no pin: one autoplay when the laptop is on screen. Calm tier = same beats, color/opacity only
      mm.add('(max-width: 899px), (prefers-reduced-motion: reduce)', () => {
        const full = !matchMedia('(prefers-reduced-motion: reduce)').matches
        const prog = { p: 0 }
        const caps = $$('.cap')
        const run = $('.run-btn')
        const shot = $('.shot')
        let tl: gsap.core.Timeline | undefined
        setP(0)
        const st = ScrollTrigger.create({
          trigger: $('.device-wrap'),
          start: 'top 75%',
          once: true,
          onEnter: () => {
            tl = gsap.timeline({ delay: window.scrollY === 0 ? 1.6 : 0 })
            tl.to(run, { backgroundColor: 'rgb(167 139 255 / 0.34)', ...(full && { scale: 0.92 }), duration: 0.24, yoyo: true, repeat: 1, ease: 'power2.out', clearProps: 'transform' }, 0)
              .to(prog, { p: 1, duration: 3, ease: 'power1.inOut', onUpdate: () => setP(prog.p, false) }, 0)
              .to(terms, { opacity: 1, duration: 0.3, ease: 'none' }, 3)
            if (full) tl.fromTo(shot, { y: 16 }, { y: 0, duration: 0.7, ease: 'power3.out', clearProps: 'transform' }, 0)
            ;[0, 0.5, 0.9, 3.9].forEach((t, i) => tl!.call(() => caps[i].classList.add('on'), [], t))
          },
        })
        return () => { st.kill(); tl?.kill(); caps.forEach((c) => c.classList.add('on')); setP(1) }
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
      <Device progress={progress} />
      <div id="story" className="story">
        <Trail pathRef={trail} />
        <div className="shot card" aria-hidden>
          <TurtleCanvas progress={progress} />
          <p className="term"><span>$</span> <em>{RUN.output.join('  ')}</em></p>
        </div>
        <ol className="caps">
          {CAPS.map((c) => <li key={c} className="cap">{c}</li>)}
        </ol>
      </div>
    </div>
  )
}
