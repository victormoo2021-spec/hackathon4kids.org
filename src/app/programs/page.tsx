import Image, { type StaticImageData } from 'next/image'
import Link from 'next/link'
import { FinalBand } from '../components/mdx-layout'
import { categories, type Course } from '../content/courses'
import flyerSummer2023 from 'public/flyer-summer-2023.png'
import flyerContestWinter24 from 'public/H4K_Coding_Competition_Flyer_Winter_24.jpg'
import flyerContest from 'public/H4K_Coding_Competition_Flyer.png'
import ProofStatic from '../components/spot/ProofStatic'
import '../pages.css'

export const metadata = {
  title: 'Programs',
  description: 'Free classes for grades 3-8: Python, robotics, game development, math, physics. In person and online.',
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

// Anchor ids: lowercase, runs of non-alphanumerics become "-": "Git + GitHub" -> git-github, "AMC 8" -> amc-8.
const slug = (name: string) => name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

const facts: [string, string][] = [
  ['Grades 3-8', 's-blue'],
  ['Free', 's-y'],
  ['In person and online', 's-k'],
  ['Up to 20 kids per class', ''],
  ['One instructor per class', ''],
]

function Flyer({ src, file, alt, caption }: { src: StaticImageData; file: string; alt: string; caption: string }) {
  return (
    <figure>
      <a href={`/${file}`} target="_blank" rel="noopener noreferrer" aria-label={`Open full-size flyer: ${caption}`}>
        <Image src={src} alt={alt} sizes="280px" />
      </a>
      <figcaption className="t-body">{caption}</figcaption>
    </figure>
  )
}

export default function Programs() {
  return (
    <div className="pg">
      <section className="pg-hero grid-x">
        <h1 data-m="head" className="t-h1 pg-col-8" style={{ fontSize: 'clamp(3rem, 1.5rem + 7vw, 9rem)' }}>Programs</h1>
        <p data-m="rise" className="t-body" style={{ gridColumn: '1 / -1' }}>
          Free computer science and STEM classes for kids in grades 3 to 8, taught by high-school students.
        </p>
        <ul aria-label="At a glance" className="pg-slabs t-slab" style={{ gridColumn: '1 / -1', marginTop: 0 }}>
          {facts.map(([f, c], i) => (
            <li key={f} data-m="rise" className={c}>{f}</li>
          ))}
        </ul>
      </section>

      <section className="pg-sec" style={{ paddingTop: 0 }} aria-labelledby="courses">
        <div className="grid-x">
          <h2 id="courses" data-m="head" className="t-h2" style={{ gridColumn: '1 / -1' }}>Courses</h2>
          <div style={{ gridColumn: '1 / -1' }}>
            {categories.map((c) => (
              <section key={c.name} className="pg-cat" aria-labelledby={`cat-${c.name}`}>
                <h3 id={`cat-${c.name}`} className="t-h3">{c.name}</h3>
                <ul className="pg-courses">
                  {c.courses.map((name, i) => (
                    <li key={name} id={slug(name)} data-m="rise" className="pg-course">
                      <ProofStatic name={name as Course} className={`pg-proof cat-${c.name.toLowerCase()}`} />
                      <div>
                        <h4 className="t-h3">{name}</h4>
                        <p className="t-body">{blurbs[name]}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        </div>
      </section>

      <section className="pg-sec" style={{ paddingTop: 0 }} aria-labelledby="past">
        <div className="grid-x">
          <div style={{ gridColumn: '1 / -1' }}>
            <h2 id="past" data-m="head" className="t-h2">Past programs</h2>
            <h3 className="t-h3" style={{ marginTop: 32 }}>Summer 2021</h3>
            <p className="t-body">Our summer program in 2021.</p>
            <h3 className="t-h3" style={{ marginTop: 32 }}>Summer 2023</h3>
            <p className="t-body">Free STEM camps across the summer: AMC 10, AP Physics 1, AP CSA, Programming for Robotics, and Modern React.</p>
            <div className="pg-flyers">
              <Flyer src={flyerSummer2023} file="flyer-summer-2023.png" caption="Past program flyer" alt="Flyer: Free STEM Camps, join Hackathon4Kids this summer. July 3-7, 3-5pm PT, AMC 10. July 10-14, 1-3pm PT, AP Physics 1. July 17-21, 1-3pm PT, AP CSA. July 26-29, 2-4pm PT, Programming for Robotics. July 31-Aug 4, 2-4pm PT, Modern React." />
            </div>
            <h3 className="t-h3" style={{ marginTop: 48 }}>Past coding contests</h3>
            <p className="t-body">A coding competition for grades K to 8 on Code.org, where students worked at their own pace and competed for awards.</p>
            <div className="pg-flyers">
              <Flyer src={flyerContestWinter24} file="H4K_Coding_Competition_Flyer_Winter_24.jpg" caption="Past contest flyer" alt="Flyer: Hackathon4Kids coding competition, K-8th grade, Oct 12th to Nov 8th. Learn coding through code.org at your own pace and compete for awards; winners awarded November 16th, 2024 at the Bascom Community Room, Bascom Library. Prize pool up to $2,000." />
              <Flyer src={flyerContest} file="H4K_Coding_Competition_Flyer.png" caption="Past contest flyer" alt="Flyer: Hackathon4Kids Coding Competition, K-8th grade, January 10th to February 7th. Learn coding through code.org at your own pace and compete for awards; winners awarded February 10th at Educational Park Library. Prize pool up to $2,000." />
            </div>
            <div className="pg-contest">
              <h3 className="t-h3">Joining a contest</h3>
              <Link href="/code.org" className="pg-link">Contest instructions</Link>
            </div>
          </div>
        </div>
      </section>

      <FinalBand />
    </div>
  )
}
