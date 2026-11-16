import Image, { type StaticImageData } from 'next/image'
import Block from '../components/Block'
import CtaPair from '../components/CtaPair'
import Op from '../components/Op'
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
      <Block color="yellow" shape="hat">
        <h3 className="h-card">{title}</h3>
      </Block>
      <ul>
        {courses.map((name, i) => (
          <li key={name}>
            <Block
              color={courseColor[name]}
              shape={i === courses.length - 1 ? 'cap' : 'stack'}
              
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

const flyerFrame = 'rounded-media border-4 border-white shadow-soft h-auto w-full'

export default function Programs() {
  return (
    <div className="wrap page-top page-bottom text-ink">
      <section className="max-w-[62ch]">
        <div className="cb-stack">
          <Block color="purple" shape="hat" size="lg" className="w-fit max-w-full">
            <h1 className="h-page">Programs</h1>
          </Block>
          <Block color="teal" shape="cap" className="w-fit max-w-full" bodyClassName="flex flex-wrap items-center gap-2 text-lg">
            <Op>at a glance</Op>
            <ul className="contents" aria-label="At a glance">
              {['Grades 3 to 8', 'Face-to-face and virtual', 'Always free'].map((f) => (
                <li key={f} className="slot font-bold">{f}</li>
              ))}
            </ul>
          </Block>
        </div>
        <p className="mt-8 text-lg leading-relaxed">
          Free computer science and STEM classes for kids in grades 3 to 8, taught by high-school students.
        </p>
      </section>

      <section className="section" aria-labelledby="courses">
        <h2 id="courses" className="h-section mb-3">
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

      <section className="section" aria-labelledby="past">
        <h2 id="past" className="h-section mb-10">
          Past programs
        </h2>
        <ol className="space-y-16">
          <li>
            <Block color="orange" className="inline-block">
              <h3 className="h-card">Summer 2021</h3>
            </Block>
            <p className="mt-5 max-w-[62ch] text-lg leading-relaxed">Our summer program in 2021.</p>
          </li>
          <li>
            <div>
              <Block color="orange" className="inline-block">
                <h3 className="h-card">Summer 2023</h3>
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
            <Block color="orange" className="inline-block">
              <h3 className="h-card">Past coding contests</h3>
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

      <section className="section max-w-[62ch]" aria-labelledby="next">
        <h2 id="next" className="h-section mb-4">
          Joining a contest
        </h2>
        <p className="text-lg leading-relaxed mb-8">
          Contests run on Code.org. The instructions page shows parents how to get their child signed in
          and ready.
        </p>
        <CtaPair secondary={{ label: 'Contest instructions', href: '/code.org' }} />
      </section>
    </div>
  )
}
