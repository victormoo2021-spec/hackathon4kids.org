import { categories } from '../content/courses'
import ProofStatic from '../components/spot/ProofStatic'
import type { Course } from '../content/courses'
import type { Person } from './team'

const catOf = (course?: string) => categories.find((c) => (c.courses as readonly string[]).includes(course ?? ''))?.name.toLowerCase()

// One instructor: first name, role + grade, courses. No photo.
export default function Card({ person, i }: { person: Person; i: number }) {
  const { name, role, grade, tags } = person
  const cat = catOf(tags[0])
  return (
    <li data-ink="develop" data-i={i % 4} className="pg-card">
      {cat
        ? <ProofStatic name={tags[0] as Course} className={`pg-proof cat-${cat}`} />
        : <div aria-hidden className="pg-proof cat-code" />}
      <div>
        <h3 className="t-h3">{name}</h3>
        <p className="t-body">{role}, {grade}</p>
        {tags.length > 0 && <p className="t-body">{tags.join(', ')}</p>}
      </div>
    </li>
  )
}
