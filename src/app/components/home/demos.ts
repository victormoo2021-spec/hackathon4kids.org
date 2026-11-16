export type DemoKind = 'code' | 'build' | 'math' | 'physics'

export const DEMO_CODE: Record<DemoKind, string> = {
  code: 'for i in range(60): turtle.forward(i); turtle.left(91)',
  build: 'arm.reach(block); arm.grip()',
  math: 'plot(lambda x: 2*x + 1)',
  physics: 'swing(pendulum, angle=30)',
}

const YEL = '#ffd60a'
const WHITE = 'rgba(244,244,245,.9)'
const GREY = 'rgba(244,244,245,.35)'
const FAINT = 'rgba(255,255,255,.08)'
const BG = '#0b0b0e'
const DUR = 3.6 // seconds until the final frame; the pendulum keeps swinging

type Ctx = CanvasRenderingContext2D
type Draw = (c: Ctx, w: number, h: number, t: number) => void

const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v))
// critically damped approach, 0 -> 1
const settle = (t: number, w = 5) => (t <= 0 ? 0 : 1 - (1 + w * t) * Math.exp(-w * t))
const line = (c: Ctx, x1: number, y1: number, x2: number, y2: number) => {
  c.beginPath()
  c.moveTo(x1, y1)
  c.lineTo(x2, y2)
  c.stroke()
}
const dot = (c: Ctx, x: number, y: number, r: number, fill: string) => {
  c.beginPath()
  c.arc(x, y, r, 0, Math.PI * 2)
  c.fillStyle = fill
  c.fill()
}

// ---- code: square spiral
const SPIRAL = (() => {
  const pts = [{ x: 0, y: 0 }]
  let x = 0, y = 0, a = 0
  for (let i = 0; i < 60; i++) {
    x += Math.cos(a) * i
    y += Math.sin(a) * i
    a += (91 * Math.PI) / 180
    pts.push({ x, y })
  }
  const xs = pts.map((p) => p.x), ys = pts.map((p) => p.y)
  return { pts, minX: Math.min(...xs), maxX: Math.max(...xs), minY: Math.min(...ys), maxY: Math.max(...ys) }
})()

const drawCode: Draw = (c, w, h, t) => {
  const { pts, minX, maxX, minY, maxY } = SPIRAL
  const pad = 14
  const s = Math.min((w - pad * 2) / (maxX - minX), (h - pad * 2) / (maxY - minY))
  const ox = w / 2 - ((minX + maxX) / 2) * s, oy = h / 2 - ((minY + maxY) / 2) * s
  const P = (i: number): [number, number] => [ox + pts[i].x * s, oy + pts[i].y * s]
  const prog = clamp(t / 3.2) * 60
  const n = Math.min(60, Math.floor(prog)), f = prog - n
  c.lineWidth = 1
  c.strokeStyle = WHITE
  c.lineJoin = 'round'
  c.beginPath()
  c.moveTo(...P(0))
  for (let i = 1; i <= n; i++) c.lineTo(...P(i))
  let [tx, ty] = P(n)
  if (n < 60) {
    const [nx, ny] = P(n + 1)
    tx += (nx - tx) * f
    ty += (ny - ty) * f
    c.lineTo(tx, ty)
  }
  c.stroke()
  c.save()
  c.translate(tx, ty)
  c.rotate((Math.min(n, 59) * 91 * Math.PI) / 180)
  c.fillStyle = YEL
  c.beginPath()
  c.moveTo(6, 0)
  c.lineTo(-4, 3.5)
  c.lineTo(-4, -3.5)
  c.closePath()
  c.fill()
  c.restore()
}

// ---- build: two-joint arm reaches a block, grips, lifts
const drawBuild: Draw = (c, w, h, t) => {
  const u = Math.min(w, h * 1.6)
  const base = [w * 0.3, h * 0.86]
  const L1 = u * 0.36, L2 = u * 0.32
  const bs = u * 0.1
  const ground = base[1] + 8
  const block = [w * 0.72, ground - bs / 2]
  const start = [base[0] + L1 * 0.9, base[1] - L2 * 1.2]
  const lift = [block[0] - u * 0.12, block[1] - u * 0.34]
  const r = settle(t, 4.5), lf = settle(t - 2.2, 4.5)
  const px = start[0] + (block[0] - start[0]) * r + (lift[0] - block[0]) * lf
  const py = start[1] + (block[1] - start[1]) * r + (lift[1] - block[1]) * lf
  const grip = clamp((t - 1.8) / 0.35)
  // two-link IK, elbow up
  const dx = px - base[0], dy = py - base[1]
  const dist = Math.hypot(dx, dy)
  const d = clamp(dist, 1, L1 + L2 - 0.5)
  const a1 = Math.atan2(dy, dx) - Math.acos(clamp((L1 * L1 + d * d - L2 * L2) / (2 * L1 * d), -1, 1))
  const ex = base[0] + Math.cos(a1) * L1, ey = base[1] + Math.sin(a1) * L1
  const hx = base[0] + (dx / dist) * d, hy = base[1] + (dy / dist) * d
  c.lineWidth = 1
  c.strokeStyle = GREY
  line(c, w * 0.08, ground, w * 0.92, ground)
  const held = t > 2.2
  const bx = held ? hx : block[0], by = held ? hy : block[1]
  c.strokeStyle = YEL
  c.strokeRect(bx - bs / 2, by - bs / 2, bs, bs)
  c.strokeStyle = WHITE
  c.lineWidth = 2
  line(c, base[0], base[1], ex, ey)
  line(c, ex, ey, hx, hy)
  c.lineWidth = 1
  dot(c, base[0], base[1], 4, BG)
  c.beginPath()
  c.arc(base[0], base[1], 4, 0, Math.PI * 2)
  c.stroke()
  dot(c, ex, ey, 3, WHITE)
  const gap = bs / 2 + (1 - grip) * 6
  c.save()
  c.translate(hx, hy)
  c.rotate(Math.atan2(hy - ey, hx - ex))
  c.lineWidth = 1.5
  line(c, 0, -gap, 7, -gap)
  line(c, 0, gap, 7, gap)
  line(c, 0, -gap, 0, gap)
  c.restore()
}

// ---- math: y = 2x + 1
const drawMath: Draw = (c, w, h, t) => {
  const X0 = -3.3, X1 = 3.3, Y0 = -6, Y1 = 8
  const sx = (x: number) => ((x - X0) / (X1 - X0)) * w
  const sy = (y: number) => h - ((y - Y0) / (Y1 - Y0)) * h
  const hx = (x: number) => Math.round(sx(x)) + 0.5
  const hy = (y: number) => Math.round(sy(y)) + 0.5
  c.lineWidth = 1
  c.strokeStyle = FAINT
  for (let x = X0; x <= X1; x++) line(c, hx(x), 0, hx(x), h)
  for (let y = Y0; y <= Y1; y += 2) line(c, 0, hy(y), w, hy(y))
  c.strokeStyle = GREY
  line(c, 0, hy(0), w, hy(0))
  line(c, hx(0), 0, hx(0), h)
  const xe = X0 + (X1 - X0) * clamp(t / 3)
  c.strokeStyle = YEL
  c.lineWidth = 2
  line(c, sx(X0), sy(2 * X0 + 1), sx(xe), sy(2 * xe + 1))
  dot(c, sx(xe), sy(2 * xe + 1), 3.5, YEL)
}

// ---- physics: pendulum, period 1.8s, slight damping
const A0 = (30 * Math.PI) / 180
const swing = (t: number) => A0 * Math.cos((2 * Math.PI * t) / 1.8) * Math.exp(-0.05 * t)
const geom = (w: number, h: number) => ({ L: Math.min(h * 0.72, w * 0.5), px: w / 2, py: h * 0.1 })

function arm(c: Ctx, w: number, h: number, ang: number, bob: string, alpha = 1) {
  const { L, px, py } = geom(w, h)
  c.globalAlpha = alpha
  c.strokeStyle = WHITE
  c.lineWidth = 1
  line(c, px, py, px + Math.sin(ang) * L, py + Math.cos(ang) * L)
  dot(c, px + Math.sin(ang) * L, py + Math.cos(ang) * L, 7, bob)
  c.globalAlpha = 1
}

const drawPhysics: Draw = (c, w, h, t) => {
  const { L, px, py } = geom(w, h)
  c.strokeStyle = GREY
  c.lineWidth = 1
  line(c, px - 14, py, px + 14, py)
  c.strokeStyle = 'rgba(244,244,245,.14)'
  c.beginPath()
  for (let i = 0; i <= 24; i++) {
    const a = swing(Math.max(0, t - (24 - i) * 0.03))
    const x = px + Math.sin(a) * L, y = py + Math.cos(a) * L
    if (i) c.lineTo(x, y)
    else c.moveTo(x, y)
  }
  c.stroke()
  arm(c, w, h, swing(t), YEL)
}

const drawPhysicsCalm: Draw = (c, w, h) => {
  const { px, py } = geom(w, h)
  c.strokeStyle = GREY
  c.lineWidth = 1
  line(c, px - 14, py, px + 14, py)
  for (const k of [-1, -0.5, 0.5, 1]) arm(c, w, h, A0 * k, 'rgba(244,244,245,.5)', Math.abs(k) === 1 ? 0.25 : 0.4)
  arm(c, w, h, 0, YEL)
}

const DRAW: Record<DemoKind, Draw> = { code: drawCode, build: drawBuild, math: drawMath, physics: drawPhysics }

export function runDemo(canvas: HTMLCanvasElement, kind: DemoKind, opts: { calm?: boolean } = {}): () => void {
  const ctx = canvas.getContext('2d')
  if (!ctx) return () => {}
  const endless = kind === 'physics'
  let w = 0, h = 0, t = 0, last = 0, raf = 0, onScreen = true, stopped = false

  const paint = () => {
    ctx.clearRect(0, 0, w, h)
    if (opts.calm) (endless ? drawPhysicsCalm : DRAW[kind])(ctx, w, h, DUR)
    else DRAW[kind](ctx, w, h, endless ? t : Math.min(t, DUR))
  }
  const frame = (now: number) => {
    raf = 0
    if (stopped) return
    t += Math.min(0.05, (now - last) / 1000)
    last = now
    paint()
    if ((endless || t < DUR) && onScreen && !document.hidden) raf = requestAnimationFrame(frame)
  }
  const kick = () => {
    if (stopped || raf || opts.calm || !onScreen || document.hidden || (!endless && t >= DUR)) return
    last = performance.now()
    raf = requestAnimationFrame(frame)
  }
  const size = () => {
    const r = canvas.getBoundingClientRect()
    const dpr = window.devicePixelRatio || 1
    w = r.width
    h = r.height
    canvas.width = Math.max(1, Math.round(w * dpr))
    canvas.height = Math.max(1, Math.round(h * dpr))
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    paint()
  }
  const ro = new ResizeObserver(size)
  ro.observe(canvas)
  const io = new IntersectionObserver((e) => {
    onScreen = e[e.length - 1].isIntersecting
    kick()
  })
  io.observe(canvas)
  document.addEventListener('visibilitychange', kick)
  size()
  kick()
  return () => {
    stopped = true
    cancelAnimationFrame(raf)
    ro.disconnect()
    io.disconnect()
    document.removeEventListener('visibilitychange', kick)
  }
}
