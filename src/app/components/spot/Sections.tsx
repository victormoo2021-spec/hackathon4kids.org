import Link from 'next/link'
import EmailCta from '../EmailCta'
import { categories } from '../../content/courses'
import HeroGL from './HeroGL'
import Halftone from './Halftone'

// Static poster, same geometry and first pendulum state as the shader's first frame (see geo() in pendulum.ts:
// wide pivot 66% / len min(.82H, 1.15W), amp .8; phone pivot 50% / len min(.6H, 1.15W), amp .55; start angle .55*amp).
// Shown first, and kept if WebGL is missing. cq units are the hero's own size.
function Poster() {
  return (
    <div className="spot-poster" aria-hidden>
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <i key={i} className={i ? 'pr b' : 'pr'} style={{ '--k': i, '--f': 1 - i / 6 } as React.CSSProperties} />
      ))}
    </div>
  )
}

const H1 = ['Free', 'coding', 'classes']

export function Hero() {
  return (
    <section id="hero" className="spot-hero" aria-labelledby="hero-h1">
      <Poster />
      <HeroGL />
      <div className="spot-hero-in">
        <h1 id="hero-h1" className="spot-h1">
          {H1.map((w, i) => (
            <span key={w} data-t={w} className={`ln w${i + 1}`} style={{ '--i': i } as React.CSSProperties}>{w}</span>
          ))}
          <span className="sr-only">.</span>{' '}
          <span className="ln slab" style={{ '--i': 3 } as React.CSSProperties}>Grades 3–8</span>
        </h1>
        <div className="spot-cta"><EmailCta size="lg" /></div>
        <p className="spot-cta spot-alt"><a href="#courses" className="spot-link">See the courses</a></p>
      </div>
      <i className="swatch" aria-hidden><b /><b /><b /><b /></i>
    </section>
  )
}

// category -> tile inks [paper, ink]
const INKS: Record<string, [string, string, string]> = {
  Code: ['#FFD60A', '#111114', '#1F3FCF'],
  Build: ['#1F3FCF', '#F2EDE1', '#FFD60A'],
  Math: ['#F2EDE1', '#1F3FCF', '#FFD60A'],
  Physics: ['#111114', '#FFD60A', '#1F3FCF'],
}

export function Courses() {
  let n = 0
  return (
    <section id="courses" aria-labelledby="courses-title" className="spot-sec stock">
      <div className="wrap">
        <div className="courses-head">
          <h2 id="courses-title" className="spot-h2" data-rv>Courses</h2>
          <p className="more" data-rv>
            <Link href="/programs" className="spot-link">All programs</Link>
          </p>
        </div>
        <ul className="tiles">
          {categories.flatMap((c) =>
            c.courses.map((name, ci) => {
              const [bg, fg, ghost] = INKS[c.name]
              return (
                <li key={name} className="tile" data-rv style={{ '--bg': bg, '--fg': fg, '--i': n++ % 5 } as React.CSSProperties}>
                  <Halftone name={name} fg={fg} ghost={ghost} />
                  {ci === 0 && <p className="cat">{c.name}</p>}
                  <h3>{name}</h3>
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
    <section id="class-size" aria-labelledby="class-title" className="spot-sec blue" data-pass>
      <div className="wrap class-grid">
        <div className="crowd" aria-hidden data-rv>
          {Array.from({ length: 20 }, (_, i) => <i key={i} />)}
          <b />
        </div>
        <div className="class-text">
          <h2 id="class-title" className="spot-h2 big" data-rv>
            <span>One instructor.</span> <span>Up to 20 kids</span>
          </h2>
          <p className="fact" data-rv style={{ '--i': 2 } as React.CSSProperties}>Classes run in person and online.</p>
        </div>
      </div>
    </section>
  )
}

export function FinalCta() {
  return (
    <section id="join" aria-labelledby="join-title" className="spot-sec yellow">
      <div className="wrap">
        <h2 id="join-title" className="spot-h2 big" data-rv>Get class dates</h2>
        <div className="spot-cta" data-rv style={{ '--i': 2 } as React.CSSProperties}><EmailCta size="lg" /></div>
      </div>
    </section>
  )
}
