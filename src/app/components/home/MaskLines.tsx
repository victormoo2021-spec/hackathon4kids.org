type Props = { id: string; lines: readonly string[]; dimFrom?: number; hl?: string; className?: string }

/** Display headline; each line reveals with the shared CSS reveal. */
export default function MaskLines({ id, lines, dimFrom = Infinity, hl, className = '' }: Props) {
  return (
    <h2 id={id} className={`t-display ${className}`}>
      {lines.map((l, i) => (
        <span key={l} data-reveal="fade" className={`block ${i >= dimFrom ? 'text-text-dim' : ''}`}>
          {hl && l.includes(hl) ? <>{l.split(hl)[0]}<span className="hl">{hl}</span>{l.split(hl)[1]}</> : l}
        </span>
      ))}
    </h2>
  )
}
