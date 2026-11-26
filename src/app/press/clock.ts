// Shared 15Hz tick. No subscriber, hidden tab or reduced motion => no rAF scheduled.
export const TICK_MS = 1000 / 15
type Fn = (tick: number, ms: number) => void
const subs = new Set<Fn>()
let raf = 0
let last = 0
let tick = 0

export const reduced = () => typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches

function loop(t: number) {
  raf = 0
  if (!subs.size || document.hidden || reduced()) return
  if (!last) last = t
  if (t - last >= TICK_MS) {
    last = t - ((t - last) % TICK_MS)
    tick++
    subs.forEach((f) => f(tick, t))
  }
  raf = requestAnimationFrame(loop)
}
function wake() {
  if (!raf && subs.size && !document.hidden && !reduced()) {
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
    if (!subs.size && raf) {
      cancelAnimationFrame(raf)
      raf = 0
    }
  }
}
