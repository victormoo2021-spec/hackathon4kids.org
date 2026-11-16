import Link from 'next/link'

export type BlockColor = 'yellow' | 'orange' | 'green' | 'purple' | 'blue' | 'teal' | 'pink'

type BlockProps = {
  color: BlockColor
  shape?: 'stack' | 'hat' | 'cap'
  href?: string
  external?: boolean
  className?: string
  bodyClassName?: string
  children: React.ReactNode
}

// A code block from the block-coding world. Renders a link when href is set.
export default function Block({
  color,
  shape = 'stack',
  href,
  external,
  className = '',
  bodyClassName = 'px-5 py-3',
  children,
}: BlockProps) {
  const cls = `cb cb-${color} ${shape === 'hat' ? 'cb-hat' : ''} ${shape === 'cap' ? 'cb-cap' : ''} ${className}`
  const body = <div className={`cb-body ${bodyClassName}`}>{children}</div>

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
