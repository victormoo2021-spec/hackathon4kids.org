import Block from '../components/Block'
import { MAILING_LIST } from '../content/contest'
import Card from './Card'
import { team } from './team'

export const metadata = { title: 'About' }

export default function About() {
  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-8 pt-10 pb-20 text-ink">
      <section className="grid gap-12 md:grid-cols-[minmax(0,1fr)_minmax(0,24rem)] md:items-center">
        <div className="max-w-[62ch]">
          <h1 className="font-display text-5xl sm:text-6xl font-extrabold leading-[1.02] mb-6">
            Built and run by students
          </h1>
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
          <div className="mt-8 flex flex-wrap gap-x-4 gap-y-6">
            <Block color="green" href={MAILING_LIST} external bodyClassName="px-5 py-3 font-bold">
              Join the mailing list
            </Block>
            <Block color="blue" href="/programs" bodyClassName="px-5 py-3 font-bold">
              See our programs
            </Block>
          </div>
        </div>

        {/* The founding story as a script: decorative, the prose above carries it. */}
        <div aria-hidden="true" className="font-display font-bold text-lg max-w-sm">
          <Block color="yellow" shape="hat" bodyClassName="px-5 pt-6 pb-4">
            when <span className="slot">2018</span> starts
          </Block>
          <Block color="purple" bodyClassName="px-5 pt-5 pb-4">
            say <span className="slot">let&apos;s teach kids to code</span>
          </Block>
          <Block color="orange" bodyClassName="pl-5 pr-5 pt-5 pb-3">
            forever
            <div className="mt-3 ml-4">
              <Block color="teal" bodyClassName="px-4 pt-4 pb-3">
                grow <span className="slot">team</span>
              </Block>
              <Block color="pink" bodyClassName="px-4 pt-4 pb-3">
                add <span className="slot">classes</span>
              </Block>
            </div>
          </Block>
          <Block color="green" shape="cap" bodyClassName="px-5 pt-5 pb-4">
            teach <span className="slot">our community</span>
          </Block>
        </div>
      </section>

      <section id="instructors" className="mt-24 scroll-mt-24">
        <h2 className="font-display text-4xl font-extrabold mb-3">Our instructors</h2>
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
