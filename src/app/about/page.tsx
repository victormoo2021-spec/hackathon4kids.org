import EmailCta from '../components/EmailCta'
import Reveal from '../components/motion/Reveal'
import Card from './Card'
import { team } from './team'
import '../pages.css'

export const metadata = {
  title: 'About',
  description:
    'Hackathon4Kids was founded in 2018 by two high-school students and is still built and run by students. Meet the instructors.',
}

export default function About() {
  return (
    <div className="text-text">
      <Reveal className="container-x page-hero">
        <h1 data-reveal className="t-headline max-w-[20ch]">Built and run by students</h1>
        <div data-reveal className="t-lede mt-6 space-y-5">
          <p>
            Hackathon4Kids was founded in 2018 by two high-school students who wanted to help kids in their community by teaching programming.
          </p>
          <p>
            Since then the team has grown, and so have our outreach and our offerings. It is a labor of love, built and run by students who want to make a real impact in their local community and beyond.
          </p>
        </div>
      </Reveal>

      <section id="instructors" className="container-x page-section scroll-mt-24" aria-labelledby="instructors-h">
        <Reveal>
          <h2 id="instructors-h" data-reveal className="t-headline">Our instructors</h2>
          <p data-reveal className="t-lede mt-4 max-w-xl">
            The students, alumni, and advisors who teach our classes and keep Hackathon4Kids running.
          </p>
        </Reveal>
        <Reveal className="mt-12 flex flex-wrap items-start justify-center gap-6">
          {team
            .filter((p) => !p.hidden)
            .map((p) => (
              <Card key={p.name} person={p} />
            ))}
        </Reveal>
      </section>

      <Reveal as="section" className="container-x page-section pb-28">
        <div data-reveal className="flex flex-wrap items-center gap-4">
          <EmailCta size="lg" />
          <a href="/programs" className="btn btn-secondary btn-lg">See our programs</a>
        </div>
      </Reveal>
    </div>
  )
}
