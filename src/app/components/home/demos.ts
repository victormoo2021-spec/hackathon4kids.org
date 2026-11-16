// STUB: replaced at merge by the real demos. Same API.
export type DemoKind = 'code' | 'build' | 'math' | 'physics'

export const DEMO_CODE: Record<DemoKind, string> = {
  code: 'for i in range(60):\n    forward(i * 4)\n    left(59)',
  build: 'arm.rotate(30)\narm.grab()',
  math: 'y = 2 * x + 1\nplot(y)',
  physics: 'angle = 30\nswing(angle)',
}

export function runDemo(canvas: HTMLCanvasElement, kind: DemoKind, opts?: { calm?: boolean }): () => void {
  const ctx = canvas.getContext('2d')
  if (!ctx) return () => {}
  let raf = 0
  const t0 = performance.now()
  const draw = (now: number) => {
    const dpr = devicePixelRatio || 1
    const w = (canvas.width = canvas.clientWidth * dpr)
    const h = (canvas.height = canvas.clientHeight * dpr)
    const t = opts?.calm ? 1 : (now - t0) / 1000
    ctx.strokeStyle = '#ffd60a'
    ctx.lineWidth = dpr
    ctx.beginPath()
    for (let x = 0; x <= w; x += 4) ctx.lineTo(x, h / 2 + Math.sin(x / 40 + t * 2 + kind.length) * h * 0.3)
    ctx.stroke()
    if (!opts?.calm) raf = requestAnimationFrame(draw)
  }
  raf = requestAnimationFrame(draw)
  return () => cancelAnimationFrame(raf)
}
