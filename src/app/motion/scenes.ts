// DOM scenes (hero exit, statement, heads, tiles, rise, magnetic). Receives the kit; never imports gsap (see kit.ts).
// SSR state is the rest state: nothing here depends on CSS hiding anything. `rest` = progress that equals the SSR look.
import type { Kit, Conditions } from './index'

const WILL = 'transform,opacity'

export function dom(k: Kit, c: Conditions, ctx: gsap.Context): void | (() => void) {
  const { gsap, ScrollTrigger: ST, below, takeover, safe } = k
  const root = document.getElementById('main')
  if (!root) return
  const all = <T extends HTMLElement = HTMLElement>(s: string) => gsap.utils.toArray<T>(s, root)
  const one = <T extends HTMLElement = HTMLElement>(s: string) => root.querySelector<T>(s)
  const will = (targets: gsap.TweenTarget) => (st: ScrollTrigger) => gsap.set(targets, { willChange: st.isActive ? WILL : 'auto' })
  const toTake: [gsap.core.Animation, 0 | 1][] = []

  // ---- reads first (no writes yet): which rise blocks are below the fold
  const rise = all('[data-m="rise"]').filter(below)

  // ---- 1b hero exit (rest 0)
  const hero = one('#hero')
  if (hero) {
    const t = [hero.querySelector('.hs'), hero.querySelector('.hero-in')].filter(Boolean) as HTMLElement[]
    const tl = gsap.timeline({
      defaults: { ease: 'none' },
      scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom 20%', scrub: 0.4, onToggle: will(t) },
    })
    tl.to('.hs', { scale: 1.1, opacity: 0.3, duration: 1 }, 0).to('.hero-in', { yPercent: -8, opacity: 0, duration: 0.6, ease: 'power1.in' }, 0.3)
    toTake.push([tl, 0])
  }

  // ---- 2 statement (rest 1)
  const stmt = one('#statement')
  const para = stmt?.querySelector<HTMLElement>('.t-stmt')
  if (stmt && para) {
    const words = para.querySelectorAll('.w').length
    const each = 0.8 / Math.max(1, words - 1)
    const accIdx = Math.max(0, Array.from(para.querySelectorAll('.w')).findIndex((w) => w.classList.contains('acc')))
    const tl = gsap.timeline({
      defaults: { overwrite: false },
      scrollTrigger: { trigger: stmt, start: 'top 65%', end: 'bottom 75%', scrub: 0.4, onToggle: will(para) },
    })
    tl.fromTo(para, { scale: 0.96, transformOrigin: '0% 50%' }, { scale: 1, duration: 1, ease: 'none' }, 0)
      .fromTo(para.querySelectorAll('.w'), { opacity: 0.55, yPercent: 14 }, { opacity: 1, yPercent: 0, duration: 0.2, ease: 'power2.out', stagger: each }, 0)
      .to(para.querySelector('.acc'), { scale: 1.06, duration: 0.07, ease: 'power2.out', transformOrigin: '0% 80%' }, accIdx * each + 0.08)
      .to(para.querySelector('.acc'), { scale: 1, duration: 0.12, ease: 'power2.inOut' }, '>')
    toTake.push([tl, 1])
  }

  // ---- 3a headings (rest 1)
  all('[data-m="head"]').forEach((el) => {
    const tw = gsap.fromTo(
      el,
      { opacity: 0, yPercent: 35 },
      { opacity: 1, yPercent: 0, ease: 'power2.out', scrollTrigger: { trigger: el, start: 'top 95%', end: 'top 65%', scrub: 0.4 } },
    )
    toTake.push([tw, 1])
  })

  // ---- 3b tiles: one scrubbed timeline per row (rest 1)
  const ul = one('[data-m="tiles"]')
  if (ul) {
    const cols = c.mid ? 5 : 2
    const tiles = Array.from(ul.children) as HTMLElement[]
    for (let r = 0; r * cols < tiles.length; r++) {
      const row = tiles.slice(r * cols, r * cols + cols)
      const dx = c.wide ? (r === 0 ? -40 : 40) : 0
      const from = c.wide ? { y: 64, scale: 0.88 } : c.mid ? { y: 56, scale: 0.9 } : { y: 40, scale: 0.92 }
      const gap = c.mid ? 0.1 : 0.15
      // offsetTop ignores transforms; read at refresh only. li and ul share an offsetParent unless ul is positioned.
      const top = () => row[0].offsetTop - (ul.offsetParent === row[0].offsetParent ? ul.offsetTop : 0)
      const tl = gsap.timeline({
        defaults: { overwrite: false },
        scrollTrigger: { trigger: ul, scrub: 0.5, start: () => `top+=${top()} 96%`, end: () => `top+=${top()} ${c.mid ? 58 : 62}%`, onToggle: will(row) },
      })
      tl.fromTo(row, { x: dx, y: from.y }, { x: 0, y: 0, duration: 0.6, ease: 'power3.out', stagger: gap }, 0).fromTo(
        row,
        { scale: from.scale },
        { scale: 1, duration: 0.6, ease: 'back.out(1.6)', stagger: gap },
        0,
      )
      toTake.push([tl, 1])
    }
  }

  // ---- 5a rise: batch, once. In view at arm time => left static.
  if (rise.length) {
    gsap.set(rise, { opacity: 0, y: 24 })
    ST.batch(rise, {
      start: 'top 92%',
      once: true,
      interval: 0.1,
      batchMax: 8,
      onEnter: (b) => gsap.to(b, { opacity: 1, y: 0, duration: 0.48, ease: 'power3.out', stagger: 0.06, overwrite: true, clearProps: 'transform,opacity' }),
    })  }

  // one refresh, then takeovers (reads before writes)
  ST.refresh()
  toTake.forEach(([a, rest]) => takeover(a, rest))

  // ---- 8b magnetic primary CTA (fine pointers only)
  const off: (() => void)[] = []
  if (c.fine) {
    all('#hero .btn-lg, #join .btn-lg').forEach((b) => {
      // GSAP zeroes translate/scale on what it moves, so move the .cta wrapper: .btn keeps its CSS press scale.
      const btn = b.closest<HTMLElement>('.cta') ?? b
      const svg = b.querySelector('svg')
      const xTo = gsap.quickTo(btn, 'x', { duration: 0.32, ease: 'power3.out' })
      const yTo = gsap.quickTo(btn, 'y', { duration: 0.32, ease: 'power3.out' })
      const aTo = svg ? gsap.quickTo(svg, 'x', { duration: 0.48, ease: 'power3.out' }) : null
      const cx = gsap.utils.clamp(-10, 10)
      const cy = gsap.utils.clamp(-6, 6)
      const ca = gsap.utils.clamp(-4, 4)
      let r: DOMRect | null = null
      let ox = 0
      let oy = 0
      const enter = () => {
        r = btn.getBoundingClientRect()
        ox = Number(gsap.getProperty(btn, 'x')) || 0
        oy = Number(gsap.getProperty(btn, 'y')) || 0
      }
      const move = (e: PointerEvent) => {
        if (!r) enter()
        if (!r) return
        const dx = e.clientX - (r.left - ox + r.width / 2)
        const dy = e.clientY - (r.top - oy + r.height / 2)
        xTo(cx(dx * 0.25))
        yTo(cy(dy * 0.35))
        aTo?.(ca(dx * 0.08))
      }
      const leave = safe(ctx, () => {
        r = null
        gsap.to(svg ? [btn, svg] : btn, { x: 0, y: 0, duration: 0.72, ease: 'elastic.out(1, 0.5)', overwrite: true })
      })
      const drop = () => (r = null)
      btn.addEventListener('pointerenter', enter)
      btn.addEventListener('pointermove', move as EventListener)
      btn.addEventListener('pointerleave', leave)
      addEventListener('scroll', drop, { passive: true })
      off.push(() => {
        btn.removeEventListener('pointerenter', enter)
        btn.removeEventListener('pointermove', move as EventListener)
        btn.removeEventListener('pointerleave', leave)
        removeEventListener('scroll', drop)
      })
    })
  }
  return () => off.forEach((f) => f())
}
