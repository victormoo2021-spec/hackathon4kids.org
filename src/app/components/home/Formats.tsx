import Reveal from '../motion/Reveal'

function Pin() {
  return (
    <svg aria-hidden viewBox="0 0 200 120" className="h-full w-full">
      <g stroke="#d2d2d8" strokeWidth="2" fill="none">
        <path d="M0 40h200M0 84h200M50 0v120M130 0v120M20 120L90 0" />
      </g>
      <ellipse cx="100" cy="92" rx="22" ry="6" fill="#1d1d1f" opacity=".12" />
      <path d="M100 88C80 62 76 54 76 44a24 24 0 0148 0c0 10-4 18-24 44z" fill="#2448f5" />
      <circle cx="100" cy="44" r="9" fill="#fff" />
    </svg>
  )
}

function Call() {
  return (
    <svg aria-hidden viewBox="0 0 200 120" className="h-full w-full">
      <rect x="20" y="12" width="160" height="96" rx="12" fill="#fff" stroke="#d2d2d8" strokeWidth="2" />
      <circle cx="36" cy="26" r="3.5" fill="#f76b15" />
      <circle cx="48" cy="26" r="3.5" fill="#f5b800" />
      <circle cx="60" cy="26" r="3.5" fill="#0ea47a" />
      {[[34, 40], [92, 40], [34, 72], [92, 72]].map(([x, y], i) => (
        <g key={i}>
          <rect x={x} y={y} width="54" height="28" rx="8" fill={i === 1 ? '#2448f5' : '#f5f5f7'} />
          <circle cx={x + 27} cy={y + 11} r="6" fill={i === 1 ? '#fff' : '#a1a1a6'} />
        </g>
      ))}
    </svg>
  )
}

const items = [
  { title: 'In person', body: 'Hands-on classes in the Bay Area.', visual: <Pin /> },
  { title: 'Online', body: 'Join live classes from home.', visual: <Call /> },
]

export default function Formats() {
  return (
    <Reveal as="section" id="formats" aria-labelledby="formats-title" className="container-x section-y">
      <h2 id="formats-title" data-reveal className="t-headline max-w-2xl">In person and online.</h2>
      <div className="mt-14 grid gap-5 md:grid-cols-2">
        {items.map((it) => (
          <div key={it.title} data-reveal className="card overflow-hidden bg-mist p-7 shadow-none md:p-9">
            <div className="h-44 rounded-[var(--radius-tile)] bg-white p-4 shadow-[var(--shadow-float)]">{it.visual}</div>
            <h3 className="t-title mt-8">{it.title}</h3>
            <p className="mt-2 text-lg text-ink-soft">{it.body}</p>
          </div>
        ))}
      </div>
    </Reveal>
  )
}
