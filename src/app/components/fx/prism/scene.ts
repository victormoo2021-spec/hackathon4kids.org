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

// init is cut into idle slices so no single task is long (it matters on phones)
const idle = () => new Promise<void>((r) => (window.requestIdleCallback ?? setTimeout)(() => r(), { timeout: 400 }))

export async function createPrism(canvas: HTMLCanvasElement, onFail: () => void, onReady: () => void): Promise<() => void> {
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

  await idle()

  const mqRm = matchMedia('(prefers-reduced-motion: reduce)')
  const isMobile = () => innerWidth < 900

  const mat = (fragmentShader: string, uniforms: U, vertexShader = FS_VERT, extra = {}) =>
    new RawShaderMaterial({ glslVersion: GLSL3, vertexShader, fragmentShader, uniforms, depthTest: false, depthWrite: false, ...extra })

  const col = { a: { value: [...GLOW.purple[0]] }, b: { value: [...GLOW.purple[1]] } }
  const cA = [...GLOW.purple[0]], cB = [...GLOW.purple[1]]
  const uT = { value: 0 }, uAsp = { value: 1 }, uRes = { value: [2, 2] }
  const bgU: U = { uT, uAsp, uR: { value: 0.3 }, uGlow: { value: 0 }, uC: { value: [0.5, 0.5] }, uColA: col.a, uColB: col.b, uPage: { value: 0 }, uScroll: { value: 0 }, uF: { value: [0.5, 0.5, 0] } }
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

  await idle()

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
      depthTest: true, depthWrite: true,
    })
    const mesh = new Mesh(barGeo, m)
    mesh.visible = false
    ring.add(mesh)
    return { mesh, u: m.uniforms, x: 0, v: 0 }
  })

  await idle()

  const pass = (m: RawShaderMaterial, target: WebGLRenderTarget | null) => {
    fsQuad.material = m
    renderer.setRenderTarget(target)
    renderer.render(fsScene, camera)
  }

  const S = {
    t: 0, spin: 0, speed: fx.get().speed, glow: 0, sat: 0, sparkle: 0, burst: 0, wasSparkle: false,
    n: 5, tx: 0, ty: 0, px: 0, py: 0, dock: 0, arrived: false,
    // one-shot responses to a typed line / arrival, each 1 -> 0
    gx: -1, textR: 0, textAt: 0, pulse: 0, kick: 0, pop: 0, arr: 0, hover: 0, hoverT: 0, hasPtr: false, lastGlow: fx.get().glow, lastSpeed: fx.get().speed, shown: false,
  }
  let level = 0, ema = 16, slow = 0, fast = 0, raf = 0, timer = 0, wasBusy = false, last = 0, lastDraw = 0, W = 0, H = 0
  let dirtyUntil = 0, mdirty = true, measuredAt = 0, lost = false, dead = false, ready = false
  // anything that changes the picture calls wake(): display rate for a moment, and the loop restarts if it had stopped
  const wake = () => { dirtyUntil = performance.now() + 1500; start() }
  let mdirtyText = true
  const mark = () => { mdirty = mdirtyText = true; wake() }
  const unsub = fx.subscribe(mark)
  const onMove = (e: PointerEvent) => {
    if (e.pointerType === 'touch') return
    S.px = (e.clientX / innerWidth) * 2 - 1
    S.py = (e.clientY / innerHeight) * 2 - 1
    S.hasPtr = true
    const over = (e.target as Element | null)?.closest?.('[data-streak-end] a') ? 1 : 0
    if (fx.get().followMouse || over !== S.hoverT) wake()
    S.hoverT = over
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
    // phones are small: full DPR (up to 2) keeps the bar edges clean
    const dpr = Math.min(devicePixelRatio || 1, isMobile() ? 2 : 1.5)
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

  // right edge of the glyphs that share the gutter ring's rows (ranges, since blocks span the whole column)
  const textRight = (top: number, bot: number) => {
    let r = 0
    const rg = document.createRange()
    document.querySelectorAll('main :is(h1,h2,h3,h4,p,li,summary,dt,dd,a,button,label)').forEach((el) => {
      const b = el.getBoundingClientRect()
      if (!b.width || b.bottom < top || b.top > bot || el.closest('#join')) return
      rg.selectNodeContents(el)
      const g = rg.getBoundingClientRect()
      if (g.width && g.bottom > top && g.top < bot) r = Math.max(r, g.right)
    })
    return r
  }

  // one loop: display rate while something is changing, 30fps for the steady spin, stopped when nothing moves
  const frame = (now: number) => {
    raf = 0
    if (document.hidden || lost || dead) return
    const m = step(now)
    if (m === 2) raf = requestAnimationFrame(frame)
    else if (m === 1) timer = window.setTimeout(() => { timer = 0; raf = requestAnimationFrame(frame) }, 1000 / 30 - 12)
  }
  const step = (now: number): 0 | 1 | 2 => {
    const f = fx.get()
    const rm = mqRm.matches
    const vw = innerWidth, vh = innerHeight
    const mobile = isMobile()
    if (!last) { last = lastDraw = now; return 2 }
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
      const tEl = cEl(cTitle)
      if (tEl) {
        // the glyphs, not the (wider) heading block
        const rg = document.createRange()
        rg.selectNodeContents(tEl)
        rTitle = rg.getBoundingClientRect()
      } else rTitle = null
      rFoot = rect(cFoot)
    }
    // 0 = hero (ring frames the laptop), 1 = page (ring rides the right gutter)
    const page = hasHero ? ss((0.92 * vh - heroBottom) / (0.6 * vh)) : 1
    const lit = f.glow !== null || page > 0.5
    // in the hero one bar is not a ring (the resting stage asks for 1): wait for the typed count
    // phones have no free gutter: past the hero the bars would cross body text, so only the glow stays
    const want = mobile && page > 0.5 ? 0 : Math.min(page > 0.5 ? f.streaks || 5 : f.streaks > 1 ? f.streaks : 0, mobile ? 3 : N)
    const spinning = lit && want > 0 && !rm && f.intensity > 0
    const busy = now < dirtyUntil
    if (!spinning && !busy) return 0
    const dt = Math.min(0.1, (now - lastDraw) / 1000)
    lastDraw = now
    S.t += dt

    if (busy && wasBusy) {
      ema += (delta - ema) * 0.1
      if (ema > 20) { fast = 0; if (++slow > 30 && level < 2) { level++; slow = 0; ema = 16 } }
      else if (ema < 12) { slow = 0; if (++fast > 240 && level > 0) { level--; fast = 0 } }
      else { slow = 0; fast = 0 }
    }
    wasBusy = busy
    resize(vw, vh, mobile ? 1 : LEVELS[level])

    // --- state smoothing ---
    S.glow += ((lit ? 1 : 0.22) - S.glow) * damp(dt, 3)
    S.sat += ((lit ? 1 : 0) - S.sat) * damp(dt, 3)
    const [a, b] = GLOW[f.glow ?? 'purple'], kc = damp(dt, 5)
    // each typed line answers at once: glow = hue/brightness pulse, speed = spin kick, sparkle = glints + a pop
    if (f.glow !== S.lastGlow) { if (f.glow && !rm) S.pulse = 1; S.lastGlow = f.glow }
    if (f.speed !== S.lastSpeed) { if (!rm) S.kick = 1; S.lastSpeed = f.speed }
    if (f.sparkle && !S.wasSparkle && !rm) S.burst = S.pop = 1
    S.pulse = Math.max(0, S.pulse - dt / 0.45)
    S.kick = Math.max(0, S.kick - dt / 0.6)
    S.pop = Math.max(0, S.pop - dt / 0.6)
    S.arr = Math.max(0, S.arr - dt / 0.6)
    S.hover += (S.hoverT - S.hover) * damp(dt, 12)
    for (let i = 0; i < 3; i++) {
      cA[i] += (a[i] - cA[i]) * kc
      cB[i] += (b[i] - cB[i]) * kc
      col.a.value[i] = mix(cA[i], cB[i], 0.6 * S.pulse)
      col.b.value[i] = cB[i]
    }
    S.speed += (f.speed - S.speed) * damp(dt, 4)
    S.sparkle += ((f.sparkle ? 1 : 0) - S.sparkle) * damp(dt, 6)
    S.wasSparkle = f.sparkle
    S.burst = Math.max(0, S.burst - dt / 0.5)
    S.n += (Math.max(want, 3) - S.n) * (rm ? 1 : damp(dt, 5))

    // --- placement (CSS px), read straight from the DOM rects so the ring never lags the scroll ---
    const endIn = !mobile && !!rEnd && rEnd.top < vh * 0.82 && rEnd.bottom > vh * 0.08
    S.dock = rm ? (endIn ? 1 : 0) : S.dock + ((endIn ? 1 : 0) - S.dock) * damp(dt, 3.2)
    if (!S.arrived && (S.dock > 0.9 || (mobile && rEnd && rEnd.top < vh * 0.9 && rEnd.bottom > 0))) {
      S.arrived = true
      S.burst = S.arr = rm ? 0 : 1
      dispatchEvent(new CustomEvent('fx:arrive'))
    }
    // gutter ring: fully on screen and right of the text when there is room; otherwise it slides
    // up to 40% off the right edge and dims instead of sitting on the copy
    const gR = (mobile ? 0.16 : 0.26) * vh
    const gFull = vw - gR * 1.15 - 24
    if (!mobile && page > 0 && mdirtyText && now - S.textAt > 200) {
      mdirtyText = false
      S.textAt = now
      S.textR = textRight(vh * 0.5 - gR * 1.2, vh * 0.5 + gR * 1.2)
    }
    const gT = Math.min(Math.max(gFull, S.textR + 24 + gR * 1.15), vw - gR * 0.23)
    S.gx = S.gx < 0 || rm ? gT : S.gx + (gT - S.gx) * damp(dt, 3)
    if (Math.abs(gT - S.gx) > 0.5 || (mdirtyText && page > 0 && !mobile)) dirtyUntil = Math.max(dirtyUntil, now + 250)
    const off = clamp01((S.gx - gFull) / (gR * 0.5))
    let cx = mobile ? vw - gR * 0.15 : S.gx, cy = vh * 0.5, R = gR
    if (rOrigin && page < 1) {
      const ox = rOrigin.left + rOrigin.width / 2
      let hR = Math.min(rOrigin.width * 0.9, vh * (mobile ? 0.3 : 0.4), vw * 0.5)
      let oy = rOrigin.top + rOrigin.height / 2
      // phones: the ring sits around the laptop, never behind the copy or its button
      if (mobile && rShield) oy = Math.max(oy, rShield.bottom + 16 + hR * 1.25)
      // bars stay right of the hero copy column (tilted toward the pointer a bar's far end reaches ~1.38 R)
      if (!mobile && rShield) hR = Math.max(rOrigin.width * 0.55, Math.min(hR, (ox - rShield.right - 24) / 1.38))
      cx = mix(ox, cx, page)
      cy = mix(oy, cy, page)
      R = mix(hR, R, page)
    }
    // dock: one ring around the whole call to action (heading glyphs + button), so no bar crosses either
    const d = ss(S.dock)
    let ey = 1, bx = 0.5, by = 0.5
    if (rEnd && d > 0) {
      const t = rTitle && rTitle.width ? rTitle : rEnd
      const top = Math.min(t.top, rEnd.top), left = Math.min(t.left, rEnd.left), right = Math.max(t.right, rEnd.right)
      const dy = (top + rEnd.bottom) / 2
      // an ellipse through sqrt(2) x the padded half-box clears its corners
      const rx = Math.max(rEnd.width / 2 + 64, ((right - left) / 2 + 26) * 1.42)
      let ry = Math.max(rx * 0.42, ((rEnd.bottom - top) / 2 + 26) * 1.42)
      if (rFoot) ry = Math.max(rx * 0.42, Math.min(ry, rFoot.top - 24 - dy - 14))
      cx = mix(cx, (left + right) / 2, d)
      cy = mix(cy, dy, d)
      R = mix(R, rx, d)
      ey = mix(1, ry / rx, d)
      bx = (rEnd.left + rEnd.width / 2) / vw
      by = 1 - (rEnd.top + rEnd.height / 2) / vh
    }
    if (!rm) S.spin += dt * (mix(S.speed * mix(0.11, 0.06, page), 0.15, d) + 0.6 * S.kick)
    const fade = mobile ? mix(1, 0.3, page) : mix(mix(1, mix(0.72, 0.55, off), page), 1, d)
    const gain = S.glow * f.intensity * fade * (1 + 0.7 * Math.sin(Math.PI * S.pulse)) * (1 + 0.25 * S.hover * d)
    const bump = (x: number) => Math.sin(Math.PI * (1 - x)) * (x > 0 ? 1 : 0)
    R *= 1 + 0.04 * bump(S.pop) + 0.05 * bump(S.arr)

    const dist = vh / 2 / Math.tan((FOV * Math.PI) / 360)
    camera.aspect = vw / vh
    camera.near = dist * 0.2
    camera.far = dist * 3
    camera.position.z = dist
    camera.updateProjectionMatrix()
    ring.position.set(cx - vw / 2, vh / 2 - cy, 0)
    ring.scale.setScalar(R)
    const follow = f.followMouse ? (rm ? 0.06 : 0.25) : 0
    const kt = rm ? 1 : damp(dt, 7)
    // no pointer yet (or touch): a small wobble shows that the ring is listening
    const wob = !S.hasPtr && !rm
    S.tx += ((wob ? Math.sin(S.t * 0.9) * 0.55 : S.py) * follow - S.tx) * kt
    S.ty += ((wob ? Math.cos(S.t * 0.7) * 0.7 : S.px) * follow - S.ty) * kt
    ring.rotation.set(mix(-0.3, 0, d) + S.tx * (1 - d), mix(0.12, 0, d) + S.ty * (1 - d), 0)

    let any = false, moving = false
    for (let i = 0; i < N; i++) {
      const bar = bars[i]
      const tgt = i < want ? 1 : 0
      if (rm) bar.x += (tgt - bar.x) * damp(dt, 8)
      else {
        // ~400ms spring, a touch under-damped so a new bar lands with a small settle
        bar.v += ((tgt - bar.x) * 190 - bar.v * 19) * dt
        bar.x += bar.v * dt
      }
      if (Math.abs(tgt - bar.x) > 0.004 || Math.abs(bar.v) > 0.02) moving = true
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
      bar.mesh.scale.set(k * Math.min(1.5, 2 * Math.sin(Math.PI / S.n) * 0.94) * Math.hypot(sa, ey * ca) * mix(1, 0.62, d), k * mix(1, 0.4, d), k * mix(1, 0.4, d))
      bar.u.uVis.value = bar.x
    }

    uT.value = S.t
    uAsp.value = vw / vh
    bgU.uC.value = [cx / vw, 1 - cy / vh]
    bgU.uR.value = Math.min(R / vh, 0.42)
    bgU.uGlow.value = gain * (lit ? 1 : 0.15) * mix(1, 0.6, d)
    bgU.uPage.value = page
    bgU.uScroll.value = scrollY / vh
    bgU.uF.value = [bx, by, d * (bump(S.arr) + 0.25 * S.hover)]
    glassShared.uRefr.value = (R / vh) * 0.8
    glassShared.uGlow.value = gain
    glassShared.uSat.value = S.sat
    glassShared.uSparkle.value = rm ? S.sparkle * 0.6 : S.sparkle * (1 + 1.5 * S.burst)
    compU.uBloom.value = (0.4 + 0.3 * S.sparkle + 0.8 * S.burst + 0.5 * S.pulse) * (0.3 + 0.7 * S.sat)

    // --- passes ---
    pass(mBg, rtBg)
    if (any) {
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
    if (!S.shown) { S.shown = true; onReady() }
    // transitions keep the display rate until they settle
    if (moving || S.pulse || S.kick || S.pop || S.arr || S.burst || Math.abs((endIn ? 1 : 0) - S.dock) > 0.01 || Math.abs(S.hoverT - S.hover) > 0.01)
      dirtyUntil = Math.max(dirtyUntil, now + 200)
    return now < dirtyUntil ? 2 : 1
  }

  function start() { if (ready && !raf && !timer && !document.hidden && !dead && !lost) { last = 0; raf = requestAnimationFrame(frame) } }
  const halt = () => { cancelAnimationFrame(raf); clearTimeout(timer); raf = timer = 0 }
  const onVis = () => (document.hidden ? halt() : mark())
  const onLost = (e: Event) => { e.preventDefault(); lost = true; halt() }
  const onRestored = () => { lost = false; W = H = 0; mark() }
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
  resize(innerWidth, innerHeight, 1)
  const warm = new Scene()
  ;[mBg, mBright, mBlur, mComp, mCopy].forEach((m) => {
    const q = new Mesh(tri, m)
    q.frustumCulled = false
    warm.add(q)
  })
  const wb = new Mesh(barGeo, bars[0].mesh.material), wk = new Mesh(barGeo, mBack)
  wb.frustumCulled = wk.frustumCulled = false
  warm.add(wb, wk)
  await idle()
  renderer
    .compileAsync(warm, camera)
    .then(() => { ready = true; mark() })
    .catch((e) => { console.error(e); if (!dead) onFail() })

  return () => {
    dead = true
    halt()
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
