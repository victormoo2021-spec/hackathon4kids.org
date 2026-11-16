import Image from 'next/image'
import Block from '../components/Block'
import { courseColor, type Person } from './team'

// One team member as a two-block script: a hat block (who) snapped onto a
// pale cap block (bio + the courses they teach as small blocks).
export default function Card({ person }: { person: Person }) {
  const { name, role, photo, bio, current, tags } = person
  return (
    <article className="break-inside-avoid mb-12">
      <Block
        color={current ? 'yellow' : 'blue'}
        shape="hat"
        bodyClassName="flex items-center gap-4"
      >
        <Image
          src={photo}
          alt={`Portrait of ${name}`}
          sizes="80px"
          className="size-20 shrink-0 rounded-panel object-cover ring-4 ring-white/70"
        />
        <span className="min-w-0">
          <h3 className="h-card leading-tight">{name}</h3>
          <span className="block leading-snug">{role}</span>
          <span className="slot mt-2 text-sm font-bold">{current ? 'Current team' : 'Former team'}</span>
        </span>
      </Block>
      <div
        className="cb cb-cap"
        style={{ '--cb-bg': 'var(--color-lilac)', '--cb-fg': 'var(--color-ink)' } as React.CSSProperties}
      >
        <div className="cb-body px-5 pt-6 pb-5">
          <p className="leading-relaxed">{bio}</p>
          <p className="mt-4 mb-2 text-sm font-bold text-ink-soft">Teaches</p>
          <ul className="flex flex-wrap gap-x-2 gap-y-4 pb-1">
            {tags.map((tag) => (
              <li key={tag}>
                <Block color={courseColor[tag]} shape="cap" size="sm" className="inline-block" bodyClassName="text-sm font-bold">
                  {tag}
                </Block>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </article>
  )
}
