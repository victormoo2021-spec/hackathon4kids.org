import Faq from './components/Faq'
import { Hero, Statement, Courses, Class, FinalCta } from './components/spot/Sections'
import { Impression } from './components/spot/Lazy'

export default function Home() {
  return (
    <div className="spot">
      <Hero />
      <Statement />
      <Courses />
      <Class />
      <section id="faq" aria-labelledby="faq-title" className="band s1">
        <Faq headingId="faq-title" />
      </section>
      <FinalCta />
      <Impression />
    </div>
  )
}
