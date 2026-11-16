import { ArrowRightIcon } from '@radix-ui/react-icons'
import { MAILING_LIST } from '../content/contest'

type EmailCtaProps = {
  size?: 'md' | 'lg'
  /** short label for tight spaces like the nav */
  compact?: boolean
  /** show the "No spam" reassurance line under the button */
  reassure?: boolean
  align?: 'start' | 'center'
}

// The one primary action on the site. Copy is fixed: do not reword.
export default function EmailCta({ size = 'md', compact, reassure, align = 'start' }: EmailCtaProps) {
  return (
    <div className={`inline-flex flex-col ${align === 'center' ? 'items-center text-center' : 'items-start'} gap-2`}>
      <a
        href={MAILING_LIST}
        target="_blank"
        rel="noopener noreferrer"
        className={`btn btn-primary ${size === 'lg' ? 'btn-lg' : ''}`}
      >
        {compact ? 'Get class dates' : 'Get class dates by email'}
        {!compact && <ArrowRightIcon aria-hidden width={18} height={18} />}
        <span className="sr-only"> (opens in a new tab)</span>
      </a>
      {reassure && <p className="text-sm text-text-body">No spam. Unsubscribe anytime.</p>}
    </div>
  )
}
