import { categories } from '../content/courses'
import ProofStatic from '../components/spot/ProofStatic'
import { INKS } from '../components/spot/Sections'
import type { Course } from '../content/courses'
import type { Person } from './team'

const catOf = (course?: string) => categories.find((c) => (c.courses as readonly string[]).includes(course ?? ''))?.name.toLowerCase()

// One instructor: first name, role + grade, courses. No photo.
export default function Card({ person, i }: { person: Person; i: number }) {
  const { name, role, grade, tags } = person
  const cat = catOf(tags[0])
  const ink = INKS[cat ? cat[0].toUpperCase() + cat.slice(1) : 'Code']
  return (
    <li data-m="rise" className="pg-card">
      {cat
        ? <ProofStatic name={tags[0] as Course} paper={ink[0]} ink={ink[1]} ghost={ink[2]} className={`pg-proof cat-${cat}`} />
        : <div aria-hidden className="pg-proof cat-code" />}
      <div>
        <h3 className="t-h3">{name}</h3>
        <p className="t-body">{role}, {grade}</p>
        {tags.length > 0 && <p className="t-body">{tags.join(', ')}</p>}
      </div>
    </li>
  )
}
