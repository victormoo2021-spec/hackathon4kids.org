import type { MDXComponents } from 'mdx/types'
import Image, { type ImageProps } from 'next/image'

// Prose styling for markdown in .mdx pages (see app/code.org/page.mdx). Role classes only.
export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    h1: ({ children }) => <h1 data-m="head" className="t-h2">{children}</h1>,
    h2: ({ children }) => <h2 data-m="head" className="t-h3 mt-12 mb-3">{children}</h2>,
    h3: ({ children }) => <h3 className="t-h3 mt-8 mb-2">{children}</h3>,
    p: ({ children }) => <p className="t-body">{children}</p>,
    ol: ({ children }) => <ol className="pg-steps t-body">{children}</ol>,
    ul: ({ children }) => <ul className="t-body my-5 list-disc space-y-3 pl-6">{children}</ul>,
    li: ({ children }) => <li>{children}</li>,
    a: ({ href, children }) => {
      const external = href?.startsWith('http')
      return (
        <a href={href} className="pg-link py-[0.75em]" {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>
          {children}
        </a>
      )
    },
    strong: ({ children }) => <strong className="font-bold">{children}</strong>,
    em: ({ children }) => <span>{children}</span>,
    code: ({ children }) => <code className="t-mono">{children}</code>,
    hr: () => <hr />,
    img: (props) => (
      <Image
        sizes="(min-width: 768px) 32rem, 100vw"
        width={0}
        height={0}
        className="h-auto w-full max-w-lg"
        {...(props as ImageProps)}
        alt={props.alt ?? ''}
      />
    ),
    ...components,
  }
}
