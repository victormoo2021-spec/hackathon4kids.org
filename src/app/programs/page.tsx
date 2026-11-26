import Image, { type StaticImageData } from 'next/image'
import EmailCta from '../components/EmailCta'
import Reveal from '../components/reveal/Reveal'
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
    <figure data-reveal className="w-full max-w-[280px]">
      <a
        href={`/${file}`}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`Open full-size flyer: ${caption}`}
        className="flyer block overflow-hidden rounded-xl border border-line opacity-90 transition-opacity hover:opacity-100 focus-visible:opacity-100"
      >
        <Image src={src} alt={alt} sizes="280px" className="block h-auto w-full" />
      </a>
      <figcaption className="mt-3 text-[0.875rem] text-text-body">{caption}</figcaption>
    </figure>
  )
}

export default function Programs() {
  return (
    <div className="text-text">
      <Reveal className="container-x page-hero">
        <h1 data-reveal className="t-headline">Programs</h1>
        <p data-reveal className="t-lede mt-5">
          Free computer science and STEM classes for kids in grades 3 to 8, taught by high-school students.
        </p>
        <ul data-reveal aria-label="At a glance" className="mt-10 flex flex-wrap gap-x-3 gap-y-1 text-text-body">
          {facts.map((f, i) => (
            <li key={f}>
              {i > 0 && <span aria-hidden className="mr-3">·</span>}
              {f}
            </li>
          ))}
        </ul>
      </Reveal>

      <Reveal as="section" className="container-x page-section" aria-labelledby="courses">
        <h2 id="courses" data-reveal className="t-headline">Courses we <span className="hl">teach</span></h2>
        <p data-reveal className="t-lede mt-4 max-w-xl">
          Each program offers some of these. Get class dates by email to hear which ones are next.
        </p>
        <div className="mt-12 border-t border-line">
          {categories.map((c) => (
            <section key={c.name} data-reveal="rule" className="relative grid gap-4 py-8 after:absolute after:inset-x-0 after:bottom-0 after:h-px after:origin-left after:bg-line after:[transform:scaleX(var(--rule,1))] md:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] md:gap-10 md:py-10" aria-labelledby={`cat-${c.name}`}>
              <h3 id={`cat-${c.name}`} data-reveal className="t-title text-text">{c.name}</h3>
              <ul className="divide-y divide-line">
                {c.courses.map((name) => (
                  <li key={name} data-reveal className="py-4 first:pt-0 last:pb-0">
                    <span className="block text-xl font-semibold text-text">{name}</span>
                    <span className="mt-1 block text-base text-text-dim">{blurbs[name]}</span>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </Reveal>

      <Reveal as="section" className="container-x page-section" aria-labelledby="past">
        <h2 id="past" data-reveal className="t-headline">Past <span className="hl">programs</span></h2>
        <div className="mt-12 border-t border-line">
          <div data-reveal className="grid gap-4 border-b border-line py-8 md:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] md:gap-10 md:py-10">
            <h3 className="t-title text-text">Summer 2021</h3>
            <p className="text-base text-text-dim">Our summer program in 2021.</p>
          </div>
          <div data-reveal className="grid gap-4 border-b border-line py-8 md:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] md:gap-10 md:py-10">
            <h3 className="t-title text-text">Summer 2023</h3>
            <div className="flex flex-col gap-6">
              <p className="max-w-[60ch] text-base text-text-dim">
                Free STEM camps across the summer: AMC 10, AP Physics 1, AP CSA, Programming for Robotics, and Modern React.
              </p>
              <div className="flex flex-wrap items-start gap-6">
                <Flyer src={flyerSummer2023} file="flyer-summer-2023.png" caption="Past program flyer" alt="Flyer: Free STEM Camps, join Hackathon4Kids this summer. July 3-7, 3-5pm PT, AMC 10. July 10-14, 1-3pm PT, AP Physics 1. July 17-21, 1-3pm PT, AP CSA. July 26-29, 2-4pm PT, Programming for Robotics. July 31-Aug 4, 2-4pm PT, Modern React." />
              </div>
            </div>
          </div>
          <div data-reveal className="grid gap-4 border-b border-line py-8 md:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] md:gap-10 md:py-10">
            <h3 className="t-title text-text">Past coding contests</h3>
            <div className="flex flex-col gap-6">
              <p className="max-w-[60ch] text-base text-text-dim">
                A coding competition for grades K to 8 on Code.org, where students worked at their own pace and competed for awards.
              </p>
              <div className="flex flex-wrap items-start gap-6">
                <Flyer src={flyerContestWinter24} file="H4K_Coding_Competition_Flyer_Winter_24.jpg" caption="Past contest flyer" alt="Flyer: Hackathon4Kids coding competition, K-8th grade, Oct 12th to Nov 8th. Learn coding through code.org at your own pace and compete for awards; winners awarded November 16th, 2024 at the Bascom Community Room, Bascom Library. Prize pool up to $2,000." />
                <Flyer src={flyerContest} file="H4K_Coding_Competition_Flyer.png" caption="Past contest flyer" alt="Flyer: Hackathon4Kids Coding Competition, K-8th grade, January 10th to February 7th. Learn coding through code.org at your own pace and compete for awards; winners awarded February 10th at Educational Park Library. Prize pool up to $2,000." />
              </div>
            </div>
          </div>
        </div>
      </Reveal>

      <Reveal as="section" className="container-x page-section pb-28" aria-labelledby="next">
        <h2 id="next" data-reveal className="t-headline">Joining a contest</h2>
        <div data-reveal className="mt-8 flex flex-wrap items-center gap-4">
          <EmailCta size="lg" />
          <a href="/code.org" className="btn btn-secondary btn-lg">Contest instructions</a>
        </div>
      </Reveal>
    </div>
  )
}
