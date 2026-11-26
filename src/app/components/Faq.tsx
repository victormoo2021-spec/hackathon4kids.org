import Link from 'next/link'
import { faq } from '../content/faq'
import { MAILING_LIST } from '../content/contest'

function FaqLink({ href, label }: { href: string; label: string }) {
  if (href.startsWith('/')) return <Link href={href} className="lnk">{label}</Link>
  if (href.startsWith('http'))
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className="lnk">
        {href === MAILING_LIST ? 'Get class dates by email' : label}<span className="sr-only"> (opens in a new tab)</span>
      </a>
    )
  return <a href={href} className="lnk">{label}</a>
}

export default function Faq({ headingId }: { headingId?: string }) {
  return (
    <div className="faq grid-x">
      <h2 id={headingId} className="t-h2 faq-h plate" data-ink="wipe" data-plate data-t="Questions parents ask">Questions parents ask</h2>
      <div className="faq-list">
        {faq.map(({ q, a, link }, i) => (
          <details key={q} className="faq-item" data-ink="rule" data-i={Math.min(i, 6)}>
            <summary className="t-h3">
              {q}
              <span className="plus" aria-hidden><i /><i /></span>
            </summary>
            <div className="faq-ans t-body">
              <p>{a}</p>
              {link && <p><FaqLink {...link} /></p>}
            </div>
          </details>
        ))}
      </div>
    </div>
  )
}
