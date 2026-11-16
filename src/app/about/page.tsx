import Block from '../components/Block'
import CtaPair from '../components/CtaPair'
import Card from './Card'
import { team } from './team'

export const metadata = { title: 'About' }

export default function About() {
  return (
    <div className="wrap page-top page-bottom text-ink">
      <section className="grid gap-12 md:grid-cols-[minmax(0,1fr)_minmax(0,24rem)] md:items-center">
        <div className="max-w-[62ch]">
          <Block color="purple" shape="hat" size="lg" className="mb-8 w-fit max-w-full">
            <h1 className="h-page">Built and run by students</h1>
          </Block>
          <div className="space-y-4 text-lg leading-relaxed">
            <p>
              Hackathon4Kids was founded in 2018 by two high-school students who wanted to help kids in
              their community by teaching programming.
            </p>
            <p>
              Since then the team has grown, and so have our outreach and our offerings. It is a labor of
              love, built and run by students who want to make a real impact in their local community and
              beyond.
            </p>
          </div>
          <div className="mt-8">
            <CtaPair secondary={{ label: 'See our programs', href: '/programs' }} />
          </div>
        </div>

        {/* The founding story as a script: decorative, the prose above carries it. */}
        <div aria-hidden="true" className="font-display font-bold text-lg max-w-sm">
          <Block color="yellow" shape="hat">
            when <span className="slot">2018</span> starts
          </Block>
          <Block color="purple">
            say <span className="slot">let&apos;s teach kids to code</span>
          </Block>
          <Block color="orange">
            forever
            <div className="mt-3 ml-4">
              <Block color="teal">
                grow <span className="slot">team</span>
              </Block>
              <Block color="pink">
                add <span className="slot">classes</span>
              </Block>
            </div>
          </Block>
          <Block color="green" shape="cap">
            teach <span className="slot">our community</span>
          </Block>
        </div>
      </section>

      <section id="instructors" className="section scroll-mt-24">
        <h2 className="h-section mb-3">Our instructors</h2>
        <p className="max-w-[62ch] text-lg leading-relaxed text-ink-soft mb-10">
          The students, alumni, and advisors who teach our classes and keep Hackathon4Kids running.
        </p>
        <div className="columns-1 md:columns-2 lg:columns-3 gap-8">
          {team
            .filter((p) => !p.hidden)
            .map((p) => (
              <Card key={p.name} person={p} />
            ))}
        </div>
      </section>
    </div>
  )
}
