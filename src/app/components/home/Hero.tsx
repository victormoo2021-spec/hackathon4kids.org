import EmailCta from '../EmailCta'
import StoryStage from './StoryStage'
import './hero.css'

const FACTS = ['Free', 'Grades 3-8', 'Bay Area', 'In person and online', 'Up to 20 kids per class']

// Server component: the h1 and CTA paint without waiting for JS. Only StoryStage is client.
export default function Hero() {
  return (
    <section id="hero" className="hero" aria-labelledby="hero-h1">
      <div className="hero-pin">
      <div className="container-x hero-grid">
        <div className="hero-copy">
          <h1 id="hero-h1" className="hero-h1">Free coding classes for <span className="hero-soft">grades 3-8.</span></h1>
          <p className="hero-cont rise" style={{ animationDelay: '60ms' }}>
            Taught by high-school students, in person and online.
          </p>
          <div className="rise" style={{ animationDelay: '140ms' }}>
            <EmailCta size="lg" reassure />
          </div>
          <ul className="facts rise" style={{ animationDelay: '220ms' }}>
            {FACTS.map((f, i) => (
              <li key={f}>{i > 0 && <span className="dot" aria-hidden>·</span>}{f}</li>
            ))}
          </ul>
        </div>
        <StoryStage />
      </div>
      </div>
    </section>
  )
}
