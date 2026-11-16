import Hero from './components/home/Hero'
import CourseGrid from './components/home/CourseGrid'
import ClassSize from './components/home/ClassSize'
import DarkBand from './components/home/DarkBand'
import Formats from './components/home/Formats'
import FinalCta from './components/home/FinalCta'
import Faq from './components/Faq'
import Reveal from './components/motion/Reveal'
import './components/home/sections.css'

export default function Home() {
  return (
    <>
      <Hero />
      <CourseGrid />
      <ClassSize />
      <DarkBand />
      <Formats />
      <section id="faq" className="bg-mist">
        <Reveal className="container-x section-y">
          <div data-reveal>
            <Faq headingId="faq-title" />
          </div>
        </Reveal>
      </section>
      <FinalCta />
    </>
  )
}
