import { memo } from 'react'
import { PROGRAM } from './program'

// The full program, always visible. StoryStage moves the `on` class between lines like a debugger.
const TOKEN = /(#.*)|("[^"]*")|\b(import|for|in)\b|\b(\d+)\b|([A-Za-z_]\w*)(?=\()/g
const CLS = ['c', 's', 'k', 'n', 'f']
const LINES = PROGRAM.split('\n')

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

export default memo(function CodeTyper() {
  return (
    <pre className="code-typer" aria-hidden>
      {LINES.map((line, i) => (
        <span className={i === LINES.length - 1 ? 'ln on' : 'ln'} key={i} style={{ '--i': i } as React.CSSProperties}>
          <span className="no">{i + 1}</span>
          <span className="tx">
            {tokens(line).map(([text, cls], j) => (
              <span key={j} className={cls && `t-${cls}`}>{text}</span>
            ))}
          </span>
        </span>
      ))}
    </pre>
  )
})
