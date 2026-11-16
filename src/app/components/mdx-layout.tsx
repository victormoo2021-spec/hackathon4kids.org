import Block from './Block'
import { MAILING_LIST } from '../content/contest'

// Shared layout for .mdx pages: readable measure on the stage, ends in the mailing list.
export default function MdxLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto w-full max-w-[75ch] px-4 sm:px-6 pt-10 pb-20 text-ink">
      <article>{children}</article>
      <div className="mt-12 flex flex-wrap gap-x-4 gap-y-6">
        <Block color="green" href={MAILING_LIST} external bodyClassName="px-5 py-3 font-bold">
          Get class dates by email
        </Block>
        <Block color="blue" href="/programs" bodyClassName="px-5 py-3 font-bold">
          See our programs
        </Block>
      </div>
    </div>
  )
}
