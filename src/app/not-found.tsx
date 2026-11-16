import type { Metadata } from 'next'
import Link from 'next/link'
import './pages.css'

export const metadata: Metadata = { title: 'Page not found' }

export default function NotFound() {
  return (
    <section className="container-x page-hero flex flex-col items-start gap-8">
      {/* opacity-only type-in, 45ms per line; ends visible */}
      <style>{'.l{animation:l-in .35s var(--ease-out,ease-out) both;animation-delay:calc(var(--i)*45ms + 300ms)}@keyframes l-in{from{opacity:0}}'}</style>
      <div aria-hidden className="card w-full max-w-md overflow-hidden">
        <div className="flex gap-1.5 border-b border-line px-4 py-3">
          <span className="h-3 w-3 rounded-full bg-raised" />
          <span className="h-3 w-3 rounded-full bg-raised" />
          <span className="h-3 w-3 rounded-full bg-raised" />
        </div>
        <pre className="px-5 py-6 font-mono text-sm leading-7 text-text-dim"><span className="l" style={{ '--i': 0 } as React.CSSProperties}><span className="text-purple-soft">$</span> <span className="text-text">open /nope</span></span>{'\n'}<span className="l" style={{ '--i': 1 } as React.CSSProperties}><span className="text-yellow">404:</span> page not found</span></pre>
      </div>
      <h1 className="t-headline max-w-3xl">This page took a wrong turn.</h1>
      <p className="t-lede">The page you are looking for does not exist or has moved.</p>
      <div className="flex flex-wrap gap-3">
        <Link href="/" className="btn btn-primary">Home</Link>
        <Link href="/programs" className="btn btn-secondary">Programs</Link>
      </div>
    </section>
  )
}
