import { FX_DEFAULT, type FxState, type Glow } from '../fx/store'

// The tiny language the hero types: `name = value`, `# comment`, blank lines.
export class SketchError extends Error {}

type Val = string | number | boolean
const GLOWS: Glow[] = ['purple', 'violet', 'gold']

const bool = (name: string, v: Val) => {
  if (typeof v !== 'boolean') throw new SketchError(`${name} wants True or False.`)
  return v
}
const num = (name: string, v: Val, max: number, int = false) => {
  if (typeof v !== 'number' || v < 0 || v > max || (int && !Number.isInteger(v)))
    throw new SketchError(`${name} wants ${int ? 'a whole number' : 'a number'} from 0 to ${max}.`)
  return v
}

const SETTERS: Record<string, (v: Val) => Partial<FxState>> = {
  glow: (v) => {
    if (typeof v !== 'string' || !GLOWS.includes(v as Glow)) throw new SketchError('glow wants "purple", "violet" or "gold".')
    return { glow: v as Glow }
  },
  streaks: (v) => ({ streaks: num('streaks', v, 8, true) }),
  speed: (v) => ({ speed: num('speed', v, 4) }),
  sparkle: (v) => ({ sparkle: bool('sparkle', v) }),
  follow_mouse: (v) => ({ followMouse: bool('follow_mouse', v) }),
}

function value(raw: string): Val {
  if (raw === 'True' || raw === 'False') return raw === 'True'
  if (/^-?\d+(\.\d+)?$/.test(raw)) return Number(raw)
  const s = /^"([^"]*)"$/.exec(raw)
  if (s) return s[1]
  throw new SketchError(`I can't read ${raw || 'nothing'} after the = sign.`)
}

/** null for comments and blank lines; throws SketchError for anything it can't read. */
export function parseLine(line: string): Partial<FxState> | null {
  const t = line.trim()
  if (!t || t.startsWith('#')) return null
  const at = t.indexOf('=')
  if (at < 0) throw new SketchError('Each line looks like name = value.')
  const name = t.slice(0, at).trim()
  const set = SETTERS[name]
  if (!set) throw new SketchError(`I don't know "${name}". Try ${Object.keys(SETTERS).join(', ')}.`)
  return set(value(t.slice(at + 1).trim()))
}

/** The scene after the first n completed lines. Before any line, the scene is still (speed .2). */
export function runSketch(lines: string[], n: number): FxState {
  return lines.slice(0, n).reduce<FxState>((s, l) => ({ ...s, ...parseLine(l) }), { ...FX_DEFAULT, speed: 0.2 })
}
