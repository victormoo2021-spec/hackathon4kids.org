import Link from 'next/link'
import { MAILING_LIST } from './content/contest'
import { contest } from './content/contest'

const EMAIL = 'hackathon4kidsevent@gmail.com'

export default function Footer() {
  const col = 'mb-2 text-xs font-semibold tracking-normal text-text-dim'
  return (
    <footer className="site-footer">
      <div className="container-x py-12">
        <div className="footer-grid">
          <div>
            <p className="text-base font-semibold text-text">Hackathon4Kids</p>
            <p className="mt-1 max-w-[32ch]">Free computer science and STEM classes for kids in grades 3 to 8, taught by high-school students.</p>
          </div>
          <nav aria-label="Footer">
            <h2 className={col}>Explore</h2>
            <ul>
              <li><Link href="/programs" className="f-link">Programs</Link></li>
              <li><Link href="/about" className="f-link">About</Link></li>
              {contest.active && <li><Link href={contest.href} className="f-link">Contest guide</Link></li>}
              <li><Link href="/#faq" className="f-link">FAQ</Link></li>
            </ul>
          </nav>
          <div>
            <h2 className={col}>Contact</h2>
            <a href={`mailto:${EMAIL}`} className="f-link whitespace-nowrap">{EMAIL}</a>
          </div>
          <div>
            <h2 className={col}>Stay in the loop</h2>
            <a href={MAILING_LIST} target="_blank" rel="noopener noreferrer" className="f-link link">
              Get class dates by email
              <span className="sr-only"> (opens in a new tab)</span>
            </a>
          </div>
        </div>
        <p className="mt-12 max-w-[60ch] border-t border-line pt-6 text-[.8125rem]">
          The sign-up form is for parents and guardians. We only use your email to send Hackathon4Kids updates and never sell or share it.
        </p>
        <p className="mt-3 text-[.8125rem]">&copy; {new Date().getFullYear()} Hackathon4Kids</p>
      </div>
    </footer>
  )
}
