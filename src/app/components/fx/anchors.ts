// Page-mode guide path, in document pixels. Measured on resize / fonts / route change, never per frame.
export type GuidePt = { x: number; y: number; w: number; b: number }

const W_HEAD = 0.016
const W_GUTTER = 0.007

export function measureGuide(vw: number): GuidePt[] {
  const sx = window.scrollX
  const sy = window.scrollY
  const mob = vw < 700
  const k = mob ? 0.6 : 1
  const wg = mob ? 0.004 : W_GUTTER
  const wh = mob ? 0.01 : W_HEAD
  const clampX = (x: number) => Math.min(Math.max(x, 10), vw - 10)
  // the guide lives in the left gutter; it only steps toward a heading's first letters and returns at once
  const gutterOf = (el: HTMLElement) => {
    if (mob) return 10
    const c = el.closest<HTMLElement>('.container-x')?.getBoundingClientRect()
    return clampX((c?.left ?? 38) - 28)
  }
  const pts: GuidePt[] = []
  document.querySelectorAll<HTMLElement>('[data-streak-anchor]').forEach((el) => {
    const r = el.getBoundingClientRect()
    if (!r.width || el.closest('#join') || getComputedStyle(el).textAlign === 'center') return
    const gx = gutterOf(el)
    const heading = /^H[1-6]$/.test(el.tagName)
    const hx = heading ? Math.max(gx, Math.min(r.left + sx + Math.min(r.width * 0.12, 36), vw - 10)) : gx
    const top = r.top + sy
    const bottom = r.bottom + sy
    const mid = heading ? top + Math.min(r.height / 2, 40) : (top + bottom) / 2
    pts.push(
      { x: gx, y: top - 24, w: wg, b: 0.4 * k },
      { x: hx, y: mid, w: heading ? wh : wg, b: heading ? k : 0.4 * k },
      { x: gx, y: Math.min(bottom, mid + 40) + 4, w: wg, b: 0.4 * k },
    )
  })
  const btn = document.querySelector<HTMLElement>('[data-streak-end]')
  if (btn) {
    const r = btn.getBoundingClientRect()
    const cx = r.left + sx + r.width / 2
    const top = r.top + sy
    const gx = gutterOf(btn)
    // gutter, then a short curl that lands on the button's top edge (not past it)
    while (pts.length && pts[pts.length - 1].y >= top - 70) pts.pop()
    pts.push({ x: gx, y: top - 70, w: wg, b: 0.4 * k }, { x: (gx + cx) / 2, y: top - 30, w: wh, b: k }, { x: cx, y: top, w: wh, b: k })
  }
  for (let i = 1; i < pts.length; i++) pts[i].y = Math.max(pts[i].y, pts[i - 1].y + 1)
  return pts
}
