'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Laptop from './Laptop'
import CodeTyper from './CodeTyper'
import type { DemoKind } from './demos'

const START_MS = 900
const INTRO_HOLD_MS = 900
// travel + course switching only where there is room and motion is welcome; elsewhere the laptop stays put
const TRAVEL = '(min-width: 900px) and (prefers-reduced-motion: no-preference)'

// The hero laptop types a hello line, then runs the 'code' demo. On desktop it then rides the scroll into the
// sticky slot in #courses (.course-lap-slot) and shows each course group's demo as it crosses the viewport middle.
export default function StoryStage() {
  const fly = useRef<HTMLDivElement>(null)
  const [kind, setKind] = useState<DemoKind | null>(null)
  const [t, setT] = useState(0)
  const introDone = useCallback(() => setTimeout(() => setKind((k) => k ?? 'code'), INTRO_HOLD_MS), [])

  useEffect(() => {
    const el = fly.current!
    const home = el.parentElement!
    const mq = matchMedia(TRAVEL)
    let raf = 0
    // FLIP by transform: lerp the laptop's rect from its hero slot to the sticky slot, both measured live.
    // Past the end of travel the slot is stuck, so the laptop rides alongside; after #courses it scrolls away with it.
    const update = () => {
      raf = 0
      const slot = document.querySelector<HTMLElement>('.course-lap-slot')
      if (!mq.matches || !slot) {
        el.style.transform = ''
        setT(0)
        return
      }
      const h = home.getBoundingClientRect()
      const s = slot.getBoundingClientRect()
      const rest = slot.parentElement!.getBoundingClientRect().top - parseFloat(getComputedStyle(slot).top)
      const raw = rest <= 0 ? 1 : Math.min(1, scrollY / (scrollY + rest))
      const e = raw * raw * (3 - 2 * raw)
      const k = s.width / h.width
      el.style.transform = `translate3d(${(s.left - h.left) * e}px, ${(s.top - h.top) * e}px, 0) scale(${1 + (k - 1) * e})`
      setT(Math.round(raw * 100) / 100)
    }
    const req = () => { raf ||= requestAnimationFrame(update) }
    const io = new IntersectionObserver(
      (es) => es.forEach((x) => mq.matches && x.isIntersecting && setKind((x.target as HTMLElement).dataset.group as DemoKind)),
      { rootMargin: '-50% 0px -50% 0px' },
    )
    document.querySelectorAll('[data-group]').forEach((g) => io.observe(g))
    addEventListener('scroll', req, { passive: true })
    addEventListener('resize', req)
    mq.addEventListener('change', req)
    req()
    return () => {
      cancelAnimationFrame(raf)
      io.disconnect()
      removeEventListener('scroll', req)
      removeEventListener('resize', req)
      mq.removeEventListener('change', req)
    }
  }, [])

  return (
    <div className="stage">
      <div id="story" className="stage-laptop">
        <div ref={fly} className="lap-fly">
          <Laptop progress={t}>
            <CodeTyper kind={kind} delay={kind ? 0 : START_MS} onDone={kind ? undefined : introDone} />
          </Laptop>
        </div>
      </div>
    </div>
  )
}
