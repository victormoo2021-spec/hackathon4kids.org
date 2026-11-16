'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Cross2Icon, HamburgerMenuIcon } from '@radix-ui/react-icons'
import logo from 'public/logo.png'
import EmailCta from './components/EmailCta'
import { contest } from './content/contest'

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
    <header className="site-header glass" data-scrolled={scrolled} data-open={open}>
      <div className="container-x flex h-14 items-center justify-between gap-4 md:h-16">
        <Link href="/" className="flex items-center gap-2.5 rounded-md text-[1.0625rem] font-semibold tracking-tight text-ink">
          <Image src={logo} alt="" sizes="36px" priority className="h-9 w-9" />
          Hackathon4Kids
        </Link>

        <nav aria-label="Main" className="hidden md:block">
          <ul className="flex items-center gap-7">
            {links.map((l) => (
              <li key={l.href}>
                <Link href={l.href} aria-current={current(l.href)} className="nav-link-d">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex items-center gap-2">
          <div className="hidden md:block">
            <EmailCta compact />
          </div>
          <button
            ref={btn}
            type="button"
            className="-mr-2 flex h-11 w-11 items-center justify-center rounded-full md:hidden"
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label={open ? 'Close menu' : 'Open menu'}
            onClick={() => setOpen((o) => !o)}
          >
            {open ? <Cross2Icon aria-hidden width={22} height={22} /> : <HamburgerMenuIcon aria-hidden width={22} height={22} />}
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
