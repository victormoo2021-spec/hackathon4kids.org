import type { MDXComponents } from 'mdx/types'
import Image, { type ImageProps } from 'next/image'

// Apple-docs typography for markdown in .mdx pages (see app/code.org/page.mdx).
export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    h1: ({ children }) => <h1 className="t-headline mb-6">{children}</h1>,
    h2: ({ children }) => <h2 className="t-title mt-16 mb-3">{children}</h2>,
    h3: ({ children }) => <h3 className="mt-10 mb-2 text-xl font-semibold tracking-tight">{children}</h3>,
    p: ({ children }) => <p className="my-4 text-lg leading-relaxed">{children}</p>,
    ol: ({ children }) => <ol className="my-8 list-none space-y-4 [counter-reset:step]">{children}</ol>,
    ul: ({ children }) => (
      <ul className="my-5 list-disc space-y-3 pl-6 text-lg leading-relaxed marker:text-ink-soft">{children}</ul>
    ),
    li: ({ children }) => (
      <li className="relative rounded-3xl bg-mist p-6 pl-16 text-lg leading-relaxed [counter-increment:step] before:absolute before:left-5 before:top-6 before:flex before:size-8 before:items-center before:justify-center before:rounded-full before:bg-accent before:text-sm before:font-semibold before:text-white before:content-[counter(step)] [&>p]:my-0">
        {children}
      </li>
    ),
    a: ({ href, children }) => {
      const external = href?.startsWith('http')
      return (
        <a
          href={href}
          className="font-medium text-accent underline"
          {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
        >
          {children}
        </a>
      )
    },
    strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
    em: ({ children }) => <em className="italic">{children}</em>,
    code: ({ children }) => (
      <code className="rounded-md bg-mist px-1.5 py-0.5 font-mono text-[0.9em]">{children}</code>
    ),
    hr: () => <hr className="my-10 border-t border-hairline" />,
    img: (props) => (
      <Image
        sizes="(min-width: 768px) 32rem, 100vw"
        width={0}
        height={0}
        className="my-6 h-auto w-full max-w-lg rounded-3xl bg-mist p-4"
        {...(props as ImageProps)}
        alt={props.alt ?? ''}
      />
    ),
    ...components,
  }
}
