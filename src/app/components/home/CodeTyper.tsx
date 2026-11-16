import { SKETCH } from './program'

// Editor window shown inside the laptop screen. `counts[i]` = characters of line i typed so far.
const TOKEN = /(#.*)|("[^"]*"?)|\b(True|False|\d+(?:\.\d+)?)\b|(=)/g
const CLS = ['c', 's', 'n', 'eq']

function tokens(line: string): [string, string?][] {
  const out: [string, string?][] = []
  let at = 0
  for (const m of Array.from(line.matchAll(TOKEN))) {
    if (m.index > at) out.push([line.slice(at, m.index)])
    out.push([m[0], CLS[m.slice(1).findIndex(Boolean)]])
    at = m.index + m[0].length
  }
  if (at < line.length) out.push([line.slice(at)])
  return out
}

/** "glow = \"purple\"" -> "glow → purple" */
const echo = (line: string) => line.replace(/\s*=\s*/, ' → ').replace(/"/g, '')

export default function CodeTyper({ counts }: { counts: number[] }) {
  const done = SKETCH.filter((l, i) => counts[i] >= l.length).length
  const active = Math.min(done, SKETCH.length - 1)
  const last = SKETCH.slice(0, done).filter((l) => !l.startsWith('#')).pop()
  return (
    <div className="win">
      <div className="bar">
        <span className="file">paint.py</span>
        <span className="run-btn">Run</span>
      </div>
      <pre className="code-typer" aria-hidden>
        {SKETCH.map((line, i) => (
          <span className={i === active ? 'ln on' : 'ln'} key={i}>
            <span className="no">{i + 1}</span>
            <span className="tx">
              {tokens(line.slice(0, counts[i])).map(([text, cls], j) => (
                <span key={j} className={cls && `t-${cls}`}>{text}</span>
              ))}
            </span>
          </span>
        ))}
      </pre>
      <p className="term" aria-hidden><span>$</span> <em>{last ? echo(last) : 'ready'}</em></p>
      <div className="sr-only">
        <p>A laptop showing paint.py, a short sketch. Each line changes the lights painting the background of this page:</p>
        <pre>{SKETCH.join('\n')}</pre>
      </div>
    </div>
  )
}
