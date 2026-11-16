'use client'

import { useRef, useState } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useGSAP } from '@gsap/react'
import Device from './Device'
import Trail from './Trail'
import TurtleCanvas, { fit } from './TurtleCanvas'
import { RUN } from './program'

gsap.registerPlugin(ScrollTrigger, useGSAP)

const CAPS = [
  'Write a few lines.',
  'Press run.',
  'Watch your code draw.',
  'Then keep going: Python, robotics, game design, math, physics.',
]
const SCALE = 1.08

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

      mm.add('(min-width: 900px) and (prefers-reduced-motion: no-preference)', () => {
        const wrap = $('.device-wrap')
        const caps = $$('.cap')
        const prog = { p: 0 }
        const capIn = { autoAlpha: 1, y: 0, duration: 0.5, ease: 'power2.out' }
        const capFrom = { autoAlpha: 0, y: 26 }
        const capOut = { autoAlpha: 0, y: -26, duration: 0.4, ease: 'power2.in' }

        // hide the untyped lines (6+) up front; the scrub types them in
        gsap.set($$('.device .ln:nth-child(n+6) .ch'), { opacity: 0 })
        gsap.set($('.device .term'), { opacity: 0 })
        setProgress(0)

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

        // a) copy leaves, laptop glides to center, the trail starts to run toward it
        tl.to($('.hero-copy'), { autoAlpha: 0, x: -90, duration: 1.1, ease: 'power2.in' }, 0)
          .to(wrap, { x: () => hero.clientWidth / 2 - (wrap.offsetLeft + wrap.offsetWidth / 2), scale: SCALE, duration: 1.4, ease: 'power2.inOut' }, 0)
          .fromTo($('.trail path'), { strokeDashoffset: () => buildTrail() - 36 }, { strokeDashoffset: 0, duration: 5, ease: 'power1.inOut' }, 0.3)
          .fromTo(caps[0], capFrom, capIn, 0.9)
          // type
          .to($$('.device .ln:nth-child(n+6) .ch'), { opacity: 1, duration: 0.02, stagger: { amount: 2.8 } }, 1.3)
          .to(caps[0], capOut, 4.3)
          // b) run
          .fromTo(caps[1], capFrom, capIn, 4.5)
          .to($('.run-btn'), { scale: 0.88, backgroundColor: '#7c5cff', duration: 0.18, ease: 'power2.out' }, 4.9)
          .to($('.run-btn'), { scale: 1, backgroundColor: '#a78bff', duration: 0.25, ease: 'back.out(3)' }, 5.1)
          .to($('.trail'), { opacity: 0, duration: 0.8 }, 5.6)
          .to(caps[1], capOut, 5.6)
          // c) the drawing builds with the scroll
          .fromTo(caps[2], capFrom, capIn, 6)
          .to(prog, { p: 1, duration: 4, onUpdate: () => setProgress(prog.p) }, 5.6)
          .to(caps[2], capOut, 9.6)
          // d) it printed, then keep going
          .to($('.device .term'), { opacity: 1, duration: 0.3 }, 9.6)
          .fromTo(caps[3], capFrom, capIn, 9.9)
          .to({}, { duration: 0.25 }, 12.4)

        return () => setProgress(1)
      })

      // no pin: a short autoplay once the laptop is on screen (skipped under reduced motion)
      mm.add('(max-width: 899px) and (prefers-reduced-motion: no-preference)', () => {
        const prog = { p: 0 }
        setProgress(0)
        const st = ScrollTrigger.create({
          trigger: $('.device-wrap'),
          start: 'top 75%',
          once: true,
          onEnter: () => { gsap.to(prog, { p: 1, duration: 3.2, ease: 'power1.inOut', onUpdate: () => setProgress(prog.p) }) },
        })
        return () => { st.kill(); setProgress(1) }
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
          <p className="term"><span>$</span> {RUN.output.join('  ')}</p>
        </div>
        <ol className="caps">
          {CAPS.map((c) => <li key={c} className="cap">{c}</li>)}
        </ol>
      </div>
    </div>
  )
}
