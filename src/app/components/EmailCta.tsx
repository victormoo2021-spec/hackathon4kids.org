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
    <div className={`cta${align === 'center' ? ' center' : ''}`}>
      <a href={MAILING_LIST} target="_blank" rel="noopener noreferrer" className={`btn btn-primary${size === 'lg' ? ' btn-lg' : ''}`}>
        {compact ? 'Get class dates' : 'Get class dates by email'}
        {!compact && (
          <svg aria-hidden viewBox="0 0 20 20" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square">
            <path d="M3 10h13M11 4l6 6-6 6" />
          </svg>
        )}
        <span className="sr-only"> (opens in a new tab)</span>
      </a>
      {reassure && <p className="t-body">No spam. Unsubscribe anytime.</p>}
    </div>
  )
}
