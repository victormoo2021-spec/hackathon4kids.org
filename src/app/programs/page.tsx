import Image, { type StaticImageData } from 'next/image'
import Block from '../components/Block'
import { MAILING_LIST } from '../content/contest'
import { categories, courseColor, type Course } from '../content/courses'
import flyerSummer2023 from 'public/flyer-summer-2023.png'
import flyerContestWinter24 from 'public/H4K_Coding_Competition_Flyer_Winter_24.jpg'
import flyerContest from 'public/H4K_Coding_Competition_Flyer.png'

export const metadata = { title: 'Programs' }

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

function Script({ title, courses }: { title: string; courses: readonly Course[] }) {
  return (
    <div>
      <Block color="yellow" shape="hat" bodyClassName="px-5 pt-6 pb-4">
        <h3 className="text-2xl font-extrabold">{title}</h3>
      </Block>
      <ul>
        {courses.map((name, i) => (
          <li key={name}>
            <Block
              color={courseColor[name]}
              shape={i === courses.length - 1 ? 'cap' : 'stack'}
              bodyClassName="px-5 pt-5 pb-4"
            >
              <span className="block font-display text-xl font-bold">{name}</span>
              <span className="block leading-snug">{blurbs[name]}</span>
            </Block>
          </li>
        ))}
      </ul>
    </div>
  )
}

function Flyer({ src, file, alt, caption }: { src: StaticImageData; file: string; alt: string; caption: string }) {
  return (
    <figure>
      <a href={`/${file}`} target="_blank" rel="noopener noreferrer" aria-label={`Open full-size flyer: ${caption}`}>
        <Image src={src} alt={alt} sizes="(min-width: 640px) 24rem, 100vw" className={flyerFrame} />
      </a>
      <figcaption className="mt-3 text-sm font-bold text-ink-soft">{caption}</figcaption>
    </figure>
  )
}

const flyerFrame = 'rounded-xl border-4 border-white shadow-[0_6px_18px_rgb(27_26_43/0.16)] h-auto w-full'

export default function Programs() {
  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-8 pt-10 pb-20 text-ink">
      <section className="max-w-[62ch]">
        <h1 className="font-display text-5xl sm:text-6xl font-extrabold leading-[1.02] mb-6">Programs</h1>
        <p className="text-lg leading-relaxed">
          Free computer science and STEM classes for kids in grades 3 to 8, taught by high-school students.
        </p>
        <ul className="mt-6 flex flex-wrap gap-3 font-bold" aria-label="At a glance">
          <li className="slot py-1">Grades 3 to 8</li>
          <li className="slot py-1">Face-to-face and virtual</li>
          <li className="slot py-1">Always free</li>
        </ul>
      </section>

      <section className="mt-20" aria-labelledby="courses">
        <h2 id="courses" className="font-display text-4xl font-extrabold mb-3">
          Courses we teach
        </h2>
        <p className="max-w-[62ch] text-lg leading-relaxed text-ink-soft mb-10">
          Each program offers some of these. Get class dates by email to hear which ones are next.
        </p>
        <div className="grid gap-12 md:grid-cols-2 md:gap-10">
          {categories.map((c) => (
            <Script key={c.name} title={c.name} courses={c.courses} />
          ))}
        </div>
      </section>

      <section className="mt-24" aria-labelledby="past">
        <h2 id="past" className="font-display text-4xl font-extrabold mb-10">
          Past programs
        </h2>
        <ol className="space-y-16">
          <li>
            <Block color="orange" className="inline-block" bodyClassName="px-5 pt-4 pb-3">
              <h3 className="text-2xl font-extrabold">Summer 2021</h3>
            </Block>
            <p className="mt-5 max-w-[62ch] text-lg leading-relaxed">Our summer program in 2021.</p>
          </li>
          <li>
            <div>
              <Block color="orange" className="inline-block" bodyClassName="px-5 pt-4 pb-3">
                <h3 className="text-2xl font-extrabold">Summer 2023</h3>
              </Block>
              <p className="mt-5 max-w-[62ch] text-lg leading-relaxed">
                Free STEM camps across the summer: AMC 10, AP Physics 1, AP CSA, Programming for Robotics,
                and Modern React.
              </p>
            </div>
            <div className="mt-8 sm:max-w-sm">
              <Flyer src={flyerSummer2023} file="flyer-summer-2023.png" caption="Past program flyer" alt="Flyer: Free STEM Camps, join Hackathon4Kids this summer. July 3-7, 3-5pm PT, AMC 10. July 10-14, 1-3pm PT, AP Physics 1. July 17-21, 1-3pm PT, AP CSA. July 26-29, 2-4pm PT, Programming for Robotics. July 31-Aug 4, 2-4pm PT, Modern React." />
            </div>
          </li>
          <li>
            <Block color="orange" className="inline-block" bodyClassName="px-5 pt-4 pb-3">
              <h3 className="text-2xl font-extrabold">Past coding contests</h3>
            </Block>
            <p className="mt-5 max-w-[62ch] text-lg leading-relaxed">
              A coding competition for grades K to 8 on Code.org, where students worked at their own pace
              and competed for awards.
            </p>
            <div className="mt-8 grid gap-8 sm:grid-cols-2 max-w-3xl items-start">
              <Flyer src={flyerContestWinter24} file="H4K_Coding_Competition_Flyer_Winter_24.jpg" caption="Past contest flyer" alt="Flyer: Hackathon4Kids coding competition, K-8th grade, Oct 12th to Nov 8th. Learn coding through code.org at your own pace and compete for awards; winners awarded November 16th, 2024 at the Bascom Community Room, Bascom Library. Prize pool up to $2,000." />
              <Flyer src={flyerContest} file="H4K_Coding_Competition_Flyer.png" caption="Past contest flyer" alt="Flyer: Hackathon4Kids Coding Competition, K-8th grade, January 10th to February 7th. Learn coding through code.org at your own pace and compete for awards; winners awarded February 10th at Educational Park Library. Prize pool up to $2,000." />
            </div>
          </li>
        </ol>
      </section>

      <section className="mt-24 max-w-[62ch]" aria-labelledby="next">
        <h2 id="next" className="font-display text-4xl font-extrabold mb-4">
          Joining a contest
        </h2>
        <p className="text-lg leading-relaxed mb-8">
          Contests run on Code.org. The instructions page shows parents how to get their child signed in
          and ready.
        </p>
        <div className="flex flex-wrap gap-x-4 gap-y-6">
          <Block color="green" href={MAILING_LIST} external bodyClassName="px-5 py-3 font-bold">
            Get class dates by email
          </Block>
          <Block color="blue" href="/code.org" bodyClassName="px-5 py-3 font-bold">
            Contest instructions
          </Block>
        </div>
      </section>
    </div>
  )
}
