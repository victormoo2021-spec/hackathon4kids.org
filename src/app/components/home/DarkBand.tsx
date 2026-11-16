import Link from 'next/link'
import { ArrowRightIcon } from '@radix-ui/react-icons'
import Reveal from '../motion/Reveal'
import MaskLines from './MaskLines'

export default function DarkBand() {
  return (
    <Reveal as="section" id="run-by-students" aria-labelledby="students-title" className="border-y border-line bg-[#100b1a]">
      <div className="container-x section-y">
        <MaskLines id="students-title" lines={['Run by high-school', 'students since 2018.']} className="max-w-5xl text-text" />
        <p data-reveal="fade" data-delay="150" className="t-lede mt-10 max-w-2xl">
          Two high-school students started Hackathon4Kids in 2018. Our instructors are high-school students, and donations go toward helping underprivileged children.
        </p>
        <p data-reveal="fade" data-delay="150" className="mt-4">
          <Link href="/about#instructors" className="link group inline-flex min-h-11 items-center gap-2 font-semibold">
            Meet the team <ArrowRightIcon aria-hidden className="transition-transform group-hover:translate-x-1" />
          </Link>
        </p>
      </div>
    </Reveal>
  )
}
