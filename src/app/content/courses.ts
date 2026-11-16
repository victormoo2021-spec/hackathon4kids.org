// Single source for course -> category. Every page reads this.
// No per-category colors: the Deep night world keeps one purple and reserves yellow for the eye path.
export const categories = [
  { name: 'Code', courses: ['Python', 'Git + GitHub', 'AP CSA'] },
  { name: 'Build', courses: ['Robotics', 'Game Development'] },
  { name: 'Math', courses: ['Intro to Algebra', 'AMC 8', 'AMC 10'] },
  { name: 'Physics', courses: ['Intro to Physics', 'AP Physics 1'] },
] as const satisfies readonly { name: string; courses: readonly string[] }[]

export type Course = (typeof categories)[number]['courses'][number]
