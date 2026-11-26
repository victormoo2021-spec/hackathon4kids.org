// L0 stub: L1 supersedes with press/gl/press.ts (same exports). Runs only the 2D fallback.
import { onTick, reduced } from './clock'
import type { MountOpts, PressState, Program, Sheet } from './types'

export type { Program, Sheet } from './types'

export const press: PressState = {
  ok: false,
  reduced: reduced(),
  slip: { x: 0, y: 0 },
  jolt() {},
  onTick,
}

export function mountSheet(canvas: HTMLCanvasElement, _program: Program, opts: MountOpts): Sheet {
  const draw = () => {
    const g = canvas.getContext('2d')
    if (g) opts.fallback(g, canvas.width, canvas.height)
  }
  draw()
  return { set() {}, dirty: draw, animate() {}, destroy() {} }
}
