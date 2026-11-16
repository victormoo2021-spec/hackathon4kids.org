// The prism: a ring of glass bars refracting a warping gradient. Vanilla three, loaded as its own chunk.
// Passes: gradient -> rtBg | back-face normals -> rtBack | gradient + glass -> rtScene | bloom | composite.
import {
  BackSide, BufferAttribute, BufferGeometry, Group, GLSL3, HalfFloatType, LinearFilter, Mesh, PerspectiveCamera,
  RawShaderMaterial, Scene, UnsignedByteType, WebGLRenderer, WebGLRenderTarget, type IUniform,
} from 'three'
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js'
import { fx, type Glow } from '../store'
import { BACK_FRAG, BAR_VERT, BG_FRAG, BLUR_FRAG, BRIGHT_FRAG, COMPOSITE_FRAG, COPY_FRAG, FS_VERT, GLASS_FRAG } from './shaders'

// linear [dominant, accent]
const GLOW: Record<Glow, [number[], number[]]> = {
  purple: [[0.2, 0.107, 1], [1, 0.67, 0.02]],
  violet: [[0.42, 0.24, 1], [1, 0.5, 0.42]],
  gold: [[1, 0.67, 0.02], [0.2, 0.107, 1]],
}
const LEVELS = [1, 0.75, 0.5]
const FOV = 32
const N = 8
const damp = (dt: number, l: number) => 1 - Math.exp(-l * dt)
const clamp01 = (x: number) => Math.min(1, Math.max(0, x))
const ss = (x: number) => { const t = clamp01(x); return t * t * (3 - 2 * t) }
const mix = (a: number, b: number, t: number) => a + (b - a) * t

type U = Record<string, IUniform>

export function createPrism(canvas: HTMLCanvasElement, onFail: () => void): () => void {
  let renderer: WebGLRenderer
  try {
    renderer = new WebGLRenderer({ canvas, antialias: false, alpha: false, depth: false, stencil: false, powerPreference: 'high-performance' })
  } catch {
    onFail()
    return () => {}
  }
  renderer.setPixelRatio(1)
  const hdr = renderer.extensions.has('EXT_color_buffer_float') || renderer.extensions.has('EXT_color_buffer_half_float')
  const type = hdr ? HalfFloatType : UnsignedByteType
  const rt = (depth: boolean, t = type, samples = 0) =>
    new WebGLRenderTarget(2, 2, { type: t, depthBuffer: depth, minFilter: LinearFilter, magFilter: LinearFilter, samples })
  const rtBg = rt(false), rtBack = rt(true, UnsignedByteType), rtScene = rt(true, type, 4), rtA = rt(false), rtB = rt(false)

  const mqRm = matchMedia('(prefers-reduced-motion: reduce)')
  const isMobile = () => innerWidth < 900
  const backPass = !isMobile()

  const mat = (fragmentShader: string, uniforms: U, vertexShader = FS_VERT, extra = {}) =>
    new RawShaderMaterial({ glslVersion: GLSL3, vertexShader, fragmentShader, uniforms, depthTest: false, depthWrite: false, ...extra })

  const col = { a: { value: [...GLOW.purple[0]] }, b: { value: [...GLOW.purple[1]] } }
  const uT = { value: 0 }, uAsp = { value: 1 }, uRes = { value: [2, 2] }
  const bgU: U = { uT, uAsp, uR: { value: 0.3 }, uGlow: { value: 0 }, uC: { value: [0.5, 0.5] }, uColA: col.a, uColB: col.b }
  const glassShared: U = {
    tBg: { value: rtBg.texture }, tBack: { value: rtBack.texture }, uRes, uT, uAsp, uRefr: { value: 0.1 },
    uGlow: { value: 0 }, uSat: { value: 0 }, uSparkle: { value: 0 }, uColA: col.a, uColB: col.b,
  }
  const mBg = mat(BG_FRAG, bgU)
  const mCopy = mat(COPY_FRAG, { tMap: { value: rtBg.texture } })
  const mBright = mat(BRIGHT_FRAG, { tMap: { value: rtScene.texture } })
  const blurU: U = { tMap: { value: null }, uDir: { value: [0, 0] } }
  const mBlur = mat(BLUR_FRAG, blurU)
  const compU: U = { tMap: { value: rtScene.texture }, tBloom: { value: rtA.texture }, uT, uBloom: { value: 0.5 }, uAsp }
  const mComp = mat(COMPOSITE_FRAG, compU)
  const mBack = mat(BACK_FRAG, {}, BAR_VERT, { side: BackSide, depthTest: true, depthWrite: true })

  const tri = new BufferGeometry()
  tri.setAttribute('position', new BufferAttribute(new Float32Array([-1, -1, 0, 3, -1, 0, -1, 3, 0]), 3))
  const fsScene = new Scene()
  const fsQuad = new Mesh(tri, mBg)
  fsQuad.frustumCulled = false
  fsScene.add(fsQuad)

  const camera = new PerspectiveCamera(FOV, 1, 1, 10)
  const scene = new Scene()
  const backdrop = new Mesh(tri, mCopy)
  backdrop.frustumCulled = false
  backdrop.renderOrder = -1
  scene.add(backdrop)
  const ring = new Group()
  scene.add(ring)
  // planks, unit = ring radius
  const barGeo = new RoundedBoxGeometry(1, 0.14, 0.085, 5, 0.034)
  const bars = Array.from({ length: N }, (_, i) => {
    const m = mat(GLASS_FRAG, { ...glassShared, uVis: { value: 0 }, uSeed: { value: i * 1.7 } }, BAR_VERT, {
      depthTest: true, depthWrite: true, defines: backPass ? { BACK: 1 } : {},
    })
    const mesh = new Mesh(barGeo, m)
    mesh.visible = false
    ring.add(mesh)
    return { mesh, u: m.uniforms, x: 0, v: 0 }
  })

  const pass = (m: RawShaderMaterial, target: WebGLRenderTarget | null) => {
    fsQuad.material = m
    renderer.setRenderTarget(target)
    renderer.render(fsScene, camera)
  }

  const S = {
    t: 0, spin: 0, speed: fx.get().speed, glow: 0, sat: 0, sparkle: 0, burst: 0, wasSparkle: false,
    n: 5, tx: 0, ty: 0, px: 0, py: 0, dock: 0, arrived: false,
  }
  let level = 0, ema = 16, slow = 0, fast = 0, raf = 0, last = 0, lastDraw = 0, W = 0, H = 0
  let dirtyUntil = Infinity, mdirty = true, measuredAt = 0, lost = false, dead = false, ready = false
  const mark = () => { mdirty = true; dirtyUntil = performance.now() + 1500 }
  const unsub = fx.subscribe(mark)
  const onMove = (e: PointerEvent) => {
    if (e.pointerType === 'touch') return
    S.px = (e.clientX / innerWidth) * 2 - 1
    S.py = (e.clientY / innerHeight) * 2 - 1
    if (fx.get().followMouse) dirtyUntil = performance.now() + 1500
  }
  type Cached = { el: Element | null; sel: string }
  const cEl = (c: Cached) => (c.el?.isConnected ? c.el : (c.el = document.querySelector(c.sel)))
  const cOrigin: Cached = { el: null, sel: '[data-fx-origin]' }
  const cHero: Cached = { el: null, sel: '.hero' }
  const cShield: Cached = { el: null, sel: '[data-fx-shield]' }
  const cTitle: Cached = { el: null, sel: '#join-title' }
  const cFoot: Cached = { el: null, sel: 'footer' }
  const cEnd: Cached = { el: null, sel: '[data-streak-end] :is(a, button)' }
  const rect = (c: Cached) => {
    const r = cEl(c)?.getBoundingClientRect()
    return r && r.width ? r : null
  }
  let rOrigin: DOMRect | null = null, rEnd: DOMRect | null = null, rShield: DOMRect | null = null, rTitle: DOMRect | null = null, rFoot: DOMRect | null = null, heroBottom = 0, hasHero = false

  const resize = (vw: number, vh: number, scale: number) => {
    // phones: scale is relative to the real DPR (0.5 x 2..3), otherwise half of a clamped 1.5 aliases the bar edges
    const dpr = Math.min(devicePixelRatio || 1, scale === 0.5 && isMobile() ? 3 : 1.5)
    const w = Math.max(2, Math.round(vw * dpr * scale)), h = Math.max(2, Math.round(vh * dpr * scale))
    if (w === W && h === H) return
    W = w; H = h
    renderer.setSize(W, H, false)
    const part = (x: number, d: number) => Math.max(2, Math.round(x / d))
    rtBg.setSize(part(W, 2), part(H, 2))
    rtBack.setSize(part(W, 2), part(H, 2))
    rtScene.setSize(W, H)
    rtA.setSize(part(W, 4), part(H, 4))
    rtB.setSize(part(W, 4), part(H, 4))
    uRes.value = [W, H]
  }

  const frame = (now: number) => {
    raf = 0
    if (document.hidden || lost || dead) return
    raf = requestAnimationFrame(frame)
    if (!ready) return
    const f = fx.get()
    const rm = mqRm.matches
    const vw = innerWidth, vh = innerHeight
    const mobile = isMobile()
    if (!last) { last = lastDraw = now; return }
    const delta = now - last
    last = now

    if (!measuredAt) measuredAt = now
    if (mdirty || now - measuredAt < 4000) {
      mdirty = false
      rOrigin = rect(cOrigin)
      const hero = cEl(cHero) ?? cEl(cOrigin)?.closest('section') ?? null
      hasHero = !!hero
      heroBottom = hero ? hero.getBoundingClientRect().bottom : 0
      rEnd = rect(cEnd)
      rShield = rect(cShield)
      rTitle = rect(cTitle)
      rFoot = rect(cFoot)
    }
    // 0 = hero (ring frames the laptop), 1 = page (ring rides the right gutter)
    const page = rOrigin && hasHero ? ss((0.92 * vh - heroBottom) / (0.6 * vh)) : 1
    const lit = f.glow !== null || page > 0.5
    const want = Math.min(f.streaks || (page > 0.5 ? 5 : 0), mobile ? 4 : N)
    const spinning = lit && want > 0 && !rm && f.intensity > 0
    if (!spinning && now > dirtyUntil) return
    // the hero runs at display rate; the gutter ring is a slow object, 30fps is plenty
    const cadence = page > 0.5 ? 30 : 0
    if (cadence && now - lastDraw < 1000 / cadence - 3) return
    const dt = Math.min(0.1, (now - lastDraw) / 1000)
    lastDraw = now
    S.t += dt

    if (!cadence) {
      ema += (delta - ema) * 0.1
      if (ema > 20) { fast = 0; if (++slow > 30 && level < 2) { level++; slow = 0; ema = 16 } }
      else if (ema < 12) { slow = 0; if (++fast > 240 && level > 0) { level--; fast = 0 } }
      else { slow = 0; fast = 0 }
    }
    resize(vw, vh, mobile ? 0.5 : LEVELS[level])

    // --- state smoothing ---
    S.glow += ((lit ? 1 : 0.22) - S.glow) * damp(dt, 3)
    S.sat += ((lit ? 1 : 0) - S.sat) * damp(dt, 3)
    const [a, b] = GLOW[f.glow ?? 'purple'], kc = damp(dt, 5)
    for (let i = 0; i < 3; i++) {
      col.a.value[i] += (a[i] - col.a.value[i]) * kc
      col.b.value[i] += (b[i] - col.b.value[i]) * kc
    }
    S.speed += (f.speed - S.speed) * damp(dt, 4)
    if (!rm) S.spin += dt * S.speed * mix(0.11, 0.06, page)
    S.sparkle += ((f.sparkle ? 1 : 0) - S.sparkle) * damp(dt, 6)
    if (f.sparkle && !S.wasSparkle && !rm) S.burst = 1
    S.wasSparkle = f.sparkle
    S.burst = Math.max(0, S.burst - dt / 0.5)
    S.n += (Math.max(want, 3) - S.n) * (rm ? 1 : damp(dt, 5))

    // --- placement (CSS px), read straight from the DOM rects so the ring never lags the scroll ---
    const endIn = !mobile && !!rEnd && rEnd.top < vh * 0.82 && rEnd.bottom > vh * 0.08
    S.dock = rm ? (endIn ? 1 : 0) : S.dock + ((endIn ? 1 : 0) - S.dock) * damp(dt, 3.2)
    if (!S.arrived && (S.dock > 0.9 || (mobile && rEnd && rEnd.top < vh * 0.9 && rEnd.bottom > 0))) {
      S.arrived = true
      S.burst = rm ? 0 : 1
      dispatchEvent(new CustomEvent('fx:arrive'))
    }
    const gR = (mobile ? 0.16 : 0.175) * vh
    let cx = vw - (mobile ? gR * 0.15 : gR * 0.55 + 20), cy = vh * 0.5, R = gR
    if (rOrigin && page < 1) {
      const ox = rOrigin.left + rOrigin.width / 2
      let hR = Math.min(rOrigin.width * 0.9, vh * 0.4, vw * (mobile ? 0.62 : 0.5))
      // bars stay right of the hero copy column (tilted toward the pointer a bar's far end reaches ~1.38 R)
      if (!mobile && rShield) hR = Math.max(rOrigin.width * 0.55, Math.min(hR, (ox - rShield.right - 24) / 1.38))
      cx = mix(ox, cx, page)
      cy = mix(rOrigin.top + rOrigin.height / 2, cy, page)
      R = mix(hR, R, page)
    }
    // dock: a flattened halo hugging the button, below the heading and clear of the footer
    const d = ss(S.dock)
    let ey = 1
    if (rEnd && d > 0) {
      const dR = rEnd.width * 0.75
      let dy = rEnd.top + rEnd.height / 2
      let ry = dR * 0.5
      if (rTitle) ry = Math.min(ry, dy - rTitle.bottom - dR * 0.12)
      ry = Math.max(ry, rEnd.height / 2 + 10)
      if (rFoot) dy = Math.min(dy, rFoot.top - 24 - ry - dR * 0.1)
      cx = mix(cx, rEnd.left + rEnd.width / 2, d)
      cy = mix(cy, dy, d)
      R = mix(R, dR, d)
      ey = mix(1, ry / dR, d)
    }
    const fade = mobile ? mix(0.8, 0.3, page) : mix(1, 0.72, page)
    const gain = S.glow * f.intensity * fade

    const dist = vh / 2 / Math.tan((FOV * Math.PI) / 360)
    camera.aspect = vw / vh
    camera.near = dist * 0.2
    camera.far = dist * 3
    camera.position.z = dist
    camera.updateProjectionMatrix()
    ring.position.set(cx - vw / 2, vh / 2 - cy, 0)
    ring.scale.setScalar(R)
    const follow = f.followMouse ? (rm ? 0.06 : 0.25) : 0
    const kt = rm ? 1 : damp(dt, 4)
    S.tx += (S.py * follow - S.tx) * kt
    S.ty += (S.px * follow - S.ty) * kt
    ring.rotation.set(mix(-0.3, 0, d) + S.tx * (1 - d), mix(0.12, 0, d) + S.ty * (1 - d), 0)

    let any = false
    for (let i = 0; i < N; i++) {
      const bar = bars[i]
      const tgt = i < want ? 1 : 0
      if (rm) bar.x += (tgt - bar.x) * damp(dt, 8)
      else {
        // ~400ms spring, a touch under-damped so a new bar lands with a small settle
        bar.v += ((tgt - bar.x) * 190 - bar.v * 19) * dt
        bar.x += bar.v * dt
      }
      const on = bar.x > 0.004
      bar.mesh.visible = on
      if (!on) continue
      any = true
      const ang = (i / S.n) * Math.PI * 2 + S.spin + Math.PI / 2
      const ca = Math.cos(ang), sa = Math.sin(ang)
      bar.mesh.position.set(ca, sa * ey, 0)
      bar.mesh.rotation.set(S.spin * 1.6 + i * 0.7, mix(0.42, 0.06, d), Math.atan2(ey * ca, -sa), 'ZYX')
      // bars span most of the chord between neighbours, so any count still closes into a ring
      const k = Math.max(0.001, mix(0.6, 1, bar.x))
      bar.mesh.scale.set(k * Math.min(1.5, 2 * Math.sin(Math.PI / S.n) * 0.94) * Math.hypot(sa, ey * ca), k * mix(1, 0.6, d), k * mix(1, 0.6, d))
      bar.u.uVis.value = bar.x
    }

    uT.value = S.t
    uAsp.value = vw / vh
    bgU.uC.value = [cx / vw, 1 - cy / vh]
    bgU.uR.value = Math.min(R / vh, 0.42)
    bgU.uGlow.value = gain * (lit ? 1 : 0.15) * mix(1, 0.6, d)
    glassShared.uRefr.value = (R / vh) * 0.8
    glassShared.uGlow.value = gain
    glassShared.uSat.value = S.sat
    glassShared.uSparkle.value = rm ? S.sparkle * 0.6 : S.sparkle * (1 + 1.5 * S.burst)
    compU.uBloom.value = (0.4 + 0.3 * S.sparkle + 0.8 * S.burst) * (0.3 + 0.7 * S.sat)

    // --- passes ---
    pass(mBg, rtBg)
    if (backPass && any) {
      backdrop.visible = false
      scene.overrideMaterial = mBack
      renderer.setClearColor(0, 0)
      renderer.setRenderTarget(rtBack)
      renderer.render(scene, camera)
      scene.overrideMaterial = null
      backdrop.visible = true
    }
    renderer.setRenderTarget(rtScene)
    renderer.render(scene, camera)
    if (any) {
      pass(mBright, rtA)
      for (const step of [1, 2]) {
        blurU.tMap.value = rtA.texture
        blurU.uDir.value = [step / rtA.width, 0]
        pass(mBlur, rtB)
        blurU.tMap.value = rtB.texture
        blurU.uDir.value = [0, step / rtA.height]
        pass(mBlur, rtA)
      }
    } else {
      renderer.setRenderTarget(rtA)
      renderer.clear()
    }
    pass(mComp, null)
  }

  const start = () => { if (!raf && !document.hidden && !dead) { last = 0; mark(); raf = requestAnimationFrame(frame) } }
  const onVis = () => (document.hidden ? (cancelAnimationFrame(raf), (raf = 0)) : start())
  const onLost = (e: Event) => { e.preventDefault(); lost = true; cancelAnimationFrame(raf); raf = 0 }
  const onRestored = () => { lost = false; W = H = 0; start() }
  addEventListener('pointermove', onMove, { passive: true })
  addEventListener('scroll', mark, { passive: true })
  addEventListener('resize', mark)
  // entrance / laptop transitions move the measured nodes without scroll or resize
  addEventListener('transitionend', mark, true)
  addEventListener('animationend', mark, true)
  document.addEventListener('visibilitychange', onVis)
  canvas.addEventListener('webglcontextlost', onLost)
  canvas.addEventListener('webglcontextrestored', onRestored)

  // compile every program off the main thread (KHR_parallel_shader_compile) before the first frame
  resize(innerWidth, innerHeight, isMobile() ? 0.5 : 1)
  const warm = new Scene()
  ;[mBg, mBright, mBlur, mComp, mCopy].forEach((m) => {
    const q = new Mesh(tri, m)
    q.frustumCulled = false
    warm.add(q)
  })
  const wb = new Mesh(barGeo, bars[0].mesh.material), wk = new Mesh(barGeo, mBack)
  wb.frustumCulled = wk.frustumCulled = false
  warm.add(wb, wk)
  renderer
    .compileAsync(warm, camera)
    .then(() => { ready = true; mark() })
    .catch((e) => { console.error(e); if (!dead) onFail() })
  start()

  return () => {
    dead = true
    cancelAnimationFrame(raf)
    unsub()
    removeEventListener('pointermove', onMove)
    removeEventListener('scroll', mark)
    removeEventListener('resize', mark)
    removeEventListener('transitionend', mark, true)
    removeEventListener('animationend', mark, true)
    document.removeEventListener('visibilitychange', onVis)
    canvas.removeEventListener('webglcontextlost', onLost)
    canvas.removeEventListener('webglcontextrestored', onRestored)
    ;[rtBg, rtBack, rtScene, rtA, rtB].forEach((t) => t.dispose())
    ;[mBg, mCopy, mBright, mBlur, mComp, mBack, ...bars.map((x) => x.mesh.material)].forEach((m) => m.dispose())
    barGeo.dispose()
    tri.dispose()
    renderer.dispose()
    renderer.forceContextLoss()
  }
}
