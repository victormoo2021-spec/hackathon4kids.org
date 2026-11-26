import Faq from './components/Faq'
import { Hero, Courses, Class, FinalCta } from './components/spot/Sections'
import { Impression } from './components/spot/Impression'

export default function Home() {
  return (
    <div className="spot">
      <Hero />
      <Courses />
      <Class />
      <section id="faq" aria-labelledby="faq-title" className="band stock">
        <Faq headingId="faq-title" />
      </section>
      <FinalCta />
      <Impression />
    </div>
  )
}
