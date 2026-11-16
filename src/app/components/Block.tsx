import Link from 'next/link'

export type BlockColor = 'yellow' | 'orange' | 'green' | 'purple' | 'blue' | 'teal' | 'pink'

type BlockProps = {
  color: BlockColor
  shape?: 'stack' | 'hat' | 'cap'
  href?: string
  external?: boolean
  className?: string
  size?: 'sm' | 'md' | 'lg'
  bodyClassName?: string
  children: React.ReactNode
}

// Padding recipes: the top is deeper than the bottom to clear the notch; hats add a little more.
const pad = {
  sm: { stack: 'px-3 pt-2 pb-1.5', hat: 'px-3 pt-3 pb-1.5' },
  md: { stack: 'px-5 pt-4 pb-3', hat: 'px-5 pt-5 pb-3' },
  lg: { stack: 'px-6 pt-5 pb-4', hat: 'px-6 pt-6 pb-4' },
}

// A code block from the block-coding world. Renders a link when href is set.
export default function Block({
  color,
  shape = 'stack',
  href,
  external,
  className = '',
  size = 'md',
  bodyClassName = '',
  children,
}: BlockProps) {
  const cls = `cb cb-${color} ${shape === 'hat' ? 'cb-hat' : ''} ${shape === 'cap' ? 'cb-cap' : ''} ${className}`
  const body = <div className={`cb-body ${pad[size][shape === 'hat' ? 'hat' : 'stack']} ${bodyClassName}`}>{children}</div>

  if (href && external) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={cls}>
        {body}
      </a>
    )
  }
  if (href) {
    return (
      <Link href={href} className={cls}>
        {body}
      </Link>
    )
  }
  return <div className={cls}>{body}</div>
}
