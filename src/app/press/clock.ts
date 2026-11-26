// Shared 15Hz tick. No subscriber, hidden tab or reduced motion => no rAF scheduled.
export const TICK_MS = 1000 / 15
type Fn = (tick: number, ms: number) => void
const subs = new Set<Fn>()
let raf = 0
let timer = 0 // sleeps between ticks so rAF fires ~15x/s, not at display rate
let last = 0
let tick = 0

export const reduced = () => typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches

function loop(t: number) {
  raf = timer = 0
  if (!subs.size || document.hidden || reduced()) return
  if (!last) last = t
  if (t - last >= TICK_MS) {
    last = t - ((t - last) % TICK_MS)
    tick++
    subs.forEach((f) => f(tick, t))
  }
  timer = window.setTimeout(() => { timer = 0; raf = requestAnimationFrame(loop) }, Math.max(0, TICK_MS - (t - last) - 6))
}
function wake() {
  if (!raf && !timer && subs.size && !document.hidden && !reduced()) {
    last = 0
    raf = requestAnimationFrame(loop)
  }
}
if (typeof document !== 'undefined') document.addEventListener('visibilitychange', wake)

export function onTick(fn: Fn): () => void {
  subs.add(fn)
  wake()
  return () => {
    subs.delete(fn)
    if (!subs.size) {
      cancelAnimationFrame(raf); clearTimeout(timer)
      raf = timer = 0
    }
  }
}
