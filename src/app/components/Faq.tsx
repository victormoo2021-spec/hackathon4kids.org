import Link from 'next/link'
import { ChevronDownIcon } from '@radix-ui/react-icons'
import Block from './Block'
import { faq } from '../content/faq'

type FaqProps = { id?: string; headingId?: string; heading?: string; items?: typeof faq }

const linkCls =
  'font-semibold underline underline-offset-4 decoration-2 hover:decoration-4 focus-visible:outline-2 focus-visible:outline-offset-2'

export default function Faq({ id, headingId, heading = 'Questions parents ask', items = faq }: FaqProps) {
  return (
    <div id={id}>
      <h2 id={headingId} className="h-section">{heading}</h2>
      <div className="mt-8 grid items-start gap-3 lg:grid-cols-2 lg:gap-x-6">
        {items.map(({ q, a, link }) => (
          <Block key={q} color="yellow" bodyClassName="px-0 py-0">
            <details className="group">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 text-lg font-semibold text-ink [&::-webkit-details-marker]:hidden">
                {q}
                <ChevronDownIcon
                  aria-hidden
                  className="size-6 shrink-0 transition-transform motion-reduce:transition-none group-open:rotate-180"
                />
              </summary>
              <div className="px-5 pb-5 text-ink">
                <p className="max-w-prose">{a}</p>
                {link && (
                  <p className="mt-3">
                    {link.external ? (
                      <a
                        href={link.href}
                        className={linkCls}
                        {...(link.href.startsWith('http') ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                      >
                        {link.label}
                      </a>
                    ) : (
                      <Link href={link.href} className={linkCls}>
                        {link.label}
                      </Link>
                    )}
                  </p>
                )}
              </div>
            </details>
          </Block>
        ))}
      </div>
    </div>
  )
}
