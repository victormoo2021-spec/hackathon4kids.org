'use client'

import { useRef, useState } from 'react'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'
import Laptop from './Laptop'
import CodeTyper from './CodeTyper'
import { SKETCH } from './program'
import { runSketch } from './sketch'
import { fx, FX_FINAL } from '../fx/store'

gsap.registerPlugin(useGSAP)

const CHAR_S = 0.032
const START_S = 1.4
const POSE = 0.3
const REST = { glow: 'violet', streaks: 1, intensity: 0.4 } as const
const FULL = SKETCH.map((l) => l.length)
const EMPTY = SKETCH.map(() => 0)
const doneLines = (c: number[]) => SKETCH.filter((l, i) => c[i] >= l.length).length

// The laptop types the sketch once, by itself, after the hero entrance. Not tied to scroll.
export default function StoryStage() {
  const root = useRef<HTMLDivElement>(null)
  const [counts, setCounts] = useState(FULL)

  useGSAP(
    () => {
      const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches
      let lines = -1
      const show = (c: number[]) => {
        setCounts(c)
        const n = doneLines(c)
        if (n === lines) return
        lines = n
        // living first frame: a faint violet ribbon until `glow = "purple"` lands
        const { glow, streaks, speed, sparkle, followMouse } = runSketch(SKETCH, n)
        fx.set({ glow: glow ?? REST.glow, streaks: Math.max(streaks, REST.streaks), speed, sparkle, followMouse, intensity: n >= 2 ? 1 : REST.intensity })
      }
      const end = () => { setCounts(FULL); fx.set(FX_FINAL) }

      const c = [...EMPTY]
      show(EMPTY)
      const tl = gsap.timeline({ delay: START_S, onComplete: end })
      let t = 0
      SKETCH.forEach((l, i) => {
        if (reduce) return tl.call(() => { c[i] = l.length; show([...c]) }, [], i * 0.5)
        const o = { n: 0 }
        tl.to(o, { n: l.length, duration: l.length * CHAR_S, ease: 'none', onUpdate: () => { c[i] = Math.round(o.n); show([...c]) } }, t)
        t += l.length * CHAR_S
      })
      // scrolled away before it ends: finish instantly
      const io = new IntersectionObserver(([e]) => { if (!e.isIntersecting && tl.progress() < 1) { tl.kill(); end() } })
      io.observe(root.current!)
      return () => { io.disconnect(); tl.kill() }
    },
    { scope: root },
  )

  return (
    <div ref={root} className="stage">
      <div id="story" className="stage-laptop">
        <Laptop progress={POSE}>
          <CodeTyper counts={counts} />
        </Laptop>
      </div>
    </div>
  )
}
