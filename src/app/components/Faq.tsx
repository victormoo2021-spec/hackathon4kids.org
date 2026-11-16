import Link from 'next/link'
import { faq } from '../content/faq'

const linkCls = 'link inline-flex min-h-11 items-center font-semibold'

function FaqLink({ href, label }: { href: string; label: string }) {
  if (href.startsWith('/')) return <Link href={href} className={linkCls}>{label}</Link>
  if (href.startsWith('http'))
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={linkCls}>
        {label}<span className="sr-only"> (opens in a new tab)</span>
      </a>
    )
  return <a href={href} className={linkCls}>{label}</a>
}

export default function Faq({ headingId }: { headingId?: string }) {
  return (
    <div className="grid gap-12 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-20">
      <h2 id={headingId} data-spectral data-reveal className="t-headline lg:sticky lg:top-28 lg:self-start">Questions parents ask</h2>
      <div className="faq-list">
        {faq.map(({ q, a, link }) => (
          <details key={q} data-reveal="fade" className="faq-item">
            <summary className="flex min-h-[72px] cursor-pointer items-center justify-between gap-6 py-4 text-[1.25rem] font-semibold text-text">
              {q}
              <svg aria-hidden viewBox="0 0 18 18" width="18" height="18" fill="none" stroke="#9a93ad" strokeWidth="1.5" strokeLinecap="round" className="faq-icon">
                <path d="M9 2v14M2 9h14" />
              </svg>
            </summary>
            <div className="faq-ans pb-6 text-[1.125rem] text-text-body">
              <p className="max-w-prose">{a}</p>
              {link && <p className="mt-1"><FaqLink {...link} /></p>}
            </div>
          </details>
        ))}
      </div>
    </div>
  )
}
