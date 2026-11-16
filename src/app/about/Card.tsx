import Image from 'next/image'
import type { Person } from './team'

const LONG = 200

// One team member: dark card, ringed photo, status pill, bio with disclosure when long.
export default function Card({ person }: { person: Person }) {
  const { name, role, photo, bio, current, tags } = person
  return (
    <article data-reveal className="card lift flex w-full flex-col p-7 md:w-[calc((100%-1.5rem)/2)] xl:w-[calc((100%-3rem)/3)]">
      <div className="flex items-center gap-4">
        <Image
          src={photo}
          alt={`Portrait of ${name}`}
          sizes="80px"
          className="size-20 shrink-0 rounded-full object-cover ring-1 ring-white/[0.12] ring-offset-2 ring-offset-[#120d1c]"
        />
        <div className="min-w-0">
          <h3 className="t-title leading-tight text-text">{name}</h3>
          <p className="text-text-body">{role}</p>
        </div>
      </div>
      <p className="mt-4 w-fit rounded-full bg-white/[0.06] px-3 py-1 text-sm font-semibold text-text">
        {current ? 'Current team' : 'Former team'}
      </p>
      {bio.length > LONG ? (
        <details className="group mt-4">
          <summary className="cursor-pointer list-none">
            <span className="bio-clamp leading-relaxed text-text-body group-open:hidden">{bio}</span>
            <span className="mt-2 inline-flex min-h-11 items-center text-sm font-semibold text-purple-soft group-open:hidden">Read more</span>
            <span className="hidden leading-relaxed text-text-body group-open:block">{bio}</span>
            <span className="mt-2 hidden min-h-11 items-center text-sm font-semibold text-purple-soft group-open:inline-flex">Show less</span>
          </summary>
        </details>
      ) : (
        <p className="mt-4 leading-relaxed text-text-body">{bio}</p>
      )}
      <ul className="mt-5 flex flex-wrap gap-2" aria-label="Teaches">
        {tags.map((tag) => (
          <li key={tag} className="rounded-full px-3 py-1 text-sm text-text-body border border-line">{tag}</li>
        ))}
      </ul>
    </article>
  )
}
