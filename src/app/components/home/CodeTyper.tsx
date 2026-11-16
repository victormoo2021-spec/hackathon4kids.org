import { memo } from 'react'
import { PROGRAM } from './program'

// Every character is its own span so a scrubbed timeline can reveal it; without JS all of it is visible.
const TOKEN = /(#.*)|("[^"]*")|\b(import|for|in)\b|\b(\d+)\b|([A-Za-z_]\w*)(?=\()/g
const CLS = ['c', 's', 'k', 'n', 'f']

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
      {PROGRAM.split('\n').map((line, i) => (
        <span className="ln" key={i}>
          <span className="no">{i + 1}</span>
          <span className="tx">
            {tokens(line).map(([text, cls], j) => (
              <span key={j} className={cls && `t-${cls}`}>
                {text.split('').map((ch, k) => <span className="ch" key={k}>{ch}</span>)}
              </span>
            ))}
          </span>
        </span>
      ))}
    </pre>
  )
})
