import type { Metadata } from 'next'
import Link from 'next/link'
import './pages.css'

export const metadata: Metadata = { title: 'Page not found' }

export default function NotFound() {
  return (
    <section className="nf">
      <div className="grid-x items-center">
        <div className="nf-text">
          <p data-ink="stamp" className="t-fact" aria-hidden>404</p>
          <h1 data-ink="wipe" data-i="2" className="t-h3 mt-6">Page not found</h1>
          <p className="t-body mt-2">This page does not exist or has moved</p>
          <div className="row">
            <Link href="/" className="btn btn-primary">Home</Link>
            <Link href="/programs" className="pg-link">Programs</Link>
          </div>
        </div>
        <div aria-hidden className="nf-misprint"><i /><i /><b className="dot" /><b className="dot" /></div>
      </div>
    </section>
  )
}
