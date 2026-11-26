import Hero from './components/home/Hero'
import CourseGrid from './components/home/CourseGrid'
import Statement from './components/home/Statement'
import DarkBand from './components/home/DarkBand'
import Formats from './components/home/Formats'
import FinalCta from './components/home/FinalCta'
import Faq from './components/Faq'
import Reveal from './components/reveal/Reveal'
import './components/home/sections.css'

export default function Home() {
  return (
    <>
      <Hero />
      <CourseGrid />
      <Statement />
      <DarkBand />
      <Formats />
      <section id="faq" aria-labelledby="faq-title">
        <Reveal className="container-x section-y">
          <Faq headingId="faq-title" />
        </Reveal>
      </section>
      <FinalCta />
    </>
  )
}
