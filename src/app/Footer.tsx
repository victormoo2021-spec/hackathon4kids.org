import Link from 'next/link'
import EmailCta from './components/EmailCta'
import { contest } from './content/contest'

const EMAIL = 'hackathon4kidsevent@gmail.com'

export default function Footer() {
  const col = 'mb-3 text-xs font-semibold uppercase tracking-wider text-ink'
  return (
    <footer className="site-footer">
      <div className="container-x py-14">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <nav aria-label="Footer">
            <h2 className={col}>Explore</h2>
            <ul className="space-y-2">
              <li><Link href="/programs">Programs</Link></li>
              <li><Link href="/about">About</Link></li>
              {contest.active && <li><Link href={contest.href}>Contest guide</Link></li>}
              <li><Link href="/#faq">FAQ</Link></li>
            </ul>
          </nav>
          <div>
            <h2 className={col}>Contact</h2>
            <a href={`mailto:${EMAIL}`} className="break-all">{EMAIL}</a>
          </div>
          <div className="lg:col-span-2">
            <h2 className={col}>Stay in the loop</h2>
            <EmailCta compact />
          </div>
        </div>
        <p className="mt-12 max-w-[60ch] border-t border-hairline pt-6 text-xs leading-relaxed">
          The sign-up form is for parents and guardians. We only use your email to send Hackathon4Kids updates and never sell or share it.
        </p>
        <p className="mt-3 text-xs">&copy; {new Date().getFullYear()} Hackathon4Kids</p>
      </div>
    </footer>
  )
}
