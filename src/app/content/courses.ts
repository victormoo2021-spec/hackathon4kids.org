import type { BlockColor } from '../components/Block'

// Single source for course -> category -> block color. Every page reads this.
// Text color on each block follows the AA rule in globals.css.
// `hue` is the category accent in the Apple-clean world: use for small marks,
// icons, glows and mini visuals only, never as a text color on white.
export const categories = [
  { name: 'Code', color: 'purple', hue: '#2448f5', courses: ['Python', 'Git + GitHub', 'AP CSA'] },
  { name: 'Build', color: 'blue', hue: '#7a5af8', courses: ['Robotics', 'Game Development'] },
  { name: 'Math', color: 'green', hue: '#0ea47a', courses: ['Intro to Algebra', 'AMC 8', 'AMC 10'] },
  { name: 'Physics', color: 'teal', hue: '#f76b15', courses: ['Intro to Physics', 'AP Physics 1'] },
] as const satisfies readonly { name: string; color: BlockColor; hue: string; courses: readonly string[] }[]

export type Course = (typeof categories)[number]['courses'][number]

export const courseColor = Object.fromEntries(
  categories.flatMap((c) => c.courses.map((course) => [course, c.color])),
) as Record<Course, BlockColor>
