// Fictional kid-friendly Python. Every character is its own span so a scrubbed
// timeline can reveal it; without JS everything is simply visible.
type Tok = [text: string, cls?: 'c' | 'k' | 's' | 'f' | 'n']
const LINES: Tok[][] = [
  [['# Help the robot find the star', 'c']],
  [['robot', 'n'], [' = '], ['Robot', 'f'], ['()']],
  [['robot.'], ['forward', 'f'], ['('], ['3', 'n'], [')']],
  [['robot.'], ['turn', 'f'], ['('], ['"left"', 's'], [')']],
  [['if ', 'k'], ['robot.'], ['sees', 'f'], ['('], ['"star"', 's'], ['):']],
  [['    robot.'], ['jump', 'f'], ['()']],
]

export default function CodeTyper() {
  return (
    <pre className="code-typer" aria-hidden>
      {LINES.map((line, i) => (
        <span className="ln" key={i}>
          <span className="no">{i + 1}</span>
          <span className="tx">
            {line.map(([text, cls], j) => (
              <span key={j} className={cls ? `t-${cls}` : undefined}>
                {text.split("").map((ch, k) => (
                  <span className="ch" key={k}>{ch}</span>
                ))}
              </span>
            ))}
          </span>
        </span>
      ))}
    </pre>
  )
}
