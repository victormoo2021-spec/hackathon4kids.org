import Link from 'next/link'
import { MAILING_LIST, contest } from './content/contest'

const EMAIL = 'hackathon4kidsevent@gmail.com'

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="grid-x foot-grid">
        <div className="foot-about">
          <p className="t-h3">Hackathon4Kids</p>
          <p className="t-body">Free computer science and STEM classes for kids in grades 3 to 8, taught by high-school students.</p>
        </div>
        <nav aria-label="Footer" className="foot-nav">
          <h2 className="t-h3">Explore</h2>
          <ul>
            <li><Link href="/programs" className="f-link t-body">Programs</Link></li>
            <li><Link href="/about" className="f-link t-body">About</Link></li>
            {contest.active && <li><Link href={contest.href} className="f-link t-body">{contest.navLabel}</Link></li>}
            <li><Link href="/#faq" className="f-link t-body">FAQ</Link></li>
          </ul>
        </nav>
        <div className="foot-contact">
          <h2 className="t-h3">Contact</h2>
          <a href={`mailto:${EMAIL}`} className="f-link t-body">{EMAIL}</a>
          <a href={MAILING_LIST} target="_blank" rel="noopener noreferrer" className="f-link f-y t-body">
            Get class dates by email
            <span className="sr-only"> (opens in a new tab)</span>
          </a>
        </div>
        <p className="foot-fine t-body">
          The sign-up form is for parents and guardians. We only use your email to send Hackathon4Kids updates and never sell or share it. &copy; {new Date().getFullYear()} Hackathon4Kids
        </p>
      </div>
    </footer>
  )
}
