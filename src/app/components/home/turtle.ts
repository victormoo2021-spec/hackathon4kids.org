export type Segment = { x1: number; y1: number; x2: number; y2: number; color: string; width: number }

// A tiny interpreter for a Python-turtle subset. It runs the program text for real.
type Line = { n: number; ind: number; text: string }
type Node = { l: Line; body: Node[] }

const fail = (l: Line, msg: string): never => {
  throw new Error(`line ${l.n}: ${msg}: ${l.text}`)
}

// drop a trailing # comment, but not a # inside quotes (colors like "#ffd60a")
function stripComment(s: string) {
  let q = ''
  for (let i = 0; i < s.length; i++) {
    const c = s[i]
    if (q) q = c === q ? '' : q
    else if (c === '"' || c === "'") q = c
    else if (c === '#') return s.slice(0, i)
  }
  return s
}

function block(ls: Line[], at: { i: number }, ind: number): Node[] {
  const out: Node[] = []
  while (at.i < ls.length && ls[at.i].ind >= ind) {
    const l = ls[at.i++]
    if (l.ind > ind) fail(l, 'unexpected indent')
    const node: Node = { l, body: [] }
    if (l.text.endsWith(':')) {
      const next = ls[at.i]
      if (!next || next.ind <= ind) fail(l, 'expected an indented block')
      node.body = block(ls, at, next.ind)
    }
    out.push(node)
  }
  return out
}

function num(src: string, vars: Record<string, number>, l: Line): number {
  const toks = src.match(/\d+\.?\d*|[A-Za-z_]\w*|[-+*/()]|\S/g) ?? []
  let p = 0
  const atom = (): number => {
    const t = toks[p++]
    if (t === '(') {
      const v = sum()
      if (toks[p++] !== ')') fail(l, 'missing )')
      return v
    }
    if (t === '-') return -atom()
    if (t && /^\d/.test(t)) return Number(t)
    if (t && Object.hasOwn(vars, t)) return vars[t]
    return fail(l, `cannot use "${t ?? ''}" in a number`)
  }
  const prod = (): number => {
    let v = atom()
    while (toks[p] === '*' || toks[p] === '/') v = toks[p++] === '*' ? v * atom() : v / atom()
    return v
  }
  const sum = (): number => {
    let v = prod()
    while (toks[p] === '+' || toks[p] === '-') v = toks[p++] === '+' ? v + prod() : v - prod()
    return v
  }
  const v = sum()
  if (p < toks.length) fail(l, 'could not read this number')
  return v
}

const str = (s: string, l: Line) => /^(["'])(.*)\1$/.exec(s.trim())?.[2] ?? fail(l, 'expected text in quotes')

export function runTurtle(source: string): { segments: Segment[]; output: string[] } {
  const ls: Line[] = []
  source.split('\n').forEach((raw, i) => {
    const text = stripComment(raw).trimEnd()
    if (text.trim()) ls.push({ n: i + 1, ind: text.length - text.trimStart().length, text: text.trim() })
  })
  const tree = block(ls, { i: 0 }, ls[0]?.ind ?? 0)

  const segments: Segment[] = []
  const output: string[] = []
  let name = ''
  let x = 0, y = 0, heading = 0, down = true, color = '#ffffff', width = 1

  const run = (nodes: Node[], vars: Record<string, number>) => {
    for (const { l, body } of nodes) {
      const t = l.text
      let m: RegExpExecArray | null
      if (t === 'import turtle') continue
      if ((m = /^(\w+) = turtle\.Turtle\(\)$/.exec(t))) { name = m[1]; continue }
      if ((m = /^for (\w+) in range\((.+)\):$/.exec(t))) {
        const count = Math.floor(num(m[2], vars, l))
        if (count > 1000) fail(l, 'range is too big')
        for (let i = 0; i < count; i++) run(body, { ...vars, [m[1]]: i })
        continue
      }
      if ((m = /^print\((.*)\)$/.exec(t))) { output.push(str(m[1], l)); continue }
      if ((m = /^(\w+)\.(\w+)\((.*)\)$/.exec(t)) && m[1] === name) {
        const arg = m[3]
        const n = () => num(arg, vars, l)
        switch (m[2]) {
          case 'forward': case 'fd': case 'backward': case 'bk': {
            const d = m[2][0] === 'b' ? -n() : n()
            const nx = x + d * Math.cos((heading * Math.PI) / 180)
            const ny = y + d * Math.sin((heading * Math.PI) / 180)
            if (down) segments.push({ x1: x, y1: y, x2: nx, y2: ny, color, width })
            if (segments.length > 10000) fail(l, 'too many lines')
            x = nx; y = ny
            break
          }
          case 'left': case 'lt': heading += n(); break
          case 'right': case 'rt': heading -= n(); break
          case 'penup': case 'up': down = false; break
          case 'pendown': case 'down': down = true; break
          case 'pencolor': color = str(arg, l); break
          case 'pensize': case 'width': width = n(); break
          case 'speed': break
          default: fail(l, `unsupported command ${m[2]}`)
        }
        continue
      }
      fail(l, 'unsupported line')
    }
  }
  run(tree, {})
  return { segments, output }
}

// Not called in production: a quick check that the interpreter really draws.
export function __selfCheck() {
  const { segments: s } = runTurtle('import turtle\nt = turtle.Turtle()\nfor i in range(4):\n    t.forward(100)\n    t.left(90)')
  const end = [[100, 0], [100, 100], [0, 100], [0, 0]]
  return s.length === 4 && s.every((g, i) => Math.abs(g.x2 - end[i][0]) < 1e-9 && Math.abs(g.y2 - end[i][1]) < 1e-9)
}
