// Shared state for the live visuals. The hero "sketch" (the code the laptop types)
// writes here line by line; the shader (StreakField) and the 3D laptop read it.
// Tiny pub/sub on purpose: no dependency, readable in a render loop via fx.get().

export type Glow = 'purple' | 'violet' | 'gold'

export type FxState = {
  /** background light color; null = dark, nothing painted yet */
  glow: Glow | null
  /** number of light-painting ribbons, 0..8 */
  streaks: number
  /** flow speed multiplier, 0..4 */
  speed: number
  /** brief yellow-white flashes along the ribbons */
  sparkle: boolean
  /** ribbons bend toward the pointer */
  followMouse: boolean
  /** overall brightness, 0..1 (story/scroll can fade the whole field) */
  intensity: number
  /** page scroll progress 0..1 (whole document) */
  scroll: number
  /** 0 = hero composition (many ribbons), 1 = page mode (one guiding streak) */
  pageMode: number
}

export const FX_DEFAULT: FxState = {
  glow: null,
  streaks: 0,
  speed: 1,
  sparkle: false,
  followMouse: false,
  intensity: 1,
  scroll: 0,
  pageMode: 0,
}

/** The fully "typed" scene, used when the sketch has run (and for reduced motion / no-JS fallbacks). */
export const FX_FINAL: FxState = {
  ...FX_DEFAULT,
  glow: 'purple',
  streaks: 5,
  speed: 2,
  sparkle: true,
  followMouse: true,
}

type Listener = (s: FxState) => void

let state: FxState = { ...FX_DEFAULT }
const listeners = new Set<Listener>()

export const fx = {
  get: (): FxState => state,
  set(partial: Partial<FxState>) {
    state = { ...state, ...partial }
    listeners.forEach((l) => l(state))
  },
  reset() {
    fx.set({ ...FX_DEFAULT })
  },
  subscribe(l: Listener): () => void {
    listeners.add(l)
    return () => {
      listeners.delete(l)
    }
  },
}
