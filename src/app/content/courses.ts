import type { BlockColor } from '../components/Block'

// Single source for course -> category -> block color. Every page reads this.
// Text color on each block follows the AA rule in globals.css.
export const categories = [
  { name: 'Code', color: 'purple', courses: ['Python', 'Git + GitHub', 'AP CSA'] },
  { name: 'Build', color: 'blue', courses: ['Robotics', 'Game Development'] },
  { name: 'Math', color: 'green', courses: ['Intro to Algebra', 'AMC 8', 'AMC 10'] },
  { name: 'Physics', color: 'teal', courses: ['Intro to Physics', 'AP Physics 1'] },
] as const satisfies readonly { name: string; color: BlockColor; courses: readonly string[] }[]

export type Course = (typeof categories)[number]['courses'][number]

export const courseColor = Object.fromEntries(
  categories.flatMap((c) => c.courses.map((course) => [course, c.color])),
) as Record<Course, BlockColor>
