// Single source for course -> category -> accent hue. Every page reads this.
// `hue` is for small marks, icons, glows and mini visuals only, never as a text color on white.
export const categories = [
  { name: 'Code', hue: '#2448f5', courses: ['Python', 'Git + GitHub', 'AP CSA'] },
  { name: 'Build', hue: '#7a5af8', courses: ['Robotics', 'Game Development'] },
  { name: 'Math', hue: '#0ea47a', courses: ['Intro to Algebra', 'AMC 8', 'AMC 10'] },
  { name: 'Physics', hue: '#f76b15', courses: ['Intro to Physics', 'AP Physics 1'] },
] as const satisfies readonly { name: string; hue: string; courses: readonly string[] }[]

export type Course = (typeof categories)[number]['courses'][number]

export const courseHue = Object.fromEntries(
  categories.flatMap((c) => c.courses.map((course) => [course, c.hue])),
) as Record<Course, string>
