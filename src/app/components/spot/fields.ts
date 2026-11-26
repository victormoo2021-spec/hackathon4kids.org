// Course proofs: the maths of each course as pure (t) => Prim[] (t in [0,1) is one 30-tick loop), max 24 prims, unit square (height = 1).
// Strokes >= 0.04 of tile width so 34-cell dots resolve at 169px.
import { categories, type Course } from '../../content/courses'

// [type 0 seg | 1 disc | 2 ring, a, b, c, d, width/radius, tone, shaded 0|1|2(flat yellow)]
export type Prim = [0 | 1 | 2, number, number, number, number, number, number, number]
const S = (x1: number, y1: number, x2: number, y2: number, w: number, k = 1): Prim => [0, x1, y1, x2, y2, w, k, 0]
const D = (x: number, y: number, r: number, k = 1, sh = 1): Prim => [1, x, y, 0, 0, r, k, sh]
const R = (x: number, y: number, r: number, w: number, k = 1): Prim => [2, x, y, r, 0, w, k, 0]
const poly = (pts: number[][], w: number, k = 1) => pts.slice(1).map((q, i) => S(pts[i][0], pts[i][1], q[0], q[1], w, k))
const ease = (x: number) => x * x * (3 - 2 * x)
const clamp01 = (x: number) => Math.max(0, Math.min(1, x))
const TAU = Math.PI * 2

export const slug = (name: string) => name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
export const courseNames: Course[] = categories.flatMap((c) => [...c.courses])

// Python: turtle drawing a square spiral, head disc on the pen
const spiral = (() => {
  const dirs = [[1, 0], [0, 1], [-1, 0], [0, -1]]
  let x = 0, y = 0
  const pts = [[0, 0]]
  for (let k = 1; k <= 9; k++) { x += dirs[(k - 1) % 4][0] * k; y += dirs[(k - 1) % 4][1] * k; pts.push([x, y]) }
  const xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1])
  const s = 0.74 / Math.max(Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys))
  const cx = (Math.max(...xs) + Math.min(...xs)) / 2, cy = (Math.max(...ys) + Math.min(...ys)) / 2
  return pts.map((p) => [0.5 + (p[0] - cx) * s, 0.5 + (p[1] - cy) * s])
})()
const turtle = (t: number): Prim[] => {
  const n = spiral.length - 1, f = ease(clamp01(t / 0.85)) * n, whole = Math.floor(f), o: Prim[] = []
  for (let i = 0; i < Math.min(whole, n); i++) o.push(S(...(spiral[i].concat(spiral[i + 1]) as [number, number, number, number]), 0.055))
  const a = spiral[Math.min(whole, n)], b = spiral[Math.min(whole + 1, n)], r = f - whole
  const hx = a[0] + (b[0] - a[0]) * r, hy = a[1] + (b[1] - a[1]) * r
  if (whole < n) o.push(S(a[0], a[1], hx, hy, 0.055))
  o.push(D(hx, hy, 0.075))
  return o
}

// Git + GitHub: main line, a branch leaves and merges, a commit disc travels the whole route
const BR = [[0.28, 0.3], [0.5, 0.42], [0.72, 0.42], [0.72, 0.6], [0.28, 0.72]]
const route = [[0.28, 0.12], [0.28, 0.3], ...BR.slice(1), [0.28, 0.88]]
const git = (t: number): Prim[] => {
  const len = route.slice(1).map((q, i) => Math.hypot(q[0] - route[i][0], q[1] - route[i][1])), tot = len.reduce((a, b) => a + b)
  let d = ease(clamp01(t / 0.9)) * tot, i = 0
  while (i < len.length - 1 && d > len[i]) d -= len[i++]
  const f = d / len[i], x = route[i][0] + (route[i + 1][0] - route[i][0]) * f, y = route[i][1] + (route[i + 1][1] - route[i][1]) * f
  return [S(0.28, 0.12, 0.28, 0.88, 0.06), ...poly(BR, 0.05, 0.75),
    D(0.28, 0.12, 0.06, 0.8), D(0.28, 0.3, 0.06, 0.8), D(0.28, 0.72, 0.06, 0.8), D(0.28, 0.88, 0.06, 0.8), D(0.72, 0.42, 0.05, 0.8), D(0.72, 0.6, 0.05, 0.8),
    R(x, y, 0.11, 0.04), D(x, y, 0.065)]
}

// AP CSA: 8 bars, bubble sort, one compare-swap per step
const sortSteps = (() => {
  const a = [5, 2, 7, 1, 8, 3, 6, 4], out: { a: number[]; i: number }[] = []
  for (let n = a.length; n > 1; n--) for (let i = 0; i < n - 1; i++) { if (a[i] > a[i + 1]) [a[i], a[i + 1]] = [a[i + 1], a[i]]; out.push({ a: a.slice(), i }) }
  return out
})()
const bars = (t: number): Prim[] => {
  const st = sortSteps[Math.min(sortSteps.length - 1, Math.floor(t * sortSteps.length))]
  return st.a.map((h, i) => S(0.13 + i * 0.105, 0.9, 0.13 + i * 0.105, 0.9 - h * 0.09, 0.075, i === st.i || i === st.i + 1 ? 1 : 0.5))
}

// Robotics: two-link arm, IK tracks a target walking a circle
const arm = (t: number): Prim[] => {
  const bx = 0.22, by = 0.86, L1 = 0.4, L2 = 0.34, th = t * TAU
  const tx = 0.56 + 0.17 * Math.cos(th), ty = 0.4 + 0.17 * Math.sin(th)
  const d = Math.min(Math.hypot(tx - bx, ty - by), L1 + L2 - 0.01), base = Math.atan2(by - ty, tx - bx)
  const a1 = base + Math.acos(Math.max(-1, Math.min(1, (L1 * L1 + d * d - L2 * L2) / (2 * L1 * d))))
  const ex = bx + L1 * Math.cos(a1), ey = by - L1 * Math.sin(a1)
  const hx = tx, hy = ty
  return [S(0.08, 0.92, 0.4, 0.92, 0.06), S(bx, by, ex, ey, 0.07), S(ex, ey, hx, hy, 0.06),
    R(0.56, 0.4, 0.17, 0.035, 0.4), R(tx, ty, 0.07, 0.035, 0.8), D(bx, by, 0.065), D(ex, ey, 0.055), D(hx, hy, 0.045)]
}

// Game Development: ball bouncing in a box, parabolic arcs, 3 echoes
const ballAt = (t: number) => {
  const s = (t * 4) % 1, tri = 1 - Math.abs(2 * ((t * 1.5) % 1) - 1)
  return [0.17 + 0.66 * tri, 0.85 - 0.62 * 4 * s * (1 - s)]
}
const bounce = (t: number): Prim[] => {
  const o: Prim[] = [S(0.06, 0.92, 0.94, 0.92, 0.05), S(0.06, 0.08, 0.06, 0.92, 0.05), S(0.94, 0.08, 0.94, 0.92, 0.05), S(0.06, 0.08, 0.94, 0.08, 0.05)]
  const t0 = t - (t % 0.25), arc: number[][] = []
  for (let i = 0; i <= 6; i++) arc.push(ballAt(t0 + (0.2499 * i) / 6))
  o.push(...poly(arc, 0.035, 0.3))
  for (let e = 3; e >= 1; e--) { const [x, y] = ballAt(Math.max(0, t - e * 0.03)); o.push(D(x, y, 0.07 - e * 0.008, 0.6 - e * 0.15, 0)) }
  const [x, y] = ballAt(t)
  return [...o, D(x, y, 0.075)]
}

// Intro to Algebra: y = 2x + 1, a point slides, slope triangle rides with it
const X = (x: number) => 0.1 + (0.8 * (x + 0.5)) / 2, Y = (y: number) => 0.9 - (0.8 * y) / 4
const algebra = (t: number): Prim[] => {
  const x = -0.4 + 1.3 * (1 - Math.abs(2 * t - 1)), y = 2 * x + 1
  return [S(0.1, 0.9, 0.9, 0.9, 0.04, 0.55), S(X(0), 0.1, X(0), 0.9, 0.04, 0.55), S(X(-0.5), Y(0), X(1.5), Y(4), 0.055),
    S(X(x), Y(y), X(x + 0.5), Y(y), 0.04, 0.7), S(X(x + 0.5), Y(y), X(x + 0.5), Y(y + 1), 0.04, 0.7), D(X(x), Y(y), 0.06)]
}

// AMC 8: triangular numbers 1+2+3+4+5 as a dot array that grows
const tri = (t: number): Prim[] => {
  const n = Math.min(15, Math.ceil(clamp01(t / 0.8) * 15)), o: Prim[] = []
  let c = 0
  for (let r = 0; r < 5; r++) for (let i = 0; i <= r; i++) if (c++ < n) o.push(D(0.5 + (i - r / 2) * 0.17, 0.17 + r * 0.165, 0.062, c === n ? 1 : 0.8))
  return o
}

// AMC 10: inscribed angle, vertex moves along the arc, angle stays put
const inscribed = (t: number): Prim[] => {
  const cx = 0.5, cy = 0.52, r = 0.36, A = [cx + r * Math.cos(0.5), cy - r * Math.sin(0.5)], B = [cx + r * Math.cos(2.64), cy - r * Math.sin(2.64)]
  const a = 3.5 + 2.4 * ease(1 - Math.abs(2 * t - 1)), P = [cx + r * Math.cos(a), cy - r * Math.sin(a)]
  return [R(cx, cy, r, 0.045, 0.7), S(A[0], A[1], B[0], B[1], 0.04, 0.5), S(P[0], P[1], A[0], A[1], 0.05), S(P[0], P[1], B[0], B[1], 0.05), D(A[0], A[1], 0.045), D(B[0], B[1], 0.045), D(P[0], P[1], 0.06)]
}

// Intro Physics: projectile parabola, strobe echoes
const px = (s: number): [number, number] => [0.1 + 0.8 * s, 0.85 - 0.62 * 4 * s * (1 - s)]
const projectile = (t: number): Prim[] => {
  const s = clamp01(t / 0.85), o: Prim[] = [S(0.06, 0.88, 0.94, 0.88, 0.05, 0.7), ...poly(Array.from({ length: 9 }, (_, i) => px(i / 8)), 0.035, 0.3)]
  for (let k = 0; k / 8 < s - 0.02; k++) o.push(D(...px(k / 8), 0.042, 0.6, 0))
  return [...o, D(...px(s), 0.075)]
}

// AP Physics 1: mass on a spring, its sine trace unrolling beside it
const spring = (t: number): Prim[] => {
  const ph = (u: number) => 0.5 + 0.2 * Math.sin(TAU * (2 * t - u * 1.6)), my = ph(0)
  const zig = [[0.22, 0.08], ...Array.from({ length: 6 }, (_, i) => [0.22 + (i % 2 ? 0.07 : -0.07), 0.08 + ((my - 0.08 - 0.07) * (i + 0.5)) / 6]), [0.22, my - 0.07]]
  const trace = Array.from({ length: 9 }, (_, i) => [0.5 + (0.42 * i) / 8, ph(i / 8)])
  return [S(0.1, 0.08, 0.34, 0.08, 0.05), ...poly(zig, 0.04), D(0.22, my, 0.085), ...poly(trace, 0.045, 0.7), D(trace[0][0], my, 0.045, 0.9)]
}

export const fields: Record<Course, (t: number) => Prim[]> = {
  Python: turtle, 'Git + GitHub': git, 'AP CSA': bars, Robotics: arm, 'Game Development': bounce,
  'Intro to Algebra': algebra, 'AMC 8': tri, 'AMC 10': inscribed, 'Intro to Physics': projectile, 'AP Physics 1': spring,
}
// frame 0 = this loop phase, so the static proof already reads as its maths
export const rest: Record<Course, number> = {
  Python: 0.9, 'Git + GitHub': 0.4, 'AP CSA': 0.32, Robotics: 0.1, 'Game Development': 0.37,
  'Intro to Algebra': 0.3, 'AMC 8': 0.9, 'AMC 10': 0.3, 'Intro to Physics': 0.5, 'AP Physics 1': 0.06,
}

// Pack for the shader: uPa / uPb vec4[24] as flat Float32Arrays.
export function pack(prims: Prim[]) {
  const pa = new Float32Array(96), pb = new Float32Array(96), n = Math.min(24, prims.length)
  for (let i = 0; i < n; i++) { const p = prims[i]; pa.set(p.slice(1, 5), i * 4); pb.set([p[0], p[5], p[6], p[7]], i * 4) }
  return { pa, pb, n }
}
