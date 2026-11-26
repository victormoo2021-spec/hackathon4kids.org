// The press (direction 4.0): ONE detached WebGL2 canvas. Every sheet is an in-flow 2D canvas; a draw is
// viewport -> fullscreen triangle -> drawImage blit. 15Hz render-on-dirty, zero rAF when nothing animated is visible.
import { onTick as clockTick, reduced } from '../clock'
import { jolt as slipJolt } from '../slip'
import type { MountOpts, PressState, Program, Sheet } from '../types'
import { accFrag, heroFrag } from './hero.frag'
import { RISO } from './riso.glsl'

export type { Program, Sheet } from '../types'

export const press: PressState = {
  ok: false,
  reduced: reduced(),
  slip: { x: 0, y: 0 },
  jolt: (px) => slipJolt(px),
  onTick: clockTick,
}

type Vals = Record<string, number | number[] | Float32Array>
interface Prog { p: WebGLProgram; u: Map<string, { loc: WebGLUniformLocation; type: number }> }
interface Hero { tex: WebGLTexture[]; fbo: WebGLFramebuffer[]; cur: number; w: number; h: number }
interface S {
  cv: HTMLCanvasElement; kind: Program; o: MountOpts; ctx: CanvasRenderingContext2D | null; vals: Vals
  w: number; h: number; dirty: boolean; anim: boolean; vis: boolean; dead: boolean
  seed?: number[]; keep?: number[]; hero?: Hero; api: Sheet; io: IntersectionObserver
}

const sheets = new Set<S>()
let cv: HTMLCanvasElement | null = null
let gl: WebGL2RenderingContext | null = null
let lost = false
let paper: WebGLTexture | null = null
let pending = false
let off: (() => void) | null = null
const progs = new Map<Program, Prog[] | Promise<void>>()
const SEED_DECAY = 0.88 ** 4

const VS = `#version 300 es
void main(){vec2 p=vec2(float((gl_VertexID<<1)&2),float(gl_VertexID&2));gl_Position=vec4(p*2.-1.,0.,1.);}`

// Fragment bodies: [source, entry fn]. prims/roller are other lanes' modules, loaded on first use.
const LOAD: Record<Program, () => Promise<[string, string][]>> = {
  hero: async () => [[accFrag, 'accMain'], [heroFrag, 'heroMain']],
  prims: () => import('./prims.frag').then((m) => [[m.primsFrag, 'primsMain']]),
  roller: () => import('./roller.frag').then((m) => [[m.rollerFrag, 'rollerMain']]),
}

function compile(body: string, main: string): Prog | null {
  const g = gl!
  const mk = (t: number, s: string) => { const o = g.createShader(t)!; g.shaderSource(o, s); g.compileShader(o); return o }
  const p = g.createProgram()!
  const f = mk(g.FRAGMENT_SHADER, `#version 300 es\nprecision highp float;precision highp int;\n${RISO}\nout vec4 o;\n${body}\nvoid main(){${main}();}`)
  g.attachShader(p, mk(g.VERTEX_SHADER, VS)); g.attachShader(p, f); g.linkProgram(p)
  if (!g.getProgramParameter(p, g.LINK_STATUS)) { console.error('press: shader', g.getShaderInfoLog(f)); return null }
  const u: Prog['u'] = new Map()
  for (let i = 0, n = g.getProgramParameter(p, g.ACTIVE_UNIFORMS); i < n; i++) {
    const a = g.getActiveUniform(p, i)!
    u.set(a.name.replace(/\[0\]$/, ''), { loc: g.getUniformLocation(p, a.name)!, type: a.type })
  }
  return { p, u }
}

function makePaper() {
  const g = gl!, N = 256, raw = new Float32Array(N * N * 4)
  let s = 0x9e3779b9
  const rnd = () => { s = (s + 0x6d2b79f5) | 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296 }
  for (let i = 0; i < raw.length; i++) raw[i] = rnd()
  const px = new Uint8Array(N * N * 4)
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) for (let c = 0; c < 4; c++) {
    let v = raw[(y * N + x) * 4 + c]
    if (c !== 1) { // r (fibre) and b (density): 3x3 box blur, wrapped, then contrast back up (tuned: x2.4 around .5)
      v = 0
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) v += raw[((((y + dy) & 255) * N) + ((x + dx) & 255)) * 4 + c]
      v = Math.min(1, Math.max(0, (v / 9 - 0.5) * 2.4 + 0.5))
    }
    px[(y * N + x) * 4 + c] = v * 255
  }
  paper = g.createTexture()
  g.activeTexture(g.TEXTURE0); g.bindTexture(g.TEXTURE_2D, paper)
  g.texImage2D(g.TEXTURE_2D, 0, g.RGBA, N, N, 0, g.RGBA, g.UNSIGNED_BYTE, px)
  g.texParameteri(g.TEXTURE_2D, g.TEXTURE_MIN_FILTER, g.LINEAR); g.texParameteri(g.TEXTURE_2D, g.TEXTURE_MAG_FILTER, g.LINEAR)
  g.texParameteri(g.TEXTURE_2D, g.TEXTURE_WRAP_S, g.REPEAT); g.texParameteri(g.TEXTURE_2D, g.TEXTURE_WRAP_T, g.REPEAT)
}

function put(P: Prog, name: string, v: number | number[] | Float32Array) {
  const g = gl!, e = P.u.get(name)
  if (!e) return
  switch (e.type) {
    case g.FLOAT: typeof v === 'number' ? g.uniform1f(e.loc, v) : g.uniform1fv(e.loc, v); break
    case g.INT: case g.SAMPLER_2D: g.uniform1i(e.loc, v as number); break
    case g.FLOAT_VEC2: g.uniform2fv(e.loc, v as number[]); break
    case g.FLOAT_VEC3: g.uniform3fv(e.loc, v as number[]); break
    case g.FLOAT_VEC4: g.uniform4fv(e.loc, v as number[]); break
  }
}
function bind(P: Prog, s: S) {
  gl!.useProgram(P.p)
  put(P, 'uPaper', 0)
  put(P, 'uR', [s.w, s.h]); put(P, 'uRes', [s.w, s.h])
  put(P, 'uDpr', s.w / Math.max(1, s.cv.clientWidth || s.w))
  for (const k in s.vals) put(P, k, s.vals[k])
}

function ensure(w: number, h: number) {
  if (cv!.width < w || cv!.height < h) { cv!.width = Math.max(cv!.width, w); cv!.height = Math.max(cv!.height, h) }
}

function freeHero(s: S) {
  if (!s.hero || !gl) return
  s.hero.tex.forEach((t) => gl!.deleteTexture(t)); s.hero.fbo.forEach((f) => gl!.deleteFramebuffer(f))
  s.hero = undefined
}
function allocHero(s: S): Hero {
  const g = gl!, w = Math.ceil(s.w / 2), h = Math.ceil(s.h / 2)
  const H: Hero = { tex: [], fbo: [], cur: 0, w, h }
  for (let i = 0; i < 2; i++) {
    const t = g.createTexture()!
    g.bindTexture(g.TEXTURE_2D, t)
    g.texImage2D(g.TEXTURE_2D, 0, g.RGBA, w, h, 0, g.RGBA, g.UNSIGNED_BYTE, null)
    g.texParameteri(g.TEXTURE_2D, g.TEXTURE_MIN_FILTER, g.LINEAR); g.texParameteri(g.TEXTURE_2D, g.TEXTURE_MAG_FILTER, g.LINEAR)
    g.texParameteri(g.TEXTURE_2D, g.TEXTURE_WRAP_S, g.CLAMP_TO_EDGE); g.texParameteri(g.TEXTURE_2D, g.TEXTURE_WRAP_T, g.CLAMP_TO_EDGE)
    const f = g.createFramebuffer()!
    g.bindFramebuffer(g.FRAMEBUFFER, f); g.framebufferTexture2D(g.FRAMEBUFFER, g.COLOR_ATTACHMENT0, g.TEXTURE_2D, t, 0)
    g.clearColor(0, 0, 0, 1); g.clear(g.COLOR_BUFFER_BIT)
    H.tex.push(t); H.fbo.push(f)
  }
  g.bindFramebuffer(g.FRAMEBUFFER, null)
  return H
}

function drawHero(s: S, P: Prog[], tick: boolean) {
  const g = gl!
  const H = (s.hero ||= allocHero(s)), [A, C] = P
  const pass = (th: number, decay: number, sub: number) => {
    bind(A, s)
    put(A, 'uAccR', [H.w, H.h]); put(A, 'uTh', th); put(A, 'uDecay', decay); put(A, 'uSub', sub)
    put(A, 'uPrev', 1)
    g.activeTexture(g.TEXTURE1); g.bindTexture(g.TEXTURE_2D, H.tex[H.cur])
    g.bindFramebuffer(g.FRAMEBUFFER, H.fbo[1 - H.cur]); g.viewport(0, 0, H.w, H.h)
    g.drawArrays(g.TRIANGLES, 0, 3)
    H.cur = 1 - H.cur
  }
  g.activeTexture(g.TEXTURE0); g.bindTexture(g.TEXTURE_2D, paper)
  if (s.seed) { // frame 0: oldest exposure first, each seed pass decays the older ones by .88^4
    const sd = s.seed; s.seed = undefined
    for (const f of H.fbo) { g.bindFramebuffer(g.FRAMEBUFFER, f); g.clearColor(0, 0, 0, 1); g.clear(g.COLOR_BUFFER_BIT) }
    for (let i = sd.length - 1; i >= 0; i--) pass(sd[i], SEED_DECAY, 0)
  } else if (tick) {
    const v = s.vals
    pass(v.uTh as number, (v.uDecay as number) ?? 0.88, (v.uSub as number) ?? 0.004)
  }
  g.bindFramebuffer(g.FRAMEBUFFER, null); g.viewport(0, 0, s.w, s.h)
  bind(C, s)
  put(C, 'uAcc', 1)
  g.activeTexture(g.TEXTURE1); g.bindTexture(g.TEXTURE_2D, H.tex[H.cur])
  g.drawArrays(g.TRIANGLES, 0, 3)
}

function draw(s: S, tick: boolean) {
  if (!gl || lost || s.dead || !s.ctx) return
  const { width: w, height: h } = s.cv // clients size their own canvases; press never resizes them
  if (!w || !h) return
  if (w !== s.w || h !== s.h) { s.w = w; s.h = h; freeHero(s) }
  let P = progs.get(s.kind)
  if (!P) { // compile lazily on first use, then redraw everything waiting
    const k = s.kind
    progs.set(k, LOAD[k]().then((src) => {
      if (!gl || lost) { progs.delete(k); return }
      const ps = src.map(([b, m]) => compile(b, m))
      progs.set(k, ps.every(Boolean) ? (ps as Prog[]) : [])
      sheets.forEach((x) => x.kind === k && mark(x))
    }))
    return
  }
  if (!Array.isArray(P) || !P.length) return
  if (!paper) makePaper()
  ensure(s.w, s.h)
  const g = gl
  g.bindFramebuffer(g.FRAMEBUFFER, null); g.viewport(0, 0, s.w, s.h)
  g.activeTexture(g.TEXTURE0); g.bindTexture(g.TEXTURE_2D, paper)
  if (s.kind === 'hero') drawHero(s, P, tick)
  else { bind(P[0], s); g.drawArrays(g.TRIANGLES, 0, 3) }
  s.ctx.drawImage(cv!, 0, cv!.height - s.h, s.w, s.h, 0, 0, s.w, s.h)
  s.dirty = false
}

function mark(s: S) {
  s.dirty = true
  if (pending) return
  pending = true
  ;(press.reduced ? queueMicrotask : requestAnimationFrame)(() => { pending = false; sheets.forEach((x) => x.dirty && x.vis && draw(x, false)) })
}

function runTick(tick: number, ms: number) {
  sheets.forEach((s) => {
    if (!s.anim || !s.vis) return
    s.o.frame?.(tick, ms, s.api)
    if (s.dirty) draw(s, true)
  })
}
function sync() {
  let need = false
  sheets.forEach((s) => { if (s.anim && s.vis) need = true })
  if (need && !off) off = clockTick(runTick)
  else if (!need && off) { off(); off = null }
}

function init() {
  if (typeof document === 'undefined' || cv) return
  cv = document.createElement('canvas'); cv.width = cv.height = 1
  gl = cv.getContext('webgl2', { alpha: false, antialias: false, powerPreference: 'low-power' })
  press.ok = !!gl
  if (!gl) return
  cv.addEventListener('webglcontextlost', (e) => {
    e.preventDefault(); lost = true; progs.clear(); paper = null
    sheets.forEach((s) => { s.hero = undefined }) // last blits stay on the 2D canvases
  })
  cv.addEventListener('webglcontextrestored', () => {
    lost = false
    sheets.forEach((s) => { s.seed = s.keep; mark(s) })
  })
}
init()

export function mountSheet(canvas: HTMLCanvasElement, kind: Program, o: MountOpts): Sheet {
  const ctx = canvas.getContext('2d')
  const s = { cv: canvas, kind, o, ctx, vals: {}, w: 0, h: 0, dirty: false, anim: false, vis: false, dead: false } as S
  const fallback = () => ctx && canvas.width && o.fallback(ctx, canvas.width, canvas.height)
  s.api = {
    set(u) {
      for (const k in u) {
        if (k === 'uSeed') s.seed = s.keep = Array.from(u[k] as ArrayLike<number>)
        else s.vals[k] = u[k]
      }
    },
    dirty() { press.ok ? mark(s) : fallback() },
    animate(on) { s.anim = on && !press.reduced && press.ok; sync() },
    destroy() {
      s.dead = true; s.io.disconnect(); sheets.delete(s); freeHero(s); sync()
    },
  }
  s.io = new IntersectionObserver(([e]) => { s.vis = e.isIntersecting; if (s.vis && s.dirty) mark(s); sync() }, { rootMargin: '50%' })
  sheets.add(s)
  s.io.observe(canvas)
  if (!press.ok) fallback()
  return s.api
}
