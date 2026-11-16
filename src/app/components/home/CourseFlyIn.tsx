import { categories } from '../../content/courses'

export const allCourses = categories.flatMap((c) => c.courses.map((name) => ({ name, hue: c.hue })))

// Decorative constellation (aria-hidden). Positions are fractions of the stage,
// measured from the device center; Hero's timeline turns them into pixels.
export default function CourseFlyIn() {
  const n = allCourses.length
  return (
    <ul className="flyin" aria-hidden>
      {allCourses.map((c, i) => {
        const a = ((-90 + 18 + (360 / n) * i) * Math.PI) / 180
        const wob = i % 2 ? 1 : 0.9
        return (
          <li key={c.name} className="course-chip" data-fx={(Math.cos(a) * 0.42 * wob).toFixed(3)} data-fy={(Math.sin(a) * 0.3).toFixed(3)}>
            <i style={{ background: c.hue }} />
            {c.name}
          </li>
        )
      })}
    </ul>
  )
}
