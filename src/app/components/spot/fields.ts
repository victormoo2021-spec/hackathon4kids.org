// Tiny tone fields (0..1 in a unit square) for the course tiles, drawn from the same maths as the lessons:
// pendulum, y = 2x + 1, turtle spiral, two-link robot arm...
export type Prim =
  | ['s', number, number, number, number, number, number?] // segment x1 y1 x2 y2 width tone
  | ['d', number, number, number, boolean?, number?] // disc cx cy r shaded tone
  | ['r', number, number, number, number, number?] // ring cx cy r width tone

const AA = 0.008
const cov = (d: number, r: number) => Math.max(0, Math.min(1, (r - d) / AA + 0.5))

export function toneAt(prims: Prim[], x: number, y: number) {
  let t = 0
  for (const p of prims) {
    let v = 0
    if (p[0] === 's') {
      const [, x1, y1, x2, y2, w, k = 1] = p
      const vx = x2 - x1, vy = y2 - y1
      const h = Math.max(0, Math.min(1, ((x - x1) * vx + (y - y1) * vy) / (vx * vx + vy * vy || 1)))
      v = cov(Math.hypot(x - x1 - vx * h, y - y1 - vy * h), w / 2) * k
    } else if (p[0] === 'd') {
      const [, cx, cy, r, sh, k = 1] = p
      const d = Math.hypot(x - cx, y - cy)
      const s = sh ? 0.2 + 0.8 * Math.max(0, Math.min(1, 0.5 - 0.5 * (((x - cx) * -0.58 + (y - cy) * -0.81) / r))) : 1
      v = cov(d, r) * s * k
    } else {
      const [, cx, cy, r, w, k = 1] = p
      v = cov(Math.abs(Math.hypot(x - cx, y - cy) - r), w / 2) * k
    }
    if (v > t) t = v
  }
  return t
}

const poly = (pts: [number, number][], w: number, k = 1): Prim[] =>
  pts.slice(1).map((q, i) => ['s', pts[i][0], pts[i][1], q[0], q[1], w, k] as Prim)

const pendulum = (th: number, echoes: number): Prim[] => {
  const out: Prim[] = []
  for (let i = echoes; i >= 0; i--) {
    const a = th - i * 0.16 * Math.sign(th), bx = 0.5 + 0.68 * Math.sin(a), by = 0.08 + 0.68 * Math.cos(a)
    const k = i ? 0.3 : 1
    out.push(['s', 0.5, 0.08, bx, by, 0.018, k], ['d', bx, by, 0.1, !i, k])
  }
  out.push(['d', 0.5, 0.08, 0.025])
  return out
}

const arm = (a1: number, a2: number): Prim[] => {
  const x1 = 0.3 + 0.32 * Math.cos(a1), y1 = 0.86 - 0.32 * Math.sin(a1)
  const x2 = x1 + 0.28 * Math.cos(a1 + a2), y2 = y1 - 0.28 * Math.sin(a1 + a2)
  return [['s', 0.15, 0.9, 0.5, 0.9, 0.05], ['s', 0.3, 0.86, x1, y1, 0.05], ['s', x1, y1, x2, y2, 0.04],
    ['d', 0.3, 0.86, 0.045], ['d', x1, y1, 0.04, true], ['d', x2, y2, 0.05, true]]
}

const turtle = (): Prim[] => {
  const pts: [number, number][] = [[0.5, 0.5]]
  let x = 0.5, y = 0.5, d = 0
  const dirs = [[1, 0], [0, 1], [-1, 0], [0, -1]]
  for (let k = 1; k <= 11; k++) { const l = 0.035 * k; x += dirs[d][0] * l; y += dirs[d][1] * l; pts.push([x, y]); d = (d + 1) % 4 }
  return [...poly(pts, 0.022), ['d', x, y, 0.045, true]]
}

const line: Prim[] = (() => {
  // y = 2x + 1 on x in [-0.5, 1.5], y in [0, 4]
  const X = (x: number) => 0.1 + (0.8 * (x + 0.5)) / 2, Y = (y: number) => 0.9 - (0.8 * y) / 4
  return [['s', 0.1, 0.9, 0.9, 0.9, 0.012, 0.6], ['s', X(0), 0.1, X(0), 0.9, 0.012, 0.6],
    ['s', X(-0.5), Y(0), X(1.5), Y(4), 0.03], ['d', X(0), Y(1), 0.04, true], ['d', X(1), Y(3), 0.04, true]]
})()

const git: Prim[] = [
  ...poly([[0.3, 0.1], [0.3, 0.9]], 0.03), ...poly([[0.3, 0.35], [0.45, 0.45], [0.7, 0.45], [0.7, 0.62], [0.3, 0.7]], 0.03, 0.7),
  ['d', 0.3, 0.15, 0.06, true], ['d', 0.3, 0.35, 0.06, true], ['d', 0.3, 0.7, 0.06, true], ['d', 0.3, 0.88, 0.06, true],
  ['d', 0.7, 0.45, 0.06, true], ['d', 0.7, 0.62, 0.06, true],
]

const bars: Prim[] = [0.3, 0.5, 0.2, 0.7, 0.4, 0.85, 0.6].map((h, i) => ['s', 0.14 + i * 0.12, 0.92, 0.14 + i * 0.12, 0.92 - h * 0.8, 0.08, 0.55 + h * 0.4] as Prim)

const bounce: Prim[] = (() => {
  const o: Prim[] = [['s', 0.05, 0.9, 0.95, 0.9, 0.03]]
  for (let i = 0; i <= 6; i++) { const t = i / 6; o.push(['d', 0.12 + 0.76 * t, 0.9 - 0.12 - 0.62 * 4 * t * (1 - t), 0.05 + 0.025 * i / 3, i === 6, i === 6 ? 1 : 0.25 + i * 0.1]) }
  return o
})()

const geometry: Prim[] = [['r', 0.5, 0.5, 0.36, 0.03], ['s', 0.14, 0.14, 0.86, 0.14, 0.025], ['s', 0.14, 0.86, 0.86, 0.86, 0.025], ['s', 0.14, 0.14, 0.14, 0.86, 0.025], ['s', 0.86, 0.14, 0.86, 0.86, 0.025],
  ['s', 0.14, 0.86, 0.86, 0.14, 0.02, 0.7], ['d', 0.5, 0.5, 0.06, true]]

const parab: Prim[] = (() => {
  const pts: [number, number][] = []
  for (let i = 0; i <= 24; i++) { const x = -1 + i / 12; pts.push([0.5 + x * 0.38, 0.85 - x * x * 0.7]) }
  return [['s', 0.1, 0.85, 0.9, 0.85, 0.012, 0.6], ['s', 0.5, 0.1, 0.5, 0.9, 0.012, 0.6], ...poly(pts, 0.03),
    ['s', 0.5 + 0.38 * 0.5 - 0.3, 0.85 - 0.175 + 0.3 * 0.7, 0.5 + 0.19 + 0.3, 0.85 - 0.175 - 0.3 * 0.7, 0.014, 0.7], ['d', 0.69, 0.675, 0.045, true]]
})()

export const fields: Record<string, Prim[]> = {
  Python: turtle(), 'Git + GitHub': git, 'AP CSA': bars,
  Robotics: arm(1.0, -0.7), 'Game Development': bounce,
  'Intro to Algebra': line, 'AMC 8': geometry, 'AMC 10': parab,
  'Intro to Physics': pendulum(0.7, 0), 'AP Physics 1': pendulum(-0.6, 3),
}
