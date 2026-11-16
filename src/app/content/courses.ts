// Single source for course -> category. Every page reads this.
// neon: each group's accent token (Electric night).
export const categories = [
  { name: 'Code', neon: 'var(--color-code)', courses: ['Python', 'Git + GitHub', 'AP CSA'] },
  { name: 'Build', neon: 'var(--color-build)', courses: ['Robotics', 'Game Development'] },
  { name: 'Math', neon: 'var(--color-math)', courses: ['Intro to Algebra', 'AMC 8', 'AMC 10'] },
  { name: 'Physics', neon: 'var(--color-physics)', courses: ['Intro to Physics', 'AP Physics 1'] },
] as const satisfies readonly { name: string; neon: string; courses: readonly string[] }[]

export type Course = (typeof categories)[number]['courses'][number]
