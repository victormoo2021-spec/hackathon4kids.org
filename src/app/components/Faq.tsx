import Link from 'next/link'
import { faq } from '../content/faq'

type FaqProps = { id?: string; headingId?: string; heading?: string; items?: typeof faq }

const linkCls = 'font-semibold text-accent underline underline-offset-4 hover:decoration-2'

export default function Faq({ id, headingId, heading = 'Questions parents ask', items = faq }: FaqProps) {
  return (
    <div id={id} className="grid gap-12 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-20">
      <h2 id={headingId} className="t-headline">{heading}</h2>
      <div className="faq-list">
        {items.map(({ q, a, link }) => (
          <details key={q} className="faq-item">
            <summary className="flex cursor-pointer items-center justify-between gap-6 py-6 text-xl font-semibold tracking-tight text-ink md:text-2xl">
              {q}
              <span aria-hidden className="faq-icon text-ink-soft" />
            </summary>
            <div className="pb-7 text-lg text-ink-soft">
              <p className="max-w-prose">{a}</p>
              {link && (
                <p className="mt-3">
                  {link.external ? (
                    <a href={link.href} className={linkCls} {...(link.href.startsWith('http') ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>
                      {link.label}
                    </a>
                  ) : (
                    <Link href={link.href} className={linkCls}>{link.label}</Link>
                  )}
                </p>
              )}
            </div>
          </details>
        ))}
      </div>
    </div>
  )
}
