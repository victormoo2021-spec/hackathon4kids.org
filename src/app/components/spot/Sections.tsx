import Link from 'next/link'
import EmailCta from '../EmailCta'
import { categories, type Course } from '../../content/courses'
import HeroSheet from './HeroSheet'
import Proof from './Proof'
import Crowd from './Crowd'
import { Roller } from '../../press/Roller'
import { Stamp } from './Stamp'

const H1 = ['Free', 'coding', 'classes']

export function Hero() {
  return (
    <section id="hero" className="hero" aria-labelledby="hero-h1">
      <HeroSheet />
      <div className="hero-in grid-x">
        <h1 id="hero-h1" className="t-h1 hero-h1">
          {H1.map((w, i) => (
            <span key={w} data-t={w} className="ln" style={{ '--n': i } as React.CSSProperties}>{w}</span>
          ))}
        </h1>
        <p className="t-slab hero-slab">Grades 3–8</p>
        <div className="hero-cta" id="hero-cta">
          <EmailCta size="lg" />
          <Link href="#courses" className="lnk t-body">See the courses</Link>
        </div>
      </div>
      <i className="crop l" aria-hidden />
      <i className="crop r" aria-hidden />
      <p className="slug t-mono" aria-hidden>
        <span><b className="y" />Y</span><span><b className="b" /><span data-plate-angle="B">B 15</span></span><span><b className="k" /><span data-plate-angle="K">K 45</span></span>
      </p>
    </section>
  )
}

const TILE: Record<string, string> = { Code: 'yk', Build: 'bs', Math: 'sb', Physics: 'ky' }
// [paper, ink, ghost]
const INKS: Record<string, [string, string, string]> = {
  Code: ['#FFD60A', '#111114', '#1F3FCF'],
  Build: ['#1F3FCF', '#F2EDE1', '#FFD60A'],
  Math: ['#F2EDE1', '#1F3FCF', '#FFD60A'],
  Physics: ['#111114', '#FFD60A', '#1F3FCF'],
}

export function Courses() {
  let n = 0
  return (
    <section id="courses" aria-labelledby="courses-title" className="band stock">
      <div className="grid-x">
        <div className="courses-head">
          <h2 id="courses-title" className="t-h2 plate" data-ink="wipe" data-plate="blue" data-t="Courses">Courses</h2>
          <Link href="/programs" className="lnk t-body">All programs</Link>
        </div>
        <ul className="tiles">
          {categories.flatMap((c) =>
            (c.courses as readonly Course[]).map((name, ci) => {
              const [bg, fg, ghost] = INKS[c.name]
              const i = n++ % 5
              return (
                <li key={name} className={`tile ${TILE[c.name]}`} data-ink="develop" data-i={i}>
                  <Proof name={name} col={i} paper={bg} ink={fg} ghost={ghost} className="tile-a">
                    {ci === 0 && <span className="cat t-mono" style={{ background: fg, color: bg }}>{c.name}</span>}
                    <span className="bar t-h3">{name}</span>
                  </Proof>
                </li>
              )
            }),
          )}
        </ul>
      </div>
    </section>
  )
}

export function Class() {
  return (
    <section id="class-size" aria-labelledby="class-title" className="band blue" data-ink="roll">
      <Roller ink="blue" />
      <div className="grid-x class-grid">
        <div className="crowd">
          <Crowd paper="#1F3FCF" ink="#F2EDE1" yellow="#FFD60A" />
          <noscript><div className="crowd-css" aria-hidden>{Array.from({ length: 20 }, (_, i) => <i key={i} className="dot" />)}<b className="dot" /></div></noscript>
        </div>
        <div className="class-text">
          <h2 id="class-title" className="t-fact class-fact" data-ink="wipe">
            <span>One instructor</span> <span>Up to 20 kids</span>
          </h2>
          <p className="t-body">Classes run in person and online</p>
        </div>
      </div>
    </section>
  )
}

export function FinalCta() {
  return (
    <section id="join" aria-labelledby="join-title" className="band yellow final" data-ink="roll">
      <Roller ink="yellow" />
      <Stamp pivot="80%" />
      <div className="grid-x">
        <div className="final-in">
          <h2 id="join-title" className="t-h2 plate" data-ink="wipe" data-plate="blue" data-t="Get class dates">Get class dates</h2>
          <div className="final-cta" data-ink="stamp" data-i={4}><EmailCta size="lg" /></div>
        </div>
      </div>
    </section>
  )
}
