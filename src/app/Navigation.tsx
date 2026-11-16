'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Cross2Icon, HamburgerMenuIcon } from '@radix-ui/react-icons'
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
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const btn = useRef<HTMLButtonElement>(null)

  useEffect(() => setOpen(false), [pathname])

  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 8)
    on()
    window.addEventListener('scroll', on, { passive: true })
    return () => window.removeEventListener('scroll', on)
  }, [])

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
      <div className="container-x flex h-12 items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-2 rounded-md text-[1rem] font-semibold text-text">
          <Image src={logo} alt="" sizes="24px" priority className="logo-mark h-6 w-6" />
          Hackathon4Kids
        </Link>

        <nav aria-label="Main" className="hidden md:block">
          <ul className="flex items-center gap-6">
            {links.map((l) => (
              <li key={l.href}>
                <Link href={l.href} aria-current={current(l.href)} className="nav-link-d relative">
                  {l.label}
                  {current(l.href) && <span className="nav-pill" aria-hidden />}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex items-center gap-2">
          <a href={MAILING_LIST} target="_blank" rel="noopener noreferrer" className="nav-cta hidden md:inline-flex">
            Get class dates
            <span className="sr-only"> (opens in a new tab)</span>
          </a>
          <button
            ref={btn}
            type="button"
            className="-mr-2.5 flex h-11 w-11 items-center justify-center rounded-full md:hidden"
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label={open ? 'Close menu' : 'Open menu'}
            onClick={() => setOpen((o) => !o)}
          >
            <span className="menu-ico" aria-hidden>
              <HamburgerMenuIcon width={22} height={22} />
              <Cross2Icon width={22} height={22} />
            </span>
          </button>
        </div>
      </div>

      <div id="mobile-menu" className="mobile-sheet md:hidden" data-open={open} inert={!open}>
        <ul>
          {links.map((l, i) => (
            <li key={l.href} style={{ '--i': i } as React.CSSProperties}>
              <Link href={l.href} aria-current={current(l.href)} className="m-link">
                {l.label}
              </Link>
            </li>
          ))}
          <li style={{ '--i': links.length } as React.CSSProperties} className="pt-6">
            <EmailCta />
          </li>
        </ul>
        <p className="m-contact">
          <a href={`mailto:${EMAIL}`}>{EMAIL}</a>
        </p>
      </div>
    </header>
  )
}
