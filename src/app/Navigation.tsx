'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Cross2Icon, HamburgerMenuIcon } from '@radix-ui/react-icons'
import logo from 'public/logo.png'
import Block from './components/Block'
import { contest, MAILING_LIST } from './content/contest'

const links = [
  { href: '/', label: 'Home' },
  { href: '/programs', label: 'Programs' },
  { href: '/about', label: 'About' },
]

export default function Navigation() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  useEffect(() => setOpen(false), [pathname])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open])

  const isActive = (href: string) => (href === '/' ? pathname === '/' : pathname.startsWith(href))

  const items = (
    <>
      {links.map((l, i) => (
        <li key={l.href} style={{ '--i': i } as React.CSSProperties}>
          <Link
            href={l.href}
            aria-current={isActive(l.href) ? 'page' : undefined}
            className="nav-link block rounded-md px-2 py-2 text-lg font-bold"
          >
            {l.label}
          </Link>
        </li>
      ))}
      {contest.active && (
        <li style={{ '--i': links.length } as React.CSSProperties}>
          <Block
            color="yellow"
            shape="hat"
            href={contest.href}
            className="cb-cap"
            bodyClassName="px-4 py-1.5 font-display font-bold"
          >
            {contest.navLabel}
          </Block>
        </li>
      )}
      <li style={{ '--i': links.length + 1 } as React.CSSProperties}>
        <Block
          color="green"
          shape="cap"
          href={MAILING_LIST}
          external
          bodyClassName="px-4 pt-3 pb-2 font-display font-bold"
        >
          Join mailing list
        </Block>
      </li>
    </>
  )

  return (
    <header className="mx-auto w-full max-w-7xl px-4 pt-4 sm:px-6 lg:px-10">
      <nav aria-label="Main" className="flex items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-3 rounded-md font-display text-xl font-extrabold text-ink">
          <Image src={logo} alt="" className="h-9 w-9" priority />
          Hackathon4Kids
        </Link>

        <ul className="hidden items-center gap-5 md:flex">{items}</ul>

        <button
          type="button"
          className="flex items-center gap-2 rounded-md px-3 py-2 font-bold md:hidden"
          aria-expanded={open}
          aria-controls="mobile-menu"
          onClick={() => setOpen((o) => !o)}
        >
          {open ? <Cross2Icon aria-hidden width={20} height={20} /> : <HamburgerMenuIcon aria-hidden width={20} height={20} />}
          Menu
        </button>
      </nav>

      <ul
        id="mobile-menu"
        hidden={!open}
        className="mt-3 flex flex-col items-start gap-3 rounded-lg border-2 bg-stage p-4 md:hidden"
      >
        {items}
      </ul>
    </header>
  )
}
