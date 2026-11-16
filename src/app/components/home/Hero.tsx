import EmailCta from '../EmailCta'
import StoryStage from './StoryStage'
import './hero.css'

const H1 = 'Free coding classes for grades 3-8.'.split(' ')
const HL = new Set([0, 4, 5]) // Free, grades, 3-8.

// Server component: the h1 and CTA paint without waiting for JS. Only StoryStage is client.
export default function Hero() {
  return (
    <section id="hero" className="hero" aria-labelledby="hero-h1">
        <div className="container-x hero-grid">
          <div className="hero-copy" data-fx-shield>
            <h1 id="hero-h1" className="hero-h1" data-spectral>
              {H1.map((w, i) => (
                <span key={i}>
                  <span className={HL.has(i) ? 'w hl' : 'w'}><span style={{ '--i': i } as React.CSSProperties}>{w}</span></span>
                  {i < H1.length - 1 && ' '}
                </span>
              ))}
            </h1>
            <p className="hero-cont">
              Taught by high-school students, in person and online.
            </p>
            <div className="hero-cta">
              <EmailCta size="lg" />
            </div>
          </div>
          <StoryStage />
        </div>
    </section>
  )
}
