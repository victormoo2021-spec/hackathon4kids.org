import Link from 'next/link'
import { ArrowRightIcon } from '@radix-ui/react-icons'
import Reveal from '../motion/Reveal'
import { categories } from '../../content/courses'

const blurb: Record<(typeof categories)[number]['name'], string> = {
  Code: 'Write and share real programs.',
  Build: 'Robots and games, made with code.',
  Math: 'Algebra and math competition practice.',
  Physics: 'How things move, up to AP Physics 1.',
}

export default function CourseGrid() {
  return (
    <Reveal as="section" id="courses" aria-labelledby="courses-title" className="container-x section-y">
      <div className="max-w-2xl">
        <h2 id="courses-title" data-reveal className="t-headline">What kids learn</h2>
        <p data-reveal className="t-lede mt-5 text-ink-soft">
          Hands-on classes that start with the basics and grow with your child, from first lines of code to AP exams.
        </p>
      </div>
      <div className="mt-14 grid gap-5 sm:grid-cols-2">
        {categories.map((c) => (
          <div key={c.name} data-reveal>
            <div className="course-card card h-full p-9 md:p-11">
              <h3 className="text-base font-medium text-ink-soft">{c.name}</h3>
              <p className="mt-2 text-lg text-ink">{blurb[c.name]}</p>
              <ul className="mt-8 space-y-1.5">
                {c.courses.map((n) => (
                  <li key={n} className="text-[1.25rem] font-semibold tracking-tight text-ink">{n}</li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>
      <p data-reveal className="mt-10">
        <Link href="/programs" className="inline-flex items-center gap-2 font-semibold text-accent underline-offset-4 hover:underline">
          See all programs <ArrowRightIcon aria-hidden />
        </Link>
      </p>
    </Reveal>
  )
}
