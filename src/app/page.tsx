import Faq from './components/Faq'
import { Hero, Courses, Class, FinalCta } from './components/spot/Sections'
import StepObserver from './components/spot/StepObserver'

export default function Home() {
  return (
    <div className="spot">
      <Hero />
      <Courses />
      <Class />
      <section id="faq" aria-labelledby="faq-title" className="spot-sec stock">
        <div className="wrap spot-faq">
          <Faq headingId="faq-title" />
        </div>
      </section>
      <FinalCta />
      <StepObserver />
    </div>
  )
}
