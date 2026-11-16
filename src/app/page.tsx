import type { CSSProperties, ReactNode } from 'react'
import Link from 'next/link'
import { ArrowRightIcon } from '@radix-ui/react-icons'
import Block, { type BlockColor } from './components/Block'
import { contest, MAILING_LIST } from './content/contest'

const wrap = 'mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-10'

const palette: { name: string; color: BlockColor; courses: string[] }[] = [
  { name: 'Code', color: 'purple', courses: ['Python', 'Git + GitHub', 'AP CSA'] },
  { name: 'Build', color: 'blue', courses: ['Robotics', 'Game Development'] },
  { name: 'Math', color: 'green', courses: ['Intro to Algebra', 'AMC 8', 'AMC 10'] },
  { name: 'Physics', color: 'teal', courses: ['Intro to Physics', 'AP Physics 1'] },
]

// Block label word, e.g. "say", "repeat". Decorative grammar around real content.
function Op({ children }: { children: ReactNode }) {
  return <span className="mr-2 font-display font-bold opacity-90">{children}</span>
}

function Snap({ i, children }: { i: number; children: ReactNode }) {
  return <div style={{ '--i': i } as CSSProperties}>{children}</div>
}

export default function Home() {
  return (
    <>
      {/* Hero: the script snaps together on load */}
      <section className={`${wrap} grid items-start gap-14 pt-12 md:pt-20 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,0.75fr)]`}>
        <div>
          <div className="snap-in cb-stack">
            <Snap i={0}>
              <Block color="yellow" shape="hat" className="w-fit max-w-full" bodyClassName="px-6 pt-5 pb-3 font-display text-lg font-bold">
                when parent visits
              </Block>
            </Snap>
            <Snap i={1}>
              <Block color="purple" className="w-fit max-w-full" bodyClassName="px-6 pt-5 pb-5">
                <Op>say</Op>
                <h1 className="mt-1 text-4xl leading-[1.1] font-extrabold sm:text-5xl lg:text-6xl">
                  <span className="slot">Free</span> coding classes for{' '}
                  <span className="slot whitespace-nowrap">grades 3-8</span>
                </h1>
              </Block>
            </Snap>
            <Snap i={2}>
              <Block color="orange" className="w-fit max-w-full" bodyClassName="flex flex-wrap items-center gap-2 px-6 pt-4 pb-3 text-lg">
                <Op>repeat</Op>
                <span className="slot font-bold">Python</span>
                <span className="slot font-bold">Robotics</span>
                <span className="slot font-bold">Game Dev</span>
              </Block>
            </Snap>
            <Snap i={3}>
              <Block
                color="green"
                shape="cap"
                href={MAILING_LIST}
                external
                className="w-fit max-w-full"
                bodyClassName="flex items-center gap-3 px-6 pt-4 pb-4 font-display text-xl font-extrabold"
              >
                Join our mailing list
                <ArrowRightIcon aria-hidden width={22} height={22} />
              </Block>
            </Snap>
          </div>

          <p className="mt-8 max-w-[60ch] text-lg text-ink-soft">
            Free classes for kids in grades 3-8, face-to-face and virtual, taught by high-school students
            in their own community.
          </p>
        </div>

        <div className="flex flex-col gap-10 lg:pt-6">
          {contest.active && (
            <aside aria-labelledby="contest-title" className="relative">
              <Pin />
              <div className="cb cb-blue cb-cap lg:rotate-[1.2deg]">
                <div className="cb-body px-6 pt-9 pb-6">
                  <h2 id="contest-title" className="text-2xl font-extrabold">
                    {contest.title}
                  </h2>
                  <p className="mt-3 max-w-[50ch]">{contest.blurb}</p>
                  <Link
                    href={contest.href}
                    className="mt-5 inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 font-bold text-ink shadow-[inset_0_-2px_0_rgb(0_0_0/0.12)] hover:bg-events"
                  >
                    {contest.ctaLabel}
                    <ArrowRightIcon aria-hidden />
                  </Link>
                </div>
              </div>
            </aside>
          )}
          <StageArt />
        </div>
      </section>

      {/* What kids learn: block palette */}
      <section aria-labelledby="learn" className={`${wrap} mt-28 md:mt-36`}>
        <h2 id="learn" className="text-3xl font-extrabold sm:text-4xl">
          What kids learn
        </h2>
        <p className="mt-3 max-w-[65ch] text-lg text-ink-soft">
          Courses range from a first line of Python to AP and math-contest prep, so kids can keep going as
          they grow.
        </p>

        <div className="mt-10 rounded-2xl border-2 bg-stage p-4 sm:p-6">
          <ul className="divide-y-2">
            {palette.map((cat) => (
              <li key={cat.name} className="grid gap-4 py-5 first:pt-1 last:pb-3 sm:grid-cols-[9rem_minmax(0,1fr)] sm:items-start">
                <h3 className="flex items-center gap-3 text-lg font-bold sm:pt-2">
                  <span aria-hidden className={`cat-dot cb-${cat.color}`} />
                  {cat.name}
                </h3>
                <ul className="flex flex-wrap gap-x-3 gap-y-5">
                  {cat.courses.map((c) => (
                    <li key={c}>
                      <Block color={cat.color} bodyClassName="px-5 pt-4 pb-3 font-display text-lg font-bold">
                        {c}
                      </Block>
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        </div>

        <Block color="blue" shape="cap" href="/programs" className="mt-8 w-fit" bodyClassName="flex items-center gap-2 px-5 pt-4 pb-3 font-display font-bold">
          See all programs
          <ArrowRightIcon aria-hidden />
        </Block>
      </section>

      {/* Why trust: the program as a script */}
      <section aria-labelledby="how" className={`${wrap} mt-28 md:mt-36 grid gap-10 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]`}>
        <div>
          <h2 id="how" className="text-3xl font-extrabold sm:text-4xl">
            Run by students, free for families
          </h2>
          <p className="mt-3 max-w-[50ch] text-lg text-ink-soft">
            Hackathon4Kids is a small, student-run program. Here is how it works, written the way your kid
            would write it.
          </p>
        </div>

        <ol className="cb-stack max-w-2xl">
          <li>
            <Block color="yellow" shape="hat" bodyClassName="px-6 pt-5 pb-4">
              <p className="font-display text-xl font-bold">
                when founded in <span className="slot">2018</span>
              </p>
              <p className="mt-1">Two high-school students started Hackathon4Kids to teach younger kids computer science.</p>
            </Block>
          </li>
          <li>
            <Block color="purple" bodyClassName="px-6 pt-5 pb-4">
              <p className="font-display text-xl font-bold">
                set teachers to <span className="slot">high-school students</span>
              </p>
              <p className="mt-1">Every class is taught and run by high-school students, in person or online.</p>
            </Block>
          </li>
          <li>
            <Block color="green" bodyClassName="px-6 pt-5 pb-4">
              <p className="font-display text-xl font-bold">
                set price to <span className="slot">free</span>
              </p>
              <p className="mt-1">Classes cost nothing for families.</p>
            </Block>
          </li>
          <li>
            <Block color="orange" shape="cap" bodyClassName="px-6 pt-5 pb-5">
              <p className="font-display text-xl font-bold">forever</p>
              <p className="mt-1">Donations go toward assisting underprivileged children.</p>
            </Block>
          </li>
        </ol>
      </section>

      {/* Team teaser */}
      <section aria-labelledby="team" className={`${wrap} mt-28 md:mt-36`}>
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 id="team" className="text-3xl font-extrabold sm:text-4xl">
              Who teaches your kid
            </h2>
            <p className="mt-3 max-w-[60ch] text-lg text-ink-soft">
              Our instructors are high-school students who teach the courses they know well. Meet them and
              the team that runs the program.
            </p>
          </div>
          <Block color="teal" shape="cap" href="/about#instructors" className="w-fit shrink-0" bodyClassName="flex items-center gap-2 px-5 pt-4 pb-3 font-display font-bold">
            Meet the team
            <ArrowRightIcon aria-hidden />
          </Block>
        </div>
      </section>

      {/* Closing CTA */}
      <section aria-labelledby="join" className={`${wrap} mt-28 md:mt-36`}>
        <div className="rounded-3xl border-2 bg-stage px-5 py-10 sm:px-10 md:py-14">
          <div className="grid items-center gap-8 md:grid-cols-[minmax(0,1fr)_auto]">
            <div>
              <h2 id="join" className="text-3xl font-extrabold sm:text-4xl">
                Hear about the next class first
              </h2>
              <p className="mt-3 max-w-[55ch] text-lg text-ink-soft">
                Join the mailing list to get an email when the next program or contest opens. It takes a
                minute.
              </p>
            </div>
            <div className="cb-stack">
              <Block color="yellow" shape="hat" className="w-fit max-w-full" bodyClassName="px-6 pt-5 pb-3 font-display text-lg font-bold">
                when ready
              </Block>
              <Block
                color="green"
                shape="cap"
                href={MAILING_LIST}
                external
                className="w-fit max-w-full"
                bodyClassName="flex items-center gap-3 px-6 pt-4 pb-4 font-display text-xl font-extrabold"
              >
                Join our mailing list
                <ArrowRightIcon aria-hidden width={22} height={22} />
              </Block>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}

function Pin() {
  return (
    <svg aria-hidden viewBox="0 0 32 40" className="absolute -top-4 left-1/2 z-10 h-10 w-8 -translate-x-1/2">
      <ellipse cx="16" cy="37" rx="5" ry="2" fill="rgb(27 26 43 / 0.18)" />
      <path d="M16 22v14" stroke="#4a4760" strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="16" cy="13" r="11" fill="var(--color-pen)" />
      <circle cx="12.5" cy="9.5" r="3.5" fill="#fff" opacity="0.55" />
    </svg>
  )
}

// Decorative stage: green flag starts a sprite moving along its path.
function StageArt() {
  return (
    <svg aria-hidden viewBox="0 0 360 210" className="hidden w-full max-w-md self-center sm:block lg:self-start">
      <defs>
        <pattern id="dots" width="14" height="14" patternUnits="userSpaceOnUse">
          <circle cx="2" cy="2" r="1.2" fill="var(--color-grid)" />
        </pattern>
      </defs>
      <rect x="2" y="2" width="356" height="206" rx="18" fill="#fff" stroke="var(--color-grid)" strokeWidth="3" />
      <rect x="2" y="2" width="356" height="206" rx="18" fill="url(#dots)" />
      {/* green flag */}
      <path d="M40 60v110" stroke="var(--color-ink)" strokeWidth="4" strokeLinecap="round" />
      <path d="M42 62c14-8 26 8 42 0v34c-16 8-28-8-42 0z" fill="var(--color-operators)" stroke="var(--color-ink)" strokeWidth="3" strokeLinejoin="round" />
      {/* motion path */}
      <path d="M70 160c50 10 80-60 140-40s60-30 80-40" fill="none" stroke="var(--color-motion)" strokeWidth="4" strokeDasharray="2 12" strokeLinecap="round" />
      {/* sprite: small robot */}
      <g transform="translate(262 40)">
        <path d="M30 4v10" stroke="var(--color-ink)" strokeWidth="3" strokeLinecap="round" />
        <circle cx="30" cy="4" r="4" fill="var(--color-pen)" />
        <rect x="8" y="14" width="44" height="34" rx="10" fill="var(--color-events)" stroke="var(--color-ink)" strokeWidth="3" />
        <circle cx="22" cy="31" r="4" fill="var(--color-ink)" />
        <circle cx="38" cy="31" r="4" fill="var(--color-ink)" />
        <rect x="14" y="52" width="32" height="26" rx="7" fill="var(--color-looks)" stroke="var(--color-ink)" strokeWidth="3" />
        <path d="M22 78v8M38 78v8" stroke="var(--color-ink)" strokeWidth="3" strokeLinecap="round" />
      </g>
      {/* mini block on stage */}
      <g transform="translate(120 172)">
        <rect width="120" height="26" rx="6" fill="var(--color-motion)" />
        <text x="12" y="18" fill="#fff" fontSize="13" fontWeight="700" fontFamily="var(--font-display)">
          move 10 steps
        </text>
      </g>
    </svg>
  )
}
