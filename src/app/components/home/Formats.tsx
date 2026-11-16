import Reveal from '../motion/Reveal'

const items = [
  { title: 'In person', body: 'Hands-on classes in the Bay Area.' },
  { title: 'Online', body: 'Live classes from home.' },
]

export default function Formats() {
  return (
    <Reveal as="section" id="formats" aria-labelledby="formats-title" className="container-x section-y">
      <h2 id="formats-title" data-reveal className="t-headline max-w-2xl">In person and online.</h2>
      <div className="mt-14 grid gap-5 md:grid-cols-2">
        {items.map((it) => (
          <div key={it.title} data-reveal className="course-card card p-9 md:p-11">
            <h3 className="t-title">{it.title}</h3>
            <p className="mt-3 text-lg text-ink-soft">{it.body}</p>
          </div>
        ))}
      </div>
    </Reveal>
  )
}
