'use client'

import Link from 'next/link'
import { useRef } from 'react'
import { ArrowRightIcon } from '@radix-ui/react-icons'
import Reveal from '../motion/Reveal'
import { categories } from '../../content/courses'

type Cat = (typeof categories)[number]

function Visual({ name }: { name: Cat['name'] }) {
  const common = {
    'aria-hidden': true,
    viewBox: '0 0 200 120',
    className: 'h-full w-full',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 3,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  }
  if (name === 'Code')
    return (
      <svg {...common}>
        <rect x="8" y="8" width="184" height="104" rx="14" fill="white" stroke="none" opacity=".75" />
        <circle cx="24" cy="24" r="4" fill="currentColor" stroke="none" opacity=".5" />
        <circle cx="38" cy="24" r="4" fill="currentColor" stroke="none" opacity=".3" />
        <path d="M24 46h46M34 62h78M34 78h54M24 94h30" />
        <path d="M130 52l-12 10 12 10M160 52l12 10-12 10" strokeWidth="4" />
      </svg>
    )
  if (name === 'Build')
    return (
      <svg {...common}>
        <rect x="62" y="22" width="76" height="60" rx="16" fill="white" stroke="none" opacity=".75" />
        <circle cx="86" cy="50" r="7" fill="currentColor" stroke="none" />
        <circle cx="114" cy="50" r="7" fill="currentColor" stroke="none" />
        <path d="M100 22V10M72 106V90h56v16M62 54H48M138 54h14" />
        <circle cx="46" cy="98" r="14" />
        <path d="M46 84v-4M46 116v-4M32 98h-4M64 98h-4" />
      </svg>
    )
  if (name === 'Math')
    return (
      <svg {...common}>
        <rect x="8" y="8" width="184" height="104" rx="14" fill="white" stroke="none" opacity=".75" />
        <path d="M30 20v80h150" opacity=".4" />
        <path d="M30 90C60 90 70 30 100 40s40 50 80-20" strokeWidth="4" />
        <circle cx="100" cy="40" r="6" fill="currentColor" stroke="none" />
      </svg>
    )
  return (
    <svg {...common}>
      <rect x="8" y="8" width="184" height="104" rx="14" fill="white" stroke="none" opacity=".75" />
      <path d="M24 98C60 10 120 10 176 98" strokeDasharray="2 8" strokeWidth="4" />
      <circle cx="100" cy="30" r="9" fill="currentColor" stroke="none" />
      <path d="M20 100h160" opacity=".4" />
    </svg>
  )
}

function Tile({ cat, wide }: { cat: Cat; wide?: boolean }) {
  const ref = useRef<HTMLDivElement>(null)
  const move = (e: React.PointerEvent) => {
    const el = ref.current
    if (!el || e.pointerType !== 'mouse' || !window.matchMedia('(prefers-reduced-motion: no-preference)').matches) return
    const r = el.getBoundingClientRect()
    const x = (e.clientX - r.left) / r.width - 0.5
    const y = (e.clientY - r.top) / r.height - 0.5
    el.style.setProperty('--rx', `${(-y * 5).toFixed(2)}deg`)
    el.style.setProperty('--ry', `${(x * 6).toFixed(2)}deg`)
  }
  const reset = () => {
    ref.current?.style.setProperty('--rx', '0deg')
    ref.current?.style.setProperty('--ry', '0deg')
  }
  return (
    <div data-reveal className={wide ? 'md:col-span-2' : ''}>
      <div
        ref={ref}
        onPointerMove={move}
        onPointerLeave={reset}
        className={`tile card flex h-full flex-col gap-8 p-7 md:p-9 ${wide ? 'md:flex-row md:items-center md:justify-between' : ''}`}
        style={{ '--hue': cat.hue } as React.CSSProperties}
      >
        <div>
          <h3 className="t-title">{cat.name}</h3>
          <ul className="mt-4 space-y-1.5 text-lg text-ink-soft">
            {cat.courses.map((c) => (
              <li key={c}>{c}</li>
            ))}
          </ul>
        </div>
        <div className="tile-visual" style={{ color: cat.hue }}>
          <Visual name={cat.name} />
        </div>
      </div>
    </div>
  )
}

export default function CourseGrid() {
  return (
    <Reveal as="section" id="courses" aria-labelledby="courses-title" className="container-x section-y">
      <div className="max-w-2xl">
        <h2 id="courses-title" data-reveal className="t-headline">What kids learn</h2>
        <p data-reveal className="t-lede mt-5">
          Hands-on classes that start with the basics and grow with your child, from first lines of code to AP exams.
        </p>
      </div>
      <div className="mt-14 grid gap-5 md:grid-cols-3">
        <Tile cat={categories[0]} wide />
        <Tile cat={categories[1]} />
        <Tile cat={categories[2]} />
        <Tile cat={categories[3]} wide />
      </div>
      <p data-reveal className="mt-10">
        <Link href="/programs" className="inline-flex items-center gap-2 font-semibold text-accent underline-offset-4 hover:underline">
          See all programs <ArrowRightIcon aria-hidden />
        </Link>
      </p>
    </Reveal>
  )
}
