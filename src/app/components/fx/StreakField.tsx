'use client'

import { useEffect, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'
import { fx, type Glow } from './store'
import { FRAG, VERT } from './shader'
import { measureGuide, type GuidePt } from './anchors'

// Linear colours (spec §1): [A, B]
const GLOW: Record<Glow, [number[], number[]]> = {
  purple: [[0.2, 0.11, 1], [0.39, 0.26, 1]],
  violet: [[0.39, 0.26, 1], [0.7, 0.45, 1]],
  gold: [[1, 0.67, 0.02], [0.2, 0.11, 1]],
}
const LEVELS = [1, 0.75, 0.5]
const HEAD_FRAC = 0.62
const eo = (t: number) => 1 - (1 - t) ** 3
const damp = (dt: number, l: number) => 1 - Math.exp(-l * dt)

declare global {
  interface Window {
    __fx?: typeof fx
  }
}

export default function StreakField() {
  const ref = useRef<HTMLCanvasElement>(null)
  const [fallback, setFallback] = useState(false)
  const path = usePathname()
  const guide = useRef<GuidePt[]>([])
  const remeasure = useRef<() => void>(() => {})

  // page-mode anchors: measured on resize / fonts / route change, never per frame
  useEffect(() => {
    let t = 0
    const run = () => {
      cancelAnimationFrame(t)
      t = requestAnimationFrame(() => {
        guide.current = measureGuide(window.innerWidth)
      })
    }
    remeasure.current = run
    const ro = new ResizeObserver(run)
    ro.observe(document.body)
    document.fonts?.ready.then(run)
    run()
    const late = window.setTimeout(run, 600) // reveal/entrance transforms settle
    return () => {
      ro.disconnect()
      clearTimeout(late)
      cancelAnimationFrame(t)
    }
  }, [path])

  useEffect(() => {
    window.__fx = fx
    // compile the shader after load + idle, so it never competes with the hero entrance (it starts dark anyway)
    const boot = (): (() => void) | void => {
    const canvas = ref.current
    if (!canvas) return
    let gl = canvas.getContext('webgl2', { antialias: false, alpha: false, powerPreference: 'high-performance' })
    if (!gl) {
      setFallback(true)
      return
    }

    // software GL (no GPU: SwiftShader, llvmpipe) gets a low tier so it never starves the main thread
    const dbg = gl.getExtension('WEBGL_debug_renderer_info')
    const soft = /swiftshader|llvmpipe|software/i.test(dbg ? String(gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL)) : '')
    const mqRm = matchMedia('(prefers-reduced-motion: reduce)')
    const mqCoarse = matchMedia('(pointer: coarse)')
    const names = ['uRes', 'uOrigin', 'uScreenHalf', 'uMouse', 'uShield', 'uShield2', 'uColA', 'uColB', 'uPts', 'uVis', 'uT', 'uFlow', 'uGlow', 'uIntensity', 'uPage', 'uSparkle', 'uBend', 'uHeadY', 'uCalm', 'uStatic', 'uFlare', 'uMax', 'uParallax']
    let loc: Record<string, WebGLUniformLocation | null> = {}

    const par = gl.getExtension('KHR_parallel_shader_compile')
    let prog: WebGLProgram | null = null
    let shaders: WebGLShader[] = []
    const init = () => {
      const g = gl!
      const sh = (type: number, src: string) => {
        const s = g.createShader(type)!
        g.shaderSource(s, src)
        g.compileShader(s)
        return s
      }
      prog = g.createProgram()!
      shaders = [sh(g.VERTEX_SHADER, VERT), sh(g.FRAGMENT_SHADER, FRAG)]
      shaders.forEach((s) => g.attachShader(prog!, s))
      g.bindAttribLocation(prog, 0, 'a')
      g.linkProgram(prog)
      const buf = g.createBuffer()
      g.bindBuffer(g.ARRAY_BUFFER, buf)
      g.bufferData(g.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), g.STATIC_DRAW)
      g.enableVertexAttribArray(0)
      g.vertexAttribPointer(0, 2, g.FLOAT, false, 0, 0)
    }
    // status queries force a synchronous wait, so they only run once the driver reports completion
    const finish = () => {
      const g = gl!
      if (!g.getProgramParameter(prog!, g.LINK_STATUS)) {
        const log = shaders.map((s) => g.getShaderInfoLog(s)).join('') + (g.getProgramInfoLog(prog!) ?? '')
        throw new Error(log || 'link')
      }
      g.useProgram(prog)
      loc = Object.fromEntries(names.map((n) => [n, g.getUniformLocation(prog!, n)]))
    }

    const S = {
      glowP: 0, colA: [...GLOW.purple[0]], colB: [...GLOW.purple[1]],
      vis: new Array(8).fill(0) as number[], flow: 0, speed: fx.get().speed,
      sparkle: 0, burst: 0, wasSparkle: false, bend: 0, mouse: [5, 5], pointer: [5, 5],
      page: 0, flare: 0, arrived: false, t: 0,
    }
    let level = 0, dirty = true, last = 0, lastDraw = 0, ema = 16, slow = 0, fast = 0, raf = 0
    let W = 0, H = 0, cssW = 0, cssH = 0, lostCtx = false
    let ptr = false
    const pts = new Float32Array(32)
    const vis = new Float32Array(8)
    let mdirty = true
    let measuredAt = 0
    const mark = () => { dirty = true; mdirty = true }
    const unsub = fx.subscribe(mark)
    type Cached = { el: Element | null; sel: string }
    const cEl = (c: Cached) => (c.el?.isConnected ? c.el : (c.el = document.querySelector(c.sel)))
    const cOrigin: Cached = { el: null, sel: '[data-fx-origin]' }
    const cHero: Cached = { el: null, sel: '.hero' }
    const cShield: Cached = { el: null, sel: '[data-fx-shield]' }
    const cShield2: Cached = { el: null, sel: '[data-fx-shield-2]' }
    const cEnd: Cached = { el: null, sel: '[data-streak-end]' }
    type RP = ReturnType<typeof rectP>
    let rOrigin: RP = null, rShield: RP = null, rShield2: RP = null, heroBottom = 0, hasHero = false

    const onMove = (e: PointerEvent) => {
      if (e.pointerType === 'touch') return
      ptr = true
      if (fx.get().followMouse) dirty = true
      S.pointer = [(e.clientX - innerWidth / 2) / innerHeight, (innerHeight / 2 - e.clientY) / innerHeight]
    }
    addEventListener('pointermove', onMove, { passive: true })
    addEventListener('scroll', mark, { passive: true })
    addEventListener('resize', mark)
    // entrance / laptop transitions move measured nodes without scroll or resize
    addEventListener('transitionend', mark, true)
    addEventListener('animationend', mark, true)

    function rectP(c: Cached, vw: number, vh: number) {
      const r = cEl(c)?.getBoundingClientRect()
      if (!r || !r.width) return null
      return { cx: (r.left + r.width / 2 - vw / 2) / vh, cy: (vh / 2 - (r.top + r.height / 2)) / vh, hx: r.width / 2 / vh, hy: r.height / 2 / vh, bottom: r.bottom }
    }

    const frame = (now: number) => {
      raf = 0
      if (document.hidden || lostCtx) return
      raf = requestAnimationFrame(frame)
      const g = gl!
      const rm = mqRm.matches
      const vw = innerWidth, vh = innerHeight
      const mobile = mqCoarse.matches || vw < 900
      const f = fx.get()
      if (!last) { last = now; return }
      const dtRaw = Math.min(0.1, (now - last) / 1000)
      const delta = now - last

      // re-measure only when something moved (scroll/resize/store/transition) and for the first seconds (entrances)
      if (!measuredAt) measuredAt = now
      if (mdirty || now - measuredAt < 4000) {
        mdirty = false
        rOrigin = rectP(cOrigin, vw, vh)
        const hero = cEl(cHero) ?? cEl(cOrigin)?.closest('section') ?? null
        hasHero = !!hero
        heroBottom = hero ? hero.getBoundingClientRect().bottom : 0
        rShield = rectP(cShield, vw, vh)
        rShield2 = rectP(cShield2, vw, vh)
      }
      const origin = rOrigin
      const auto = !origin || (hasHero ? heroBottom < 0 : false)
      const pageTarget = Math.max(f.pageMode, auto ? 1 : 0)
      const glowTarget = f.glow !== null || pageTarget > 0.5 ? 1 : 0
      const busy = glowTarget > 0 || S.glowP > 0
      if (!busy && !dirty) { last = now; return }

      // 30fps in page mode, 15fps on software GL
      const cadence = soft ? 15 : S.page > 0.5 ? 30 : 0
      if (cadence && now - lastDraw < 1000 / cadence - 3) return
      const dt = Math.min(0.1, (now - lastDraw) / 1000 || dtRaw)
      lastDraw = now
      last = now
      S.t += dt

      // adaptive quality from frame time (only meaningful at full cadence)
      if (!cadence) {
        ema += (delta - ema) * 0.1
        if (ema > 20) { fast = 0; if (++slow > 30 && level < 2) { level++; slow = 0; ema = 16 } }
        else if (ema < 12 && !mobile) { slow = 0; if (++fast > 120 && level > 0) { level--; fast = 0 } }
        else { slow = 0; fast = 0 }
      } else if (delta > 45 && ++slow > 30 && level < 2) { level++; slow = 0 }
      const scale = soft ? 0.25 : mobile ? 0.5 : Math.min(LEVELS[level], S.page > 0.5 ? 0.75 : 1)
      const dpr = Math.min(devicePixelRatio || 1, 1.5)
      const nw = Math.max(2, Math.round(vw * dpr * scale)), nh = Math.max(2, Math.round(vh * dpr * scale))
      if (nw !== W || nh !== H) {
        W = canvas.width = nw
        H = canvas.height = nh
        g.viewport(0, 0, W, H)
      }
      cssW = vw; cssH = vh

      // --- smoothing ---
      S.glowP = Math.min(1, Math.max(0, S.glowP + (glowTarget ? dt / 0.9 : -dt / 0.5)))
      if (f.glow) {
        const [a, b] = GLOW[f.glow], k = damp(dt, 6)
        for (let i = 0; i < 3; i++) { S.colA[i] += (a[i] - S.colA[i]) * k; S.colB[i] += (b[i] - S.colB[i]) * k }
      }
      const max = mobile ? 4 : 8
      const want = Math.min(f.streaks, max)
      const up = rm ? dt / 0.6 : dt / 0.65
      for (let i = 0; i < 8; i++) {
        if (i < want) {
          if (rm || i === 0 || S.vis[i - 1] >= 0.215) S.vis[i] = Math.min(1, S.vis[i] + up)
        } else S.vis[i] = Math.max(0, S.vis[i] - dt / 0.4)
        vis[i] = rm ? S.vis[i] : eo(S.vis[i])
      }
      S.speed += (f.speed - S.speed) * damp(dt, 4)
      S.flow += dt * S.speed * 0.35 * (rm ? 0.15 : 1)
      S.sparkle = Math.min(1, Math.max(0, S.sparkle + (f.sparkle ? dt / 0.3 : -dt / 0.3)))
      if (f.sparkle && !S.wasSparkle && !rm) S.burst = 1
      S.wasSparkle = f.sparkle
      S.burst = Math.max(0, S.burst - dt / 0.4)
      S.bend = Math.min(1, Math.max(0, S.bend + (f.followMouse && !rm ? dt / 0.4 : -dt / 0.4)))
      S.page += (pageTarget - S.page) * damp(dt, 8)
      if (Math.abs(pageTarget - S.page) < 0.002) S.page = pageTarget
      S.flare = Math.max(0, S.flare - dt / 0.5)

      // pointer: real pointer, or a slow Lissajous on touch devices
      const asp = vw / vh
      const tgt = ptr && !mqCoarse.matches ? S.pointer : f.followMouse ? [Math.sin(S.t * 0.31) * 0.4 * asp, Math.cos(S.t * 0.23) * 0.28] : [5, 5]
      const km = 1 - 0.92 ** (dt * 60)
      S.mouse[0] += (tgt[0] - S.mouse[0]) * km
      S.mouse[1] += (tgt[1] - S.mouse[1]) * km

      // --- DOM-derived uniforms ---
      const shield = rShield
      const shield2 = rShield2

      // guide window (8 points around the head), converted to p-space
      const gp = guide.current
      let headY = -9, hasGuide = false
      pts.fill(0)
      if (gp.length) {
        hasGuide = true
        const sy = scrollY
        const headDoc = sy + HEAD_FRAC * vh
        let c = gp.findIndex((p) => p.y >= headDoc)
        if (c < 0) c = gp.length
        const start = Math.max(0, Math.min(c - 4, gp.length - 8))
        for (let k = 0; k < 8; k++) {
          const p = gp[Math.min(start + k, gp.length - 1)]
          const pad = start + k >= gp.length ? start + k - gp.length + 1 : 0
          pts.set([(p.x - vw / 2) / vh, (vh / 2 - (p.y - sy)) / vh - pad * 0.002, p.w, p.b], k * 4)
        }
        const end = cEl(cEnd) ? gp[gp.length - 1] : null
        const endY = end ? (vh / 2 - (end.y - sy)) / vh : -9
        const headLine = 0.5 - HEAD_FRAC
        headY = rm ? endY : Math.max(headLine, endY)
        if (end && S.page > 0.5 && !S.arrived && (rm ? endY > -0.45 : endY >= headLine)) {
          S.arrived = true
          S.flare = 1
          dispatchEvent(new CustomEvent('fx:arrive'))
        }
      }

      g.uniform2f(loc.uRes, W, H)
      g.uniform2f(loc.uOrigin, origin ? origin.cx : 9, origin ? origin.cy : 9)
      g.uniform2f(loc.uScreenHalf, origin ? origin.hx : 0.01, origin ? origin.hy : 0.01)
      g.uniform4f(loc.uShield, shield ? shield.cx : 9, shield ? shield.cy : 9, shield ? shield.hx : 0, shield ? shield.hy : 0)
      g.uniform4f(loc.uShield2, shield2 ? shield2.cx : 9, shield2 ? shield2.cy : 9, shield2 ? shield2.hx : 0, shield2 ? shield2.hy : 0)
      g.uniform1f(loc.uParallax, rm || mobile ? 0 : scrollY * 0.0003)
      g.uniform2f(loc.uMouse, S.mouse[0], S.mouse[1])
      g.uniform3f(loc.uColA, S.colA[0], S.colA[1], S.colA[2])
      g.uniform3f(loc.uColB, S.colB[0], S.colB[1], S.colB[2])
      g.uniform4fv(loc.uPts, pts)
      g.uniform1fv(loc.uVis, vis)
      g.uniform1f(loc.uT, S.t)
      g.uniform1f(loc.uFlow, S.flow)
      g.uniform1f(loc.uGlow, eo(S.glowP))
      g.uniform1f(loc.uIntensity, f.intensity)
      g.uniform1f(loc.uPage, hasGuide ? S.page : 0)
      g.uniform1f(loc.uSparkle, rm ? S.sparkle : S.sparkle * (1 + 2 * S.burst))
      g.uniform1f(loc.uBend, S.bend)
      g.uniform1f(loc.uHeadY, headY)
      g.uniform1f(loc.uCalm, rm ? 1 : 0)
      g.uniform1f(loc.uStatic, rm ? 1 : 0)
      g.uniform1f(loc.uFlare, S.flare)
      g.uniform1f(loc.uMax, max)
      g.drawArrays(g.TRIANGLES, 0, 3)

      // one more frame is owed while anything is still easing
      const moving = glowTarget > 0 || S.glowP > 0 || S.page !== pageTarget
      dirty = moving
      void cssW; void cssH
    }

    const start = () => { if (!raf && !document.hidden) { last = 0; raf = requestAnimationFrame(frame) } }
    const onVis = () => (document.hidden ? (cancelAnimationFrame(raf), (raf = 0)) : start())
    const onLost = (e: Event) => { e.preventDefault(); lostCtx = true; cancelAnimationFrame(raf); raf = 0 }
    const onRestored = () => {
      try { init(); lostCtx = false; W = H = 0; dirty = mdirty = true; whenReady(start) } catch { setFallback(true) }
    }
    let dead = false
    const whenReady = (go: () => void) => {
      const poll = () => {
        if (dead) return
        try {
          if (par && !gl!.getProgramParameter(prog!, par.COMPLETION_STATUS_KHR)) return void setTimeout(poll, 16)
          finish()
        } catch (e) {
          console.error(e)
          setFallback(true)
          return
        }
        go()
      }
      poll()
    }
    const launch = () => {
      try { init() } catch (e) { console.error(e); setFallback(true); return }
      whenReady(start)
    }
    const intents = ['scroll', 'pointerdown', 'keydown', 'wheel', 'touchstart']
    const onIntent = () => { intents.forEach((t) => removeEventListener(t, onIntent)); launch() }
    canvas.addEventListener('webglcontextlost', onLost)
    canvas.addEventListener('webglcontextrestored', onRestored)
    document.addEventListener('visibilitychange', onVis)
    // software GL: compile only after the first sign of life, so a never-interacting visitor pays nothing
    if (soft) intents.forEach((t) => addEventListener(t, onIntent, { passive: true }))
    else launch()

    return () => {
      dead = true
      intents.forEach((t) => removeEventListener(t, onIntent))
      removeEventListener('transitionend', mark, true)
      removeEventListener('animationend', mark, true)
      cancelAnimationFrame(raf)
      unsub()
      removeEventListener('pointermove', onMove)
      removeEventListener('scroll', mark)
      removeEventListener('resize', mark)
      document.removeEventListener('visibilitychange', onVis)
      canvas.removeEventListener('webglcontextlost', onLost)
      canvas.removeEventListener('webglcontextrestored', onRestored)
      gl?.getExtension('WEBGL_lose_context')?.loseContext()
      gl = null
    }
    }
    let stop: (() => void) | void
    let idle = 0
    const go = () => { idle = (window.requestIdleCallback ?? setTimeout)(() => { stop = boot() }, { timeout: 1500 }) as number }
    if (document.readyState === 'complete') go()
    else addEventListener('load', go, { once: true })
    return () => {
      removeEventListener('load', go)
      ;(window.cancelIdleCallback ?? clearTimeout)(idle)
      stop?.()
    }
  }, [])

  const style = { position: 'fixed', inset: 0, zIndex: -1, pointerEvents: 'none', background: '#0a0710', width: '100%', height: '100%' } as const
  return fallback ? (
    <div
      aria-hidden
      style={{ ...style, background: 'radial-gradient(60% 50% at 75% 35%, rgb(99 70 255 / .22), transparent 70%), #0a0710' }}
    />
  ) : (
    <canvas ref={ref} aria-hidden style={style} />
  )
}
