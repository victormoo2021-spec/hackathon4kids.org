'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import logo from 'public/logo.png'
import EmailCta from './components/EmailCta'
import { contest, MAILING_LIST } from './content/contest'

const EMAIL = 'hackathon4kidsevent@gmail.com'

const links = [
  { href: '/programs', label: 'Programs' },
  { href: '/about', label: 'About' },
  ...(contest.active ? [{ href: contest.href, label: contest.navLabel }] : []),
]

export default function Navigation() {
  const pathname = usePathname()
  const home = pathname === '/'
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  // on home the nav CTA waits until the hero CTA has left the screen
  const [heroCta, setHeroCta] = useState(home)
  const btn = useRef<HTMLButtonElement>(null)

  useEffect(() => setOpen(false), [pathname])

  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 8)
    on()
    window.addEventListener('scroll', on, { passive: true })
    return () => window.removeEventListener('scroll', on)
  }, [])

  useEffect(() => {
    const el = home ? document.getElementById('hero-cta') : null
    if (!el) return setHeroCta(false)
    const io = new IntersectionObserver(([e]) => setHeroCta(e.isIntersecting))
    io.observe(el)
    return () => io.disconnect()
  }, [home])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false)
        btn.current?.focus()
      }
    }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open])

  const current = (href: string) => (pathname.startsWith(href) ? 'page' : undefined)

  return (
    <header className="site-header" data-scrolled={scrolled} data-open={open}>
      <div className="nav-bar">
        <Link href="/" className="brand t-h3">
          <Image src={logo} alt="" sizes="28px" priority className="logo-mark" />
          Hackathon4Kids
        </Link>

        <nav aria-label="Main" className="nav-main">
          <ul>
            {links.map((l) => (
              <li key={l.href}>
                <Link href={l.href} aria-current={current(l.href)} className="nav-link t-h3">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="nav-end">
          <a href={MAILING_LIST} target="_blank" rel="noopener noreferrer" className="nav-cta t-h3" data-hidden={heroCta}>
            Get class dates
            <span className="sr-only"> (opens in a new tab)</span>
          </a>
          <button
            ref={btn}
            type="button"
            className="menu-btn"
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label={open ? 'Close menu' : 'Open menu'}
            onClick={() => setOpen((o) => !o)}
          >
            <span className="menu-ico" aria-hidden><i /><i /></span>
          </button>
        </div>
      </div>

      <div id="mobile-menu" className="mobile-sheet" data-open={open} inert={!open}>
        <ul>
          {links.map((l) => (
            <li key={l.href}>
              <Link href={l.href} aria-current={current(l.href)} className="m-link t-h2">
                {l.label}
              </Link>
            </li>
          ))}
        </ul>
        <div className="m-foot">
          <EmailCta size="lg" />
          <a href={`mailto:${EMAIL}`} className="lnk t-body">{EMAIL}</a>
        </div>
      </div>
    </header>
  )
}
