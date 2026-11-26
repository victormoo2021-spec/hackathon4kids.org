'use client'
import { useEffect, useRef } from 'react'
import Poster from './Poster'
import { now } from '../../press/clock'
import { LOAD_MS, Pendulum, REST, frame0, geo, plate } from './pendulum'

// Hero strobe sheet. Mount as a child of the (position:relative) hero section; it fills it. Poster is frame 0 and stays if GL is missing.
// Pointer: fine pointers steer the plates and open the loupe; the bob can be grabbed and thrown (mouse/pen). Touch never drags:
// the page scrolls, a tap kicks the swing.
const RAD = Math.PI / 180
const GRAB = 1.6 // x bob radius
const lerp = (a: number, b: number, k: number) => a + (b - a) * k

export default function HeroSheet() {
  const wrap = useRef<HTMLDivElement>(null)
  const cv = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const el = wrap.current!, canvas = cv.current!, host = el.parentElement!, poster = el.firstElementChild as HTMLElement
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches
    const fine = matchMedia('(hover: hover) and (pointer: fine)').matches && !reduce
    const slabBottom = () => { const s = host.querySelector('.t-slab, .slab, .hero-slab'); return s ? s.getBoundingClientRect().bottom - host.getBoundingClientRect().top : undefined }
    let W = 0, H = 0, g = geo(1, 1)
    const sim = new Pendulum(1)
    const measure = () => {
      const r = el.getBoundingClientRect(); W = r.width; H = r.height
      g = geo(W, H, slabBottom()); sim.amp = g.amp
      poster.style.setProperty('--px', g.px + 'px'); poster.style.setProperty('--py', g.py + 'px')
      poster.style.setProperty('--L', g.len + 'px'); poster.style.setProperty('--th', frame0(g.amp).th0 + 'rad')
    }
    measure()
    sim.th = frame0(g.amp).th0

    let dead = false, cleanup = () => {}
    let t0 = performance.getEntriesByName('first-contentful-paint')[0]?.startTime ?? performance.now() - 600, started = false
    const go = async () => {
      if (started) return
      started = true
      const { mountSheet, press } = await import('../../press/gl/press')
      if (dead || !press.ok) return
      boot(mountSheet, press)
    }
    go()

    function boot(mountSheet: typeof import('../../press/gl/press').mountSheet, press: typeof import('../../press/gl/press').press) {
      const dpr = () => Math.min(devicePixelRatio || 1, innerWidth < 768 ? 1.25 : 1.5)
      const bootT = now() - t0
      el.setAttribute('data-gl-t0', t0.toFixed(0)); el.setAttribute('data-gl-boot', bootT.toFixed(0))
      let th = sim.th, grabbing = false, grabOff = 0, held = false, downAt = 0, downX = 0, downY = 0, moved = 0
      let samples: { t: number; th: number }[] = []
      let mx = 0.5, my = 0.5, tx = 0.5, ty = 0.5, px = 0, py = 0, lx = 0, ly = 0, lr = 0, lt = 0
      let jolt = 0, smear = 0, loadOff = 26, clr = 0, lastX = -1, lastMove = 0, nextBlip = 0, calls = 0, shown = false
      let lastLabel = ''
      let tap: { x: number; y: number; t: number } | null = null
      const rect = () => el.getBoundingClientRect()
      const bobAt = () => ({ x: g.px + g.len * Math.sin(th), y: g.py + g.len * Math.cos(th) })

      const push = (pass: [number, number, number], decay: number, sub: number) => {
        const d = dpr()
        const slip = reduce ? 0 : press.slip.y
        const ox = REST.x + (mx - 0.5) * 18 + smear + jolt + loadOff
        const oy = REST.y + (my - 0.5) * 12 + jolt * 0.5 + slip + loadOff * 0.4
        s.set({
          uP: [g.px * d, g.py * d], uL: g.len * d, uC: Math.max(8, Math.min(11, g.len / 62)) * d,
          uTh: th, uOff: [ox * d, oy * d], uA: (mx - 0.5) * 2 * 6 * RAD, uGain: 0.06,
          uLens: [lx * d, ly * d, lr * d], uSep: 7 * d, uPass: pass, uDecay: decay, uSub: sub, uClr: clr,
        })
      }
      const labels = () => {
        const a = Math.round((mx - 0.5) * 2 * 6)
        const key = String(a)
        if (key === lastLabel) return
        lastLabel = key
        host.querySelectorAll('[data-plate-angle]').forEach((n) => { const b = n.getAttribute('data-plate-angle') === 'B'; n.textContent = `${b ? 'trail' : 'beam'} ${(b ? 15 : 45) + a}\u00b0` })
      }
      const seed = () => s.set({ uSeed: [0, 1, 2, 3, 4, 5].map((i) => th - i * 0.07) })

      const frame = (tick: number, ms: number) => {
        void ms
        const T = now() - t0
        calls++
        if (calls === 2 && !shown) { shown = true; el.setAttribute('data-gl', '') } // GL has drawn: Poster steps aside
        const swinging = T >= LOAD_MS.swing
        if (!grabbing && !held && swinging) { sim.step(1 / 15); th = sim.th }
        if (T >= LOAD_MS.b[1]) loadOff = loadOff > 0.5 ? loadOff * 0.55 : 0
        mx = lerp(mx, tx, 0.4); my = lerp(my, ty, 0.4)
        jolt = jolt > 0.5 ? jolt * 0.55 : 0
        smear = Math.abs(smear) > 0.5 ? smear * 0.8 : 0
        lr = lt > lr ? Math.min(lt, lr + lt / 4) : Math.max(lt, lr - 40) // opens in 4 ticks, closes in 3
        if (lr > 0 && lt > 0) { lx = lerp(lx, px, 0.5); ly = lerp(ly, py, 0.5) }
        if (clr > 0) clr = clr >= 1 ? 0 : clr + 0.25
        if (fine && T > nextBlip && performance.now() - lastMove > 3000 && document.hasFocus() && !held) { jolt = 7; nextBlip = T + 8000 + Math.random() * 3000 }
        if (!nextBlip) nextBlip = T + 9000
        const hold = held || (!swinging && !grabbing) // frozen photograph / fan holds until the swing starts
        push([plate(T, LOAD_MS.y), plate(T, LOAD_MS.b), plate(T, LOAD_MS.k)], hold ? 1 : 0.93, hold ? 0 : 0.004) // tuned: decay 0.88 -> 0.93
        labels()
        s.dirty()
        void tick
      }

      // ---- pointer ----
      const inHero = (e: PointerEvent) => { const r = rect(); return e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom }
      const interactive = (e: Event) => !!(e.target as Element).closest?.('a,button,input,textarea,select,[role=button]')
      const near = (x: number, y: number) => { const b = bobAt(); return Math.hypot(x - b.x, y - b.y) < GRAB * g.len * 0.1 }
      const angleAt = (x: number, y: number) => Math.atan2(x - g.px, y - g.py)
      const onMove = (e: PointerEvent) => {
        const r = rect(), x = e.clientX - r.left, y = e.clientY - r.top, inside = inHero(e)
        tx = Math.min(1, Math.max(0, x / r.width)); ty = Math.min(1, Math.max(0, y / r.height))
        px = x; py = y
        lastMove = performance.now()
        if (e.pointerType === 'touch') return
        if (grabbing) {
          th = Math.max(-1.2, Math.min(1.2, angleAt(x, y) + grabOff))
          sim.th = th
          samples.push({ t: performance.now(), th }); if (samples.length > 5) samples.shift()
          s.set({ uTh: th }); s.dirty() // 1:1: the K figure follows between ticks; the blue exposures print at the tick
        } else {
          if (lastX >= 0 && inside) smear = Math.max(-14, Math.min(14, smear + (e.clientX - lastX) * 0.35))
          if (fine && inside && !held) { if (!lt && !lr) { lx = x; ly = y } lt = 120 } else lt = 0
          host.style.cursor = fine && inside && near(x, y) ? 'grab' : ''
        }
        if (held) moved += Math.abs(e.movementX) + Math.abs(e.movementY)
        lastX = e.clientX
      }
      const onDown = (e: PointerEvent) => {
        if (!inHero(e) || interactive(e)) return
        const r = rect(), x = e.clientX - r.left, y = e.clientY - r.top
        if (e.pointerType === 'touch') { tap = { x: e.clientX, y: e.clientY, t: performance.now() }; return }
        if (near(x, y)) {
          grabbing = true; grabOff = th - angleAt(x, y); samples = [{ t: performance.now(), th }]; lt = 0
          host.style.cursor = 'grabbing'; e.preventDefault()
        } else { held = true; downAt = performance.now(); moved = 0; downX = x; downY = y; lt = 0 }
      }
      const onUp = (e: PointerEvent) => {
        if (grabbing) {
          grabbing = false
          const now = performance.now(), a = samples.slice(-4)
          let v = 0
          if (a.length > 1 && now - a[a.length - 1].t < 120) {
            for (let i = 1; i < a.length; i++) v += (a[i].th - a[i - 1].th) / Math.max(0.008, (a[i].t - a[i - 1].t) / 1000)
            v /= a.length - 1
          }
          sim.th = th; sim.w = Math.max(-5, Math.min(5, v))
          host.style.cursor = near(px, py) ? 'grab' : ''
        } else if (held) {
          held = false; jolt = 18
          if (performance.now() - downAt < 300 && moved < 6) clr = 0.25 // click on the empty sheet: new sheet, cleared top-down in 4 ticks
        } else if (tap && e.pointerType === 'touch') {
          if (performance.now() - tap.t < 250 && Math.hypot(e.clientX - tap.x, e.clientY - tap.y) < 10 && inHero(e)) {
            sim.kick((bobAt().x + rect().left > e.clientX ? 1 : -1) * 1.6)
          }
          tap = null
        }
        void downX; void downY
      }
      const calm = () => { lt = 0; tap = null }
      const lose = () => { if (grabbing || held) onUp(new PointerEvent('pointerup')); calm() }
      addEventListener('pointermove', onMove, { passive: true })
      addEventListener('pointerdown', onDown)
      addEventListener('pointerup', onUp); addEventListener('pointercancel', lose)
      addEventListener('blur', lose); addEventListener('scroll', calm, { passive: true })
      document.documentElement.addEventListener('pointerleave', calm)

      const fit = () => { const d = dpr(); const w = Math.round(W * d), hh = Math.round(H * d); if (canvas.width !== w) canvas.width = w; if (canvas.height !== hh) canvas.height = hh }
      fit()
      const s = mountSheet(canvas, 'hero', { dprCap: innerWidth < 768 ? 1.25 : 1.5, fallback: () => {}, frame })
      const draw0 = () => {
        const d = dpr(), f = frame0(g.amp)
        void d
        th = sim.th
        s.set({ uSeed: f.exposures.map((e) => e.th) })
        push([1, 1, 1], 0.93, 0.004)
        s.set({ uOff: [REST.x * dpr(), REST.y * dpr()], uA: 0, uLens: [0, 0, 0], uClr: 0 })
        s.dirty()
      }
      loadOff = reduce || bootT > 980 ? 0 : 26
      if (reduce) { draw0(); setTimeout(() => el.setAttribute('data-gl', ''), 200) } else {
        const f = frame0(g.amp); void f
        s.set({ uSeed: f.exposures.map((e) => e.th) })
        push([plate(bootT, LOAD_MS.y), plate(bootT, LOAD_MS.b), plate(bootT, LOAD_MS.k)], 1, 0)
        s.dirty(); s.animate(true)
      }
      const ro = new ResizeObserver(() => {
        measure(); fit()
        if (reduce) draw0()
        else { seed(); push([1, 1, 1], 0.93, 0.004); s.dirty() }
      })
      ro.observe(el)
      cleanup = () => {
        ro.disconnect(); s.destroy()
        removeEventListener('pointermove', onMove); removeEventListener('pointerdown', onDown); removeEventListener('pointerup', onUp)
        removeEventListener('pointercancel', lose); removeEventListener('blur', lose); removeEventListener('scroll', calm)
        document.documentElement.removeEventListener('pointerleave', calm); host.style.cursor = ''
      }
    }
    const ro0 = new ResizeObserver(measure)
    ro0.observe(el)
    return () => { dead = true; ro0.disconnect(); cleanup() }
  }, [])

  return (
    <div ref={wrap} className="hs" aria-hidden style={{ position: 'absolute', inset: 0, zIndex: 0, pointerEvents: 'none' }}>
      <Poster />
      <canvas ref={cv} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} />
    </div>
  )
}
