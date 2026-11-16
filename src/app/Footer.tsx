import Link from 'next/link'
import Block from './components/Block'
import { contest, MAILING_LIST } from './content/contest'

const EMAIL = 'hackathon4kidsevent@gmail.com'

export default function Footer() {
  const pages = [
    { href: '/', label: 'Home' },
    { href: '/programs', label: 'Programs' },
    { href: '/about', label: 'About' },
    ...(contest.active ? [{ href: contest.href, label: 'Code.org contest guide' }] : []),
  ]

  return (
    <footer className="section border-t-2 bg-stage/80">
      <div className="mx-auto grid w-full max-w-7xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-[auto_auto] md:justify-start md:gap-24 lg:px-10">
        <div className="max-w-xl">
        <div className="cb-stack">
          <Block color="yellow" shape="hat" className="w-fit max-w-full" bodyClassName="font-display text-lg font-bold">
            when parent has a question
          </Block>
          <Block color="teal" className="w-fit max-w-full">
            <span className="font-display font-bold">email</span>{' '}
            <a href={`mailto:${EMAIL}`} className="slot break-all font-bold underline">
              {EMAIL}
            </a>
          </Block>
          <Block color="green" href={MAILING_LIST} external className="w-fit max-w-full" bodyClassName="font-display font-bold">
            or join the mailing list
          </Block>
          <Block color="orange" shape="cap" className="w-fit max-w-full" bodyClassName="text-ink">
            <span className="font-display font-bold">stop</span>{' '}
            <span className="slot">&copy; {new Date().getFullYear()} Hackathon4Kids</span>
          </Block>
        </div>
          <p className="mt-5 max-w-[48ch] text-sm text-ink-soft">
            The sign-up form is for parents and guardians. We only use your email to send Hackathon4Kids
            updates and never sell or share it.
          </p>
        </div>

        <nav aria-label="Footer">
          <h2 className="h-card !text-lg">Pages</h2>
          <ul className="mt-3 space-y-2">
            {pages.map((p) => (
              <li key={p.href}>
                <Link href={p.href} className="nav-link font-bold">
                  {p.label}
                </Link>
              </li>
            ))}
            <li>
              <a href={MAILING_LIST} target="_blank" rel="noopener noreferrer" className="nav-link font-bold">
                Mailing list sign-up
              </a>
            </li>
          </ul>
        </nav>
      </div>
    </footer>
  )
}
