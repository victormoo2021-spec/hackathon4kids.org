import { expect, test } from '@playwright/test'
import { FX_DEFAULT, type FxState } from '../../src/app/components/fx/store'
import { SketchError, parseLine, runSketch } from '../../src/app/components/home/sketch'
import { SKETCH } from '../../src/app/components/home/program'

// pure unit tests: run once, not per browser project
test.skip(({ isMobile }) => isMobile, 'engine tests run once')

const EXPECTED: (Partial<FxState> | null)[] = [null, { glow: 'purple' }, { streaks: 5 }, { speed: 2 }, { sparkle: true }, { followMouse: true }]

test('SKETCH is the six paint-with-light lines', () => {
  expect(SKETCH).toEqual([
    '# paint with light',
    'glow = "purple"',
    'streaks = 5',
    'speed = 2',
    'sparkle = True',
    'follow_mouse = True',
  ])
})

test('parseLine maps each SKETCH line to its partial', () => {
  SKETCH.forEach((line, i) => expect(parseLine(line)).toEqual(EXPECTED[i]))
})

test('comments and blanks are null', () => {
  for (const l of ['', '   ', '# anything']) expect(parseLine(l)).toBeNull()
})

test('unknown names and out-of-range values throw SketchError', () => {
  for (const l of ['colour = 1', 'streaks = 99', 'streaks = -1', 'speed = 9', 'glow = "teal"', 'sparkle = 3'])
    expect(() => parseLine(l), l).toThrow(SketchError)
})

test('runSketch folds the first n lines', () => {
  // before any speed line the story idles slowly (speed .2)
  let want: Partial<FxState> = { ...FX_DEFAULT, speed: 0.2 }
  for (let n = 0; n <= SKETCH.length; n++) {
    if (n > 0 && EXPECTED[n - 1]) want = { ...want, ...EXPECTED[n - 1] }
    expect(runSketch(SKETCH, n), `n=${n}`).toMatchObject(want)
  }
  expect(runSketch(SKETCH, 6)).toMatchObject({ glow: 'purple', streaks: 5, speed: 2, sparkle: true, followMouse: true })
})
