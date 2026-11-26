import Link from 'next/link'
import EmailCta from '../EmailCta'
import { categories, type Course } from '../../content/courses'
import HeroSheet from './HeroSheet'
import Proof from './Proof'
import { Crowd, JoinFx } from './Lazy'
import { INK } from '../../press/ink'
import './scenes.css'

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
      <p className="slug t-mono" aria-hidden>
        <span data-plate-angle="B">trail 15°</span><span data-plate-angle="K">beam 45°</span>
      </p>
    </section>
  )
}

const STMT = 'Started in 2018 by two high-school students. Still taught by high-school students. Still free, in the Bay Area.'.split(' ')

export function Statement() {
  return (
    <section id="statement" className="band statement">
      <div className="grid-x">
        <p className="t-stmt" data-m="stmt">
          {STMT.map((w, i) => (
            <span key={i}>
              {i > 0 && ' '}
              <span className={w.startsWith('free') ? 'w acc' : 'w'} style={{ '--w': i } as React.CSSProperties}>{w}</span>
            </span>
          ))}
        </p>
      </div>
    </section>
  )
}

const { bg, s2, text, accent, glow } = INK
// [paper, ink, ghost]
const INKS: Record<string, [string, string, string]> = {
  Code: [s2, accent, glow],
  Build: [accent, bg, glow],
  Math: [s2, text, glow],
  Physics: [glow, text, accent],
}

export function Courses() {
  let n = 0
  return (
    <section id="courses" aria-labelledby="courses-title" className="band">
      <div className="grid-x">
        <div className="courses-head">
          <h2 id="courses-title" className="t-h2 plate" data-m="head" data-plate data-t="Courses">Courses</h2>
          <Link href="/programs" className="lnk t-body">All programs</Link>
        </div>
        <ul className="tiles" data-m="tiles">
          {categories.flatMap((c) =>
            (c.courses as readonly Course[]).map((name, ci) => {
              const [bg, fg, ghost] = INKS[c.name]
              const i = n++ % 5
              return (
                <li key={name} className="tile">
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
    <section id="class-size" aria-labelledby="class-title" className="band">
      <div className="grid-x class-grid">
        <div className="crowd">
          <Crowd />
          <noscript><div className="crowd-css" aria-hidden>{Array.from({ length: 20 }, (_, i) => <i key={i} className="dot" />)}<b className="dot" /></div></noscript>
        </div>
        <div className="class-text">
          <h2 id="class-title" className="t-fact class-fact" aria-label="One instructor. Up to 20 kids" data-m="head">
            <span aria-hidden><b className="acc">1</b> instructor</span> <span aria-hidden>Up to <span data-crowd-n>20</span> kids</span>
          </h2>
          <p className="t-body">Classes run in person and online</p>
        </div>
      </div>
    </section>
  )
}

export function FinalCta() {
  return (
    <section id="join" aria-labelledby="join-title" className="band accent final">
            <JoinFx pivot="80%" />
      <div className="grid-x">
        <div className="final-in">
          <h2 id="join-title" className="t-h2 plate" data-plate data-t="Get class dates">Get class dates</h2>
          <div className="final-cta"><EmailCta size="lg" /></div>
        </div>
      </div>
    </section>
  )
}
