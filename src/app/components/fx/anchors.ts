// Page-mode guide path, in document pixels. Measured on resize / fonts / route change, never per frame.
export type GuidePt = { x: number; y: number; w: number; b: number }

const W_HEAD = 0.016
const W_GUTTER = 0.007

export function measureGuide(vw: number): GuidePt[] {
  const sx = window.scrollX
  const sy = window.scrollY
  const clampX = (x: number) => Math.min(Math.max(x, 10), vw - 10)
  const gutter = vw < 700 ? 10 : null
  const pts: GuidePt[] = []
  let lastSide = 1
  document.querySelectorAll<HTMLElement>('[data-streak-anchor]').forEach((el) => {
    const r = el.getBoundingClientRect()
    if (!r.width) return
    const left = el.dataset.streakAnchor !== 'r'
    const c = el.closest<HTMLElement>('.container-x')?.getBoundingClientRect()
    const gx = left ? (gutter ?? clampX((c?.left ?? 0) - 28)) : gutter === null ? clampX((c?.right ?? vw) + 28) : vw - 10
    const hx = left ? r.left + sx + r.width * 0.12 : r.right + sx - r.width * 0.12
    const top = r.top + sy
    const bottom = r.bottom + sy
    pts.push({ x: gx, y: top - 80, w: W_GUTTER, b: 0.4 }, { x: hx, y: (top + bottom) / 2, w: W_HEAD, b: 1 }, { x: gx, y: bottom + 60, w: W_GUTTER, b: 0.4 })
    lastSide = left ? -1 : 1
  })
  const btn = document.querySelector<HTMLElement>('[data-streak-end]')
  if (btn) {
    const r = btn.getBoundingClientRect()
    const cx = r.left + sx + r.width / 2
    const top = r.top + sy
    const ay = top - 160
    // keep strictly increasing y: drop points that would fold back under the final curl
    while (pts.length && pts[pts.length - 1].y >= ay - 20) pts.pop()
    pts.push({ x: clampX(cx + lastSide * 0.25 * vw), y: ay, w: W_HEAD, b: 1 }, { x: cx, y: top, w: W_HEAD, b: 1 })
  }
  for (let i = 1; i < pts.length; i++) pts[i].y = Math.max(pts[i].y, pts[i - 1].y + 1)
  return pts
}
