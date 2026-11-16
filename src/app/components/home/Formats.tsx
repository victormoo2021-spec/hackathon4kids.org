import Reveal from '../motion/Reveal'

const items = [
  { title: 'In person', body: 'Hands-on classes in the Bay Area.' },
  { title: 'Online', body: 'Live classes from home.' },
]

export default function Formats() {
  return (
    <Reveal as="section" id="formats" aria-labelledby="formats-title" className="container-x section-y">
      <h2 id="formats-title" data-spectral className="sr-only">In person and online</h2>
      <div data-reveal="rule" data-streak-anchor="r" className="formats-grid relative grid md:grid-cols-2">
        {items.map((it, i) => (
          <div key={it.title} data-reveal data-delay={i ? 120 : undefined} className={`py-8 md:py-2 ${i ? 'border-t border-line md:border-t-0 md:pl-12' : 'md:pr-12'}`}>
            <h3 className="t-title text-text">{it.title}</h3>
            <p className="mt-2 text-xl text-text-body">{it.body}</p>
          </div>
        ))}
      </div>
    </Reveal>
  )
}
