import Link from 'next/link'
import { ArrowRightIcon } from '@radix-ui/react-icons'
import Reveal from '../motion/Reveal'
import { categories, type Course } from '../../content/courses'

// Same one-liners as /programs.
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

export default function CourseGrid() {
  return (
    <Reveal as="section" id="courses" aria-labelledby="courses-title" className="container-x section-y">
      <div className="max-w-2xl">
        <h2 id="courses-title" data-streak-anchor="l" data-reveal className="t-headline">Courses</h2>
        <p data-reveal className="t-lede mt-5">
          Python, robotics, game design, math, and physics, from a first program to AP exams.
        </p>
      </div>
      <div className="mt-14 border-t border-line">
        {categories.map((c) => (
          <div key={c.name} data-reveal="rule" className="spec relative grid gap-4 py-8 md:grid-cols-[1fr_2fr] md:gap-12 md:py-10">
            <h3 data-reveal className="t-title text-text">{c.name}</h3>
            <ul>
              {c.courses.map((n) => (
                <li key={n} data-reveal className="border-t border-line py-4 first:border-t-0 first:pt-0 md:py-5 md:first:pt-0">
                  <p className="text-base font-medium text-text">{n}</p>
                  <p className="mt-1 text-text-body">{blurbs[n]}</p>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <p data-reveal className="mt-6">
        <Link href="/programs" className="link inline-flex min-h-11 items-center gap-2 font-semibold">
          See all programs <ArrowRightIcon aria-hidden />
        </Link>
      </p>
    </Reveal>
  )
}
