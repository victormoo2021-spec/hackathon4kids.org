'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Laptop from './Laptop'
import CodeTyper from './CodeTyper'
import type { DemoKind } from './demos'

const START_MS = 900
const INTRO_HOLD_MS = 900
// travel + course switching wherever there is room. Under reduced motion too: it is scroll-linked (user-driven);
// the calm tier only drops tilt, pointer follow and the scrubbed line draw (Laptop3D, drawHud)
const TRAVEL = '(min-width: 900px)'

// HUD: from the docked screen's left edge, along the group's top rule, down to just past its title text.
// Drawn (dash scrubbed) as the group's top rises from 85% to 45% of the viewport; only the active group shows.
function drawHud(screen: DOMRect, calm: boolean) {
  const svg = document.querySelector<SVGSVGElement>('.hud')
  if (!svg) return
  const o = svg.getBoundingClientRect()
  const vh = innerHeight
  const range = document.createRange()
  document.querySelectorAll<HTMLElement>('[data-group]').forEach((sec) => {
    const g = svg.querySelector<SVGGElement>(`[data-hud="${sec.dataset.group}"]`)
    const h3 = sec.querySelector('h3')
    if (!g || !h3) return
    const r = sec.getBoundingClientRect()
    range.selectNodeContents(h3)
    const tx = range.getBoundingClientRect()
    const sx = screen.left - o.left
    const sy = screen.top + screen.height * 0.4 - o.top
    const ex = Math.min(sx - 24, r.right - o.left + 24)
    const ry = r.top - o.top
    const hx = tx.right - o.left + 14
    const hy = tx.top + tx.height / 2 - o.top
    const [path, a, b, label] = Array.from(g.children) as SVGGraphicsElement[]
    path.setAttribute('d', `M${sx} ${sy}H${ex}V${ry}H${hx}V${hy}`)
    a.setAttribute('cx', `${sx}`)
    a.setAttribute('cy', `${sy}`)
    b.setAttribute('cx', `${hx}`)
    b.setAttribute('cy', `${hy}`)
    label.setAttribute('x', `${ex - 8}`)
    label.setAttribute('y', `${ry - 8}`)
    const p = calm ? 1 : Math.min(1, Math.max(0, (vh * 0.85 - r.top) / (vh * 0.4)))
    path.style.strokeDashoffset = `${1 - p}`
    b.style.opacity = p >= 1 ? '1' : '0'
    g.toggleAttribute('data-on', r.top <= vh / 2 && r.bottom > vh / 2)
  })
}

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
    const calm = matchMedia('(prefers-reduced-motion: reduce)')
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
      const screen = el.querySelector('.lap-host')
      if (screen) drawHud(screen.getBoundingClientRect(), calm.matches)
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
