// Web slip (4.3): scroll velocity -> blue plate tear. Quantised to the 15Hz tick, decays x0.6, snaps to 0 inside 3 ticks.
// Consumers: GL sheets read press.slip.y; DOM headings/buttons get --slip on the element ([data-plate], .btn-primary).
import { onTick, reduced } from './clock'
import { press } from './gl/press'

const MAX = 10
const DECAY = 0.6
const SNAP = 2.5 // tuned: spec x0.6 alone needs 6 ticks to reach <0.5px; snapping under 2.5px gives 10 -> 6 -> 3.6 -> 0 (3 ticks)
let users = 0
let off: (() => void) | null = null
let y = 0
let lastY = 0
let lastMs = 0
let lastSet = ''
const clamp = (v: number) => Math.max(-MAX, Math.min(MAX, v))

function paint() {
  const v = `${press.slip.y.toFixed(1)}px`
  if (v === lastSet) return
  lastSet = v
  document.querySelectorAll<HTMLElement>('[data-plate], .btn-primary').forEach((el) => el.style.setProperty('--slip', v))
}

function step(_t: number, ms: number) {
  const dt = lastMs ? ms - lastMs : 1000 / 15
  lastMs = ms
  const dy = scrollY - lastY
  const target = clamp((dy / dt) * 12)
  y = Math.abs(target) > Math.abs(y) ? target : y * DECAY
  if (Math.abs(y) < SNAP && Math.abs(target) < SNAP) y = 0
  press.slip.y = y
  paint()
  if (y === 0 && dy === 0) sleep()
}
function wake() {
  if (off || reduced()) return
  lastMs = 0
  off = onTick(step)
}
function sleep() {
  off?.()
  off = null
  lastMs = 0
  lastY = scrollY
}

/** Ref-counted; the ticker only runs while the page is moving or the plate is still off. */
export function initSlip(): () => void {
  if (reduced()) return () => {}
  lastY = scrollY
  if (users++ === 0) addEventListener('scroll', wake, { passive: true })
  return () => {
    if (--users > 0) return
    removeEventListener('scroll', wake)
    sleep()
    y = 0
    press.slip.y = 0
    paint()
  }
}

/** Press flinch: every blue plate on screen jumps by px, then re-registers. */
export function jolt(px: number) {
  if (reduced()) return
  y = clamp(y + px)
  press.slip.y = y
  paint()
  wake()
}

