import Image from 'next/image'
import { categories } from '../content/courses'
import { courseColor, type Person } from './team'

const hueOf = (tag: Person['tags'][number]) =>
  categories.find((c) => c.color === courseColor[tag])?.hue

const LONG = 200

// One team member: soft card, rounded photo, status pill, bio with disclosure when long.
export default function Card({ person }: { person: Person }) {
  const { name, role, photo, bio, current, tags } = person
  return (
    <article data-reveal className="lift flex flex-col rounded-[1.75rem] bg-mist p-7">
      <div className="flex items-center gap-4">
        <Image
          src={photo}
          alt={`Portrait of ${name}`}
          sizes="80px"
          className="size-20 shrink-0 rounded-full object-cover"
        />
        <div className="min-w-0">
          <h3 className="t-title leading-tight">{name}</h3>
          <p className="text-ink-soft">{role}</p>
        </div>
      </div>
      <p className="mt-4 w-fit rounded-full bg-paper px-3 py-1 text-xs font-semibold">
        {current ? 'Current team' : 'Former team'}
      </p>
      {bio.length > LONG ? (
        <details className="group mt-4">
          <summary className="cursor-pointer list-none">
            <span className="bio-clamp leading-relaxed group-open:hidden">{bio}</span>
            <span className="mt-2 inline-block text-sm font-semibold text-accent group-open:hidden">Read more</span>
            <span className="hidden leading-relaxed group-open:block">{bio}</span>
            <span className="mt-2 hidden text-sm font-semibold text-accent group-open:inline-block">Show less</span>
          </summary>
        </details>
      ) : (
        <p className="mt-4 leading-relaxed">{bio}</p>
      )}
      <ul className="mt-5 flex flex-wrap gap-2" aria-label="Teaches">
        {tags.map((tag) => (
          <li key={tag} className="flex items-center gap-2 rounded-full bg-paper px-3 py-1 text-sm">
            <span aria-hidden className="size-2 rounded-full" style={{ background: hueOf(tag) }} />
            {tag}
          </li>
        ))}
      </ul>
    </article>
  )
}
