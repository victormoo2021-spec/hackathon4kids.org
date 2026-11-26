// First-load safe: NO gsap import here (type-only imports are erased). The gsap chunk is fetched at idle by loadMotion().
import type { gsap as GSAP } from 'gsap'
import type { ScrollTrigger as ST } from 'gsap/ScrollTrigger'

type Anim = gsap.core.Animation
export type Conditions = { motion: boolean; mid: boolean; wide: boolean; fine: boolean }
export type Kit = {
  gsap: typeof GSAP
  ScrollTrigger: typeof ST
  below(el: Element): boolean
  takeover(a: Anim, rest: 0 | 1): void
  safe<F extends (...a: never[]) => unknown>(ctx: gsap.Context, fn: F): F
  dom(c: Conditions, ctx: gsap.Context): void | (() => void)
}

const QUERIES = {
  motion: '(prefers-reduced-motion: no-preference)',
  mid: '(min-width: 48rem)',
  wide: '(min-width: 64rem)',
  fine: '(hover: hover) and (pointer: fine)',
}

let kit: Promise<Kit | null> | undefined
export function loadMotion(): Promise<Kit | null> {
  return (kit ||= new Promise((res) => {
    const nav = navigator as Navigator & { connection?: { saveData?: boolean } }
    if (matchMedia('(prefers-reduced-motion: reduce)').matches || nav.connection?.saveData) return res(null)
    let done = false
    const go = () => {
      if (done) return
      done = true
      import('./kit').then((m) => res(m.kit), () => res(null)) // load failure => the static site stays as is
    }
    const idle = () => ('requestIdleCallback' in window ? requestIdleCallback(go, { timeout: 2000 }) : setTimeout(go, 200))
    document.readyState === 'complete' ? idle() : addEventListener('load', idle, { once: true })
    for (const e of ['scroll', 'pointerdown', 'keydown']) addEventListener(e, go, { once: true, passive: true }) // intent beats idle
  }))
}

export function scene(scope: Element | null, build: (k: Kit, c: Conditions, ctx: gsap.Context) => void | (() => void)) {
  let mm: gsap.MatchMedia | undefined
  let dead = false
  loadMotion().then((k) => {
    if (!k || dead) return
    mm = k.gsap.matchMedia(scope ?? undefined)
    mm.add(QUERIES, (ctx) => {
      const c = ctx.conditions as Conditions
      return c.motion ? build(k, c, ctx) : undefined
    })
  })
  return () => {
    dead = true
    mm?.revert()
  }
}
