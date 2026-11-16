import { expect, test } from '@playwright/test'
import { runTurtle } from '../../src/app/components/home/turtle'
import { PROGRAM } from '../../src/app/components/home/program'

// pure unit tests: run once, not per browser project
test.describe.configure({ mode: 'parallel' })
test.skip(({ isMobile }) => isMobile, 'engine tests run once')

const HEAD = 'import turtle\nt = turtle.Turtle()\n'
const len = (s: { x1: number; y1: number; x2: number; y2: number }) => Math.hypot(s.x2 - s.x1, s.y2 - s.y1)

test('square returns to the origin with 4 segments', () => {
  const { segments } = runTurtle(`${HEAD}for i in range(4):\n    t.forward(100)\n    t.left(90)`)
  expect(segments).toHaveLength(4)
  const last = segments[3]
  expect(Math.abs(last.x2)).toBeLessThan(1e-6)
  expect(Math.abs(last.y2)).toBeLessThan(1e-6)
})

test('penup prevents a segment', () => {
  const { segments } = runTurtle(`${HEAD}t.penup()\nt.forward(50)\nt.pendown()\nt.forward(50)`)
  expect(segments).toHaveLength(1)
})

test('print produces output', () => {
  expect(runTurtle('print("hi")').output).toEqual(['hi'])
})

test('loop variable arithmetic grows lengths', () => {
  const { segments } = runTurtle(`${HEAD}for i in range(5):\n    t.forward(10 + i * 5)\n    t.left(90)`)
  const lens = segments.map(len)
  expect(lens).toHaveLength(5)
  expect(lens[0]).toBeCloseTo(10)
  for (let i = 1; i < lens.length; i++) expect(lens[i]).toBeGreaterThan(lens[i - 1])
})

test('unsupported line throws an Error', () => {
  expect(() => runTurtle(`${HEAD}t.explode(3)`)).toThrow(Error)
})

test('PROGRAM runs and its output is truthful', () => {
  const { segments, output } = runTurtle(PROGRAM)
  expect(segments.length).toBeGreaterThan(20)
  for (const line of output) {
    const m = line.match(/(\d+)\s+lines/)
    if (m) expect(Number(m[1])).toBe(segments.length)
  }
})
