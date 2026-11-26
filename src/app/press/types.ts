// Contract owned by L0. Changing it needs the art director.
export type Program = 'hero' | 'prims' | 'roller'
export interface Sheet {
  set(u: Record<string, number | number[] | Float32Array>): void
  dirty(): void
  animate(on: boolean): void
  destroy(): void
}
export interface MountOpts {
  dprCap?: number
  /** called at 15Hz while animate(true) and visible */
  frame?: (tick: number, ms: number, s: Sheet) => void
  /** frame 0 without WebGL2 */
  fallback: (g: CanvasRenderingContext2D, w: number, h: number) => void
}
export interface PressState {
  ok: boolean
  reduced: boolean
  slip: { x: number; y: number }
  jolt(px: number): void
  onTick(fn: (tick: number, ms: number) => void): () => void
}
