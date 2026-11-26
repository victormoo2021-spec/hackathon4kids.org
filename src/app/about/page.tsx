import { FinalBand } from '../components/mdx-layout'
import Card from './Card'
import { team } from './team'
import '../pages.css'

export const metadata = {
  title: 'About',
  description: 'Founded in 2018 by two high-school students. Still built and run by students.',
}

export default function About() {
  const people = team.filter((p) => !p.hidden)
  return (
    <div className="pg">
      <section className="pg-yellow pg-hero grid-x">
        <h1 data-ink="wipe" className="t-h1 pg-col-8">Built and run by students</h1>
        <p data-ink="stamp" data-i="3" className="t-fact pg-year pg-col-4" aria-label="Founded in 2018">2018</p>
      </section>

      <section className="pg-sec">
        <div className="grid-x">
          <div className="pg-col-8" style={{ maxWidth: '60ch' }}>
            <p data-ink="wipe" className="t-body">
              Hackathon4Kids was founded in 2018 by two high-school students who wanted to help kids in their community by teaching programming.
            </p>
            <p data-ink="wipe" data-i="1" className="t-body mt-4">
              Since then the team has grown, and so have our outreach and our offerings. It is built and run by students.
            </p>
          </div>
          <ul aria-label="At a glance" className="pg-slabs t-slab pg-col-4" style={{ marginTop: 0, alignContent: 'flex-start' }}>
            <li data-ink="stamp" data-i="2" className="s-blue">Grades 3-8</li>
            <li data-ink="stamp" data-i="3" className="s-y">Free</li>
            <li data-ink="stamp" data-i="4" className="s-k">Taught by students</li>
          </ul>
        </div>
      </section>

      {people.length > 0 && (
        <section id="instructors" className="pg-sec scroll-mt-24" style={{ paddingTop: 0 }} aria-labelledby="instructors-h">
          <div className="grid-x">
            <h2 id="instructors-h" data-ink="wipe" className="t-h2 pg-col-8" style={{ gridColumn: '1 / -1' }}>Instructors</h2>
            <ul className="pg-people" style={{ gridColumn: '1 / -1' }}>
              {people.map((p, i) => <Card key={p.name} person={p} i={i} />)}
            </ul>
          </div>
        </section>
      )}

      <FinalBand />
    </div>
  )
}
