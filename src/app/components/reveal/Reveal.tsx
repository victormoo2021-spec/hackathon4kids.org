// Server component. Descendants marked data-reveal (""|"fade"|"clip"|"rule") animate in; see reveal.css.
type Props = {
  children: React.ReactNode
  className?: string
  as?: 'div' | 'section' | 'ul' | 'ol' | 'article'
  id?: string
  'aria-labelledby'?: string
}

export default function Reveal({ children, as: Tag = 'div', ...rest }: Props) {
  return <Tag {...rest}>{children}</Tag>
}
