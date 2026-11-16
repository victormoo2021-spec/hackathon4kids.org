'use client'

import { useEffect, useRef, useState } from 'react'
import { DEMO_CODE, runDemo, type DemoKind } from './demos'

export const INTRO = 'print("Hi! Let\'s make something.")'
const FILES: Record<DemoKind, string> = { code: 'spiral.py', build: 'arm.py', math: 'line.py', physics: 'pendulum.py' }
const CHAR_MS = 22

// comments dim; strings and numbers yellow; everything else (keywords, names) plain
const TOKEN = /(#.*)|("[^"]*"?|'[^']*'?)|\b(\d+(?:\.\d+)?)\b/g
const CLS = ['c', 's', 'n']

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

type Props = { kind: DemoKind | null; active?: boolean; delay?: number; onDone?: () => void }

// Editor window: filename tab, the program typed quickly as a compact header, its demo playing below.
// kind null = the hero's intro line (no demo). Re-keyed per kind so each switch wipes in fresh.
export default function CodeTyper({ kind, active = true, delay = 0, onDone }: Props) {
  const text = kind ? DEMO_CODE[kind] : INTRO
  const [n, setN] = useState(text.length) // full text without JS
  const [running, setRunning] = useState(false)
  const cv = useRef<HTMLCanvasElement>(null)
  const done = useRef(onDone)
  done.current = onDone

  useEffect(() => {
    setRunning(false)
    if (!active) return
    const calm = matchMedia('(prefers-reduced-motion: reduce)').matches
    let stop = () => {}
    let i = calm ? text.length : 0
    let id = 0
    setN(i)
    const finish = () => {
      if (kind && cv.current) {
        stop = runDemo(cv.current, kind, { calm })
        setRunning(true)
      }
      done.current?.()
    }
    const tick = () => {
      setN(++i)
      if (i >= text.length) finish()
      else id = window.setTimeout(tick, CHAR_MS)
    }
    if (i >= text.length) id = window.setTimeout(finish, delay)
    else id = window.setTimeout(tick, delay)
    return () => {
      clearTimeout(id)
      stop()
    }
  }, [kind, active, text, delay])

  let left = n
  const full = text.split('\n')
  const lines = full.map((l) => {
    const typed = l.slice(0, Math.max(0, left))
    left -= l.length + 1
    return typed
  })
  const typing = full.findIndex((l, i) => lines[i].length < l.length)
  const cur = typing < 0 ? full.length - 1 : typing

  return (
    <div className="win">
      <div className="bar">
        <span className="file">{kind ? FILES[kind] : 'hello.py'}</span>
        <span className="run" data-on={running ? '' : undefined}>Run</span>
      </div>
      <div className="win-body" key={kind ?? 'intro'}>
        <pre className="code-typer" aria-hidden>
          {lines.map((l, i) => (
            <span className={i === cur ? 'ln on' : 'ln'} key={i}>
              <span className="no">{i + 1}</span>
              <span className="tx">
                {tokens(l).map(([t, c], j) => (
                  <span key={j} className={c && `t-${c}`}>{t}</span>
                ))}
              </span>
            </span>
          ))}
        </pre>
        <canvas ref={cv} className="demo-cv" aria-hidden />
      </div>
      <p className="sr-only">A short Python program, {kind ? FILES[kind] : 'hello.py'}, and what it draws when it runs: {text}</p>
    </div>
  )
}

/** Inline editor card (mobile and reduced motion): plays its demo while on screen. */
export function DemoCard({ kind }: { kind: DemoKind }) {
  const ref = useRef<HTMLDivElement>(null)
  const [on, setOn] = useState(false)
  useEffect(() => {
    const io = new IntersectionObserver(([e]) => setOn(e.isIntersecting), { rootMargin: '-10% 0px' })
    io.observe(ref.current!)
    return () => io.disconnect()
  }, [])
  return (
    <div ref={ref} className="demo-card">
      <CodeTyper kind={kind} active={on} />
    </div>
  )
}
