import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = { title: 'Page not found' }

export default function NotFound() {
  return (
    <section className="container-x section-y flex flex-col items-start gap-8">
      <div aria-hidden className="card w-full max-w-sm overflow-hidden">
        <div className="flex gap-1.5 border-b border-hairline px-4 py-3">
          <span className="h-3 w-3 rounded-full bg-[#ff5f57]" />
          <span className="h-3 w-3 rounded-full bg-[#febc2e]" />
          <span className="h-3 w-3 rounded-full bg-[#28c840]" />
        </div>
        <pre className="px-5 py-6 font-mono text-sm text-ink-soft"><span className="text-accent">const</span> page = <span className="text-ink">404</span>;{'\n'}{'// not found'}</pre>
      </div>
      <h1 className="t-display max-w-3xl">This page took a wrong turn.</h1>
      <p className="t-lede max-w-xl">The page you are looking for does not exist or has moved.</p>
      <div className="flex flex-wrap gap-3">
        <Link href="/" className="btn btn-primary">Home</Link>
        <Link href="/programs" className="btn btn-secondary">Programs</Link>
      </div>
    </section>
  )
}
