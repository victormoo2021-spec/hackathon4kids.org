'use client'

import { useEffect } from 'react'
import { DEMO_CODE, runDemo, type DemoKind } from './demos'
import './course-hover.css'

const W = 240, H = 160, OFF = 16, OMEGA = 20

function build(cls: string, kind: DemoKind) {
  const root = document.createElement('div')
  root.className = cls
  root.setAttribute('aria-hidden', 'true')
  const bar = document.createElement('div')
  bar.className = cls + '__bar'
  bar.textContent = DEMO_CODE[kind]
  const canvas = document.createElement('canvas')
  root.append(bar, canvas)
  return { root, bar, canvas }
}

export default function CourseHover() {
  useEffect(() => {
    const host = document.getElementById('courses')
    if (!host) return
    const mqRM = matchMedia('(prefers-reduced-motion: reduce)')
    const mqFine = matchMedia('(hover: hover) and (pointer: fine)')
    const groupOf = (e: { target: EventTarget | null }) => {
      const li = (e.target as Element | null)?.closest?.('li[data-course-group]') as HTMLElement | null
      return li && host.contains(li) ? li : null
    }
    const kindOf = (li: HTMLElement) => li.dataset.courseGroup as DemoKind

    // ---- fine pointer: card follows the cursor
    const card = build('course-card', 'code')
    document.body.appendChild(card.root)
    let stop = () => {}
    let cur: HTMLElement | null = null
    let tx = 0, ty = 0, x = 0, y = 0, vx = 0, vy = 0, raf = 0, last = 0

    const place = () => {
      card.root.style.transform = `translate3d(${x}px,${y}px,0)`
    }
    const tick = (now: number) => {
      const dt = Math.min(0.032, (now - last) / 1000)
      last = now
      // critically damped spring per axis (semi-implicit Euler)
      vx += (-OMEGA * OMEGA * (x - tx) - 2 * OMEGA * vx) * dt
      vy += (-OMEGA * OMEGA * (y - ty) - 2 * OMEGA * vy) * dt
      x += vx * dt
      y += vy * dt
      place()
      raf = Math.abs(x - tx) + Math.abs(y - ty) + Math.abs(vx) + Math.abs(vy) > 0.1 ? requestAnimationFrame(tick) : 0
    }
    const follow = (e: { clientX: number; clientY: number }, snap: boolean) => {
      tx = e.clientX + OFF + W > innerWidth ? e.clientX - OFF - W : e.clientX + OFF
      ty = e.clientY + OFF + H > innerHeight ? e.clientY - OFF - H : e.clientY + OFF
      if (snap || mqRM.matches) {
        x = tx
        y = ty
        vx = vy = 0
        place()
      } else if (!raf) {
        last = performance.now()
        raf = requestAnimationFrame(tick)
      }
    }
    const hide = () => {
      cur = null
      card.root.removeAttribute('data-on')
      stop()
      stop = () => {}
    }
    let lx = 0, ly = 0
    const onMove = (e: PointerEvent) => {
      if (e.pointerType === 'touch' || !mqFine.matches) return
      lx = e.clientX
      ly = e.clientY
      update(e, e)
    }
    const update = (e: { target: EventTarget | null }, pos: { clientX: number; clientY: number }) => {
      const li = groupOf(e)
      if (!li) return cur ? hide() : undefined
      const first = !cur
      follow(pos, first)
      if (li === cur) return
      cur = li
      stop()
      card.bar.textContent = DEMO_CODE[kindOf(li)]
      card.root.setAttribute('data-on', '')
      stop = runDemo(card.canvas, kindOf(li), { calm: mqRM.matches })
    }

    // ---- coarse pointer: tap toggles an inline demo, one open at a time
    let open: { li: HTMLElement; el: HTMLElement; stop: () => void } | null = null
    const close = () => {
      open?.stop()
      open?.el.remove()
      open = null
    }
    const onClick = (e: MouseEvent) => {
      if (mqFine.matches) return
      const li = groupOf(e)
      if (!li) return
      const same = open?.li === li
      close()
      if (same) return
      const d = build('course-inline', kindOf(li))
      li.appendChild(d.root)
      open = { li, el: d.root, stop: runDemo(d.canvas, kindOf(li), { calm: mqRM.matches }) }
    }

    const onLeave = () => (cur ? hide() : undefined)
    // content moved under a still cursor: re-target instead of hiding blindly
    const onScroll = () => cur && update({ target: document.elementFromPoint(lx, ly) }, { clientX: lx, clientY: ly })
    host.addEventListener('pointermove', onMove)
    host.addEventListener('pointerleave', onLeave)
    host.addEventListener('click', onClick)
    addEventListener('scroll', onScroll, { passive: true })
    return () => {
      host.removeEventListener('pointermove', onMove)
      host.removeEventListener('pointerleave', onLeave)
      host.removeEventListener('click', onClick)
      removeEventListener('scroll', onScroll)
      cancelAnimationFrame(raf)
      stop()
      close()
      card.root.remove()
    }
  }, [])
  return null
}
