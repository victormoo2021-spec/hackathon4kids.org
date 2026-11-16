'use client'

import { useEffect, useRef } from 'react'
import './blueprint.css'

const TARGET = 'a,button,h1,h2,h3,[role="button"],input,summary'

/** Cursor-following vector "blueprint" reveal. Fine pointers only; idle until the first pointermove. */
export default function Blueprint() {
  const root = useRef<HTMLDivElement>(null)
  const box = useRef<HTMLDivElement>(null)
  const out = useRef<HTMLSpanElement>(null)
  const dim = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    if (!window.matchMedia('(pointer:fine)').matches) return
    const el = root.current!
    const br = box.current!
    const reduce = window.matchMedia('(prefers-reduced-motion:reduce)')
    let tx = 0, ty = 0, x = 0, y = 0, vx = 0, vy = 0, last = 0, raf = 0, started = false

    const paint = () => {
      el.style.setProperty('--bx', `${x}px`)
      el.style.setProperty('--by', `${y}px`)
      out.current!.textContent = `${Math.round(x)}, ${Math.round(y)}`
    }
    const tick = (t: number) => {
      const dt = Math.min((t - last) / 1000, 0.05)
      last = t
      // critically damped spring per axis: a = w^2 (target - p) - 2w v
      const w = 28
      vx += (w * w * (tx - x) - 2 * w * vx) * dt
      vy += (w * w * (ty - y) - 2 * w * vy) * dt
      x += vx * dt
      y += vy * dt
      paint()
      if (Math.abs(tx - x) + Math.abs(ty - y) + Math.abs(vx) + Math.abs(vy) > 0.1) raf = requestAnimationFrame(tick)
      else raf = 0
    }
    const onMove = (e: PointerEvent) => {
      if (e.pointerType === 'touch') return
      tx = e.clientX
      ty = e.clientY
      el.dataset.on = 'true'
      if (!started || reduce.matches) {
        started = true
        x = tx
        y = ty
        paint()
      } else if (!raf) {
        last = performance.now()
        raf = requestAnimationFrame(tick)
      }
      const t = (e.target as Element | null)?.closest?.(TARGET)
      if (t) {
        const r = t.getBoundingClientRect()
        br.style.transform = `translate(${r.left}px,${r.top}px)`
        br.style.width = `${r.width}px`
        br.style.height = `${r.height}px`
        dim.current!.textContent = `${Math.round(r.width)} × ${Math.round(r.height)}`
        br.dataset.on = 'true'
      } else br.dataset.on = 'false'
    }
    const off = () => {
      el.dataset.on = 'false'
      br.dataset.on = 'false'
    }
    document.addEventListener('pointermove', onMove, { passive: true })
    document.documentElement.addEventListener('pointerleave', off)
    window.addEventListener('blur', off)
    return () => {
      cancelAnimationFrame(raf)
      document.removeEventListener('pointermove', onMove)
      document.documentElement.removeEventListener('pointerleave', off)
      window.removeEventListener('blur', off)
    }
  }, [])

  return (
    <>
      <div ref={root} className="blueprint" data-on="false" data-testid="blueprint" aria-hidden>
        <div className="bp-cross-x" />
        <div className="bp-cross-y" />
        <span ref={out} className="bp-read" />
      </div>
      <div ref={box} className="bp-box" data-on="false" aria-hidden>
        <span ref={dim} />
      </div>
    </>
  )
}
