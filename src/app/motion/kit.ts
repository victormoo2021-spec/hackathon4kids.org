// The ONLY gsap import in the app (lint-enforced). Everything here lives in one deferred async chunk.
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import type { Kit } from './index'
import { dom } from './scenes'

gsap.registerPlugin(ScrollTrigger)
gsap.defaults({ ease: 'power3.out', duration: 0.48, overwrite: 'auto' })
gsap.config({ nullTargetWarn: false })
ScrollTrigger.config({ ignoreMobileResize: true })
ScrollTrigger.defaults({ fastScrollEnd: true })

const below = (el: Element) => el.getBoundingClientRect().top >= innerHeight

// SSR state is the rest state. A scrubbed scene whose trigger is on screen when GSAP arrives starts at `rest`
// and the scrub lag eases it to its true scroll position (no snap).
const takeover: Kit['takeover'] = (a, rest) => {
  const st = (a as gsap.core.Tween).scrollTrigger
  if (!st || !st.trigger) return
  const r = (st.trigger as Element).getBoundingClientRect()
  if (r.bottom <= 0 || r.top >= innerHeight || st.progress === rest) return
  a.progress(rest)
  st.update(true)
}

const safe: Kit['safe'] = (ctx, fn) => ((...a: never[]) => ctx.add(() => fn(...a))) as typeof fn

export const kit: Kit = { gsap, ScrollTrigger, below, takeover, safe, dom: (c, ctx) => dom(kit, c, ctx) }

// Late layout (fonts, lazy canvases, FAQ open, MDX images) moves trigger positions: one debounced refresh.
const main = document.getElementById('main')
if (main && typeof ResizeObserver !== 'undefined') {
  const refresh = gsap.delayedCall(0.2, () => ScrollTrigger.refresh()).pause()
  let first = true
  new ResizeObserver(() => (first ? (first = false) : refresh.restart(true))).observe(main)
}

if (/[?&]gate\b/.test(location.search)) {
  ;(window as unknown as { __motion: unknown }).__motion = { ready: true, count: () => ScrollTrigger.getAll().length }
}
