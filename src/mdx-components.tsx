import type { MDXComponents } from 'mdx/types'
import Image, { type ImageProps } from 'next/image'

// Apple-docs typography for markdown in .mdx pages (see app/code.org/page.mdx).
export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    h1: ({ children }) => <h1 className="t-headline mb-8 text-text">{children}</h1>,
    h2: ({ children }) => <h2 className="t-title mt-16 mb-3 text-text">{children}</h2>,
    h3: ({ children }) => <h3 className="mt-10 mb-2 text-xl font-semibold tracking-tight text-text">{children}</h3>,
    p: ({ children }) => <p className="my-4 text-[1.0625rem] leading-[1.7] text-text-dim">{children}</p>,
    ol: ({ children }) => <ol className="my-8 list-none space-y-4 [counter-reset:step]">{children}</ol>,
    ul: ({ children }) => (
      <ul className="my-5 list-disc space-y-3 pl-6 text-[1.0625rem] leading-[1.7] text-text-dim marker:text-text-dim">{children}</ul>
    ),
    li: ({ children }) => (
      <li className="relative card p-6 pl-16 text-[1.0625rem] leading-[1.7] text-text-dim [counter-increment:step] before:absolute before:left-5 before:top-6 before:flex before:size-8 before:items-center before:justify-center before:rounded-full before:bg-white/[0.06] before:text-sm before:font-semibold before:text-text before:content-[counter(step)] [&>p]:my-0">
        {children}
      </li>
    ),
    a: ({ href, children }) => {
      const external = href?.startsWith('http')
      return (
        <a
          href={href}
          className="link py-[0.35em] font-medium"
          {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
        >
          {children}
        </a>
      )
    },
    strong: ({ children }) => <strong className="font-semibold text-text">{children}</strong>,
    em: ({ children }) => <em className="italic">{children}</em>,
    code: ({ children }) => (
      <code className="rounded-md bg-white/[0.06] px-1.5 py-0.5 font-mono text-[0.9em] text-text">{children}</code>
    ),
    hr: () => <hr className="my-10 border-t border-line" />,
    img: (props) => (
      <Image
        sizes="(min-width: 768px) 32rem, 100vw"
        width={0}
        height={0}
        className="my-6 h-auto w-full max-w-lg rounded-2xl border border-line"
        {...(props as ImageProps)}
        alt={props.alt ?? ''}
      />
    ),
    ...components,
  }
}
