// Motion attribute runtime: [data-ink] / [data-i] / [data-plate]+[data-t]. One IntersectionObserver.
// Below-fold elements get .pre (JS only); entering adds .in; force-cleared after 2.5s so nothing stays hidden.
let io: IntersectionObserver | undefined

const reveal = (el: Element) => {
  el.classList.remove('pre')
  el.classList.add('in')
}

export function observe(root: ParentNode = document): () => void {
  const rm = matchMedia('(prefers-reduced-motion: reduce)').matches
  const sda = document.documentElement.dataset.sda === 'on' // scroll-scrubbed elements are CSS-driven: never .pre/.in
  const els = Array.from(root.querySelectorAll<HTMLElement>('[data-ink]:not(.in)')).filter((el) => !(sda && el.dataset.scrub))
  els.forEach((el) => {
    el.style.setProperty('--d', `calc(${el.dataset.i || 0} * var(--tick))`)
    if (el.dataset.plate && el.dataset.t == null) el.dataset.t = el.textContent || ''
  })
  if (rm || !('IntersectionObserver' in window)) {
    els.forEach(reveal)
    return () => {}
  }
  io ||= new IntersectionObserver(
    (es) =>
      es.forEach((e) => {
        if (e.isIntersecting) {
          reveal(e.target)
          io!.unobserve(e.target)
        }
      }),
    { threshold: 0.2 },
  )
  const vh = innerHeight
  const pending = els.filter((el) => {
    if (el.getBoundingClientRect().top < vh) {
      reveal(el) // above the fold: never hidden
      return false
    }
    el.classList.add('pre')
    io!.observe(el)
    return true
  })
  const t = setTimeout(() => pending.forEach((el) => { reveal(el); io!.unobserve(el) }), 2500)
  return () => {
    clearTimeout(t)
    pending.forEach((el) => io!.unobserve(el))
  }
}
