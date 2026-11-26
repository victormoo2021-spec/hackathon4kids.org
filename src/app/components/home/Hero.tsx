import EmailCta from '../EmailCta'
import './hero.css'

const H1 = ['Free', 'coding', 'classes', 'for', 'grades 3-8.']
const HL = new Set([0, 4]) // Free, grades 3-8. (one highlight box)

// Server component: the h1 and CTA paint without waiting for JS. No client JS.
export default function Hero() {
  return (
    <section id="hero" className="hero" aria-labelledby="hero-h1">
        <div className="container-x hero-grid">
          <div className="hero-copy">
            <h1 id="hero-h1" className="hero-h1">
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
        </div>
    </section>
  )
}
