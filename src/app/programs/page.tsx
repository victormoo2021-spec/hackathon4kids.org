import Image, { type StaticImageData } from 'next/image'
import EmailCta from '../components/EmailCta'
import Reveal from '../components/motion/Reveal'
import { categories, type Course } from '../content/courses'
import flyerSummer2023 from 'public/flyer-summer-2023.png'
import flyerContestWinter24 from 'public/H4K_Coding_Competition_Flyer_Winter_24.jpg'
import flyerContest from 'public/H4K_Coding_Competition_Flyer.png'
import '../pages.css'

export const metadata = {
  title: 'Programs',
  description:
    'Free computer science and STEM classes for kids in grades 3 to 8: Python, game development, robotics, math, and physics, taught by high-school students.',
}

const blurbs: Record<Course, string> = {
  Python: 'A first text-based programming language, written and run line by line.',
  'Game Development': 'Using code to design and build games.',
  Robotics: 'Writing programs that control a real robot.',
  'Git + GitHub': 'The tools programmers use to save, track, and share their code.',
  'AP CSA': 'Java programming, following the AP Computer Science A course.',
  'Intro to Algebra': 'Variables, expressions, and equations, the start of algebra.',
  'AMC 8': 'Practice for the AMC 8 middle school math competition.',
  'AMC 10': 'Practice for the AMC 10 math competition.',
  'Intro to Physics': 'How things move, and the forces that move them.',
  'AP Physics 1': 'Mechanics, following the AP Physics 1 course.',
}

const facts = ['Grades 3-8', 'In person and online', 'Free', 'Up to 20 kids per class', 'One instructor per class']

function Flyer({ src, file, alt, caption }: { src: StaticImageData; file: string; alt: string; caption: string }) {
  return (
    <figure className="w-full max-w-xs">
      <a
        href={`/${file}`}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`Open full-size flyer: ${caption}`}
        className="lift block overflow-hidden rounded-[1.75rem] bg-mist p-4 sm:p-5"
      >
        <Image src={src} alt={alt} sizes="(min-width: 640px) 24rem, 90vw" className="h-auto w-full rounded-2xl" />
      </a>
      <figcaption className="mt-3 text-center text-sm text-ink-soft">{caption}</figcaption>
    </figure>
  )
}

function Visual({ name }: { name: (typeof categories)[number]['name'] }) {
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

export default function Programs() {
  return (
    <div className="text-ink">
      <Reveal className="container-x page-hero">
        <h1 data-reveal className="t-headline">Programs</h1>
        <p data-reveal className="t-lede mt-5">
          Free computer science and STEM classes for kids in grades 3 to 8, taught by high-school students.
        </p>
        <ul data-reveal aria-label="At a glance" className="mt-10 flex flex-wrap gap-2.5">
          {facts.map((f) => (
            <li key={f} className="rounded-full bg-mist px-4 py-2 text-sm font-medium">{f}</li>
          ))}
        </ul>
      </Reveal>

      <Reveal as="section" className="container-x page-section" aria-labelledby="courses">
        <h2 id="courses" data-reveal className="t-headline">Courses we teach</h2>
        <p data-reveal className="t-lede mt-4 max-w-xl">
          Each program offers some of these. Get class dates by email to hear which ones are next.
        </p>
        <div className="mt-12 grid gap-5 md:grid-cols-2">
          {categories.map((c) => (
            <section
              key={c.name}
              data-reveal
              className="course-tile card lift flex flex-col gap-6 p-7 sm:flex-row sm:items-start sm:justify-between md:p-9"
              style={{ '--hue': c.hue } as React.CSSProperties}
              aria-labelledby={`cat-${c.name}`}
            >
              <div>
                <h3 id={`cat-${c.name}`} className="t-title">{c.name}</h3>
                <ul className="mt-5 space-y-4">
                  {c.courses.map((name) => (
                    <li key={name}>
                      <span className="block text-lg font-semibold text-ink">{name}</span>
                      <span className="block text-ink-soft">{blurbs[name]}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="course-visual" style={{ color: c.hue }}>
                <Visual name={c.name} />
              </div>
            </section>
          ))}
        </div>
      </Reveal>

      <Reveal as="section" className="container-x page-section" aria-labelledby="past">
        <h2 id="past" data-reveal className="t-headline">Past programs</h2>
        <div className="mt-12 grid gap-5 md:grid-cols-3">
          <div data-reveal className="card p-7 md:col-span-3 md:p-9">
            <h3 className="t-title">Summer 2021</h3>
            <p className="mt-3 max-w-[60ch] text-lg text-ink-soft">Our summer program in 2021.</p>
          </div>
          <div data-reveal className="card flex flex-col gap-6 p-7 md:p-9">
            <div>
              <h3 className="t-title">Summer 2023</h3>
              <p className="mt-3 text-lg text-ink-soft">
                Free STEM camps across the summer: AMC 10, AP Physics 1, AP CSA, Programming for Robotics, and Modern React.
              </p>
            </div>
            <div className="flex flex-wrap items-start gap-6">
              <Flyer src={flyerSummer2023} file="flyer-summer-2023.png" caption="Past program flyer" alt="Flyer: Free STEM Camps, join Hackathon4Kids this summer. July 3-7, 3-5pm PT, AMC 10. July 10-14, 1-3pm PT, AP Physics 1. July 17-21, 1-3pm PT, AP CSA. July 26-29, 2-4pm PT, Programming for Robotics. July 31-Aug 4, 2-4pm PT, Modern React." />
            </div>
          </div>
          <div data-reveal className="card flex flex-col gap-6 p-7 md:col-span-2 md:p-9">
            <div>
              <h3 className="t-title">Past coding contests</h3>
              <p className="mt-3 text-lg text-ink-soft">
                A coding competition for grades K to 8 on Code.org, where students worked at their own pace and competed for awards.
              </p>
            </div>
            <div className="flex flex-wrap items-start gap-6">
              <Flyer src={flyerContestWinter24} file="H4K_Coding_Competition_Flyer_Winter_24.jpg" caption="Past contest flyer" alt="Flyer: Hackathon4Kids coding competition, K-8th grade, Oct 12th to Nov 8th. Learn coding through code.org at your own pace and compete for awards; winners awarded November 16th, 2024 at the Bascom Community Room, Bascom Library. Prize pool up to $2,000." />
              <Flyer src={flyerContest} file="H4K_Coding_Competition_Flyer.png" caption="Past contest flyer" alt="Flyer: Hackathon4Kids Coding Competition, K-8th grade, January 10th to February 7th. Learn coding through code.org at your own pace and compete for awards; winners awarded February 10th at Educational Park Library. Prize pool up to $2,000." />
            </div>
          </div>
        </div>
      </Reveal>

      <Reveal as="section" className="container-x page-section pb-28" aria-labelledby="next">
        <h2 id="next" data-reveal className="t-headline">Joining a contest</h2>
        <p data-reveal className="t-lede mt-4 max-w-xl">
          Contests run on Code.org. The instructions page shows parents how to get their child signed in and ready.
        </p>
        <div data-reveal className="mt-8 flex flex-wrap items-center gap-4">
          <EmailCta size="lg" />
          <a href="/code.org" className="btn btn-secondary btn-lg">Contest instructions</a>
        </div>
      </Reveal>
    </div>
  )
}
