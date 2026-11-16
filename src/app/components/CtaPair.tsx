import { ArrowRightIcon } from '@radix-ui/react-icons'
import Block from './Block'
import { MAILING_LIST } from '../content/contest'

// The primary action. The copy is fixed; do not reword it.
export function CtaPrimary({ hero, className }: { hero?: boolean; className?: string }) {
  return (
    <Block
      color="green"
      shape="cap"
      href={MAILING_LIST}
      external
      size={hero ? 'lg' : 'md'}
      className={className}
      bodyClassName={hero ? 'flex items-center gap-3 font-display text-xl font-extrabold' : 'font-bold'}
    >
      Get class dates by email
      {hero && <ArrowRightIcon aria-hidden width={22} height={22} />}
    </Block>
  )
}

// Green primary plus a blue secondary link, used at the end of pages.
export default function CtaPair({ secondary }: { secondary: { label: string; href: string } }) {
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-6">
      <CtaPrimary />
      <Block color="blue" href={secondary.href} bodyClassName="font-bold">
        {secondary.label}
      </Block>
    </div>
  )
}
