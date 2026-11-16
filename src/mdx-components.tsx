import type { MDXComponents } from 'mdx/types'
import Image, { type ImageProps } from 'next/image'

// Block-world styling for markdown in .mdx pages (see app/code.org/page.mdx).
export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    h1: ({ children }) => (
      <h1 className="h-page mb-6">{children}</h1>
    ),
    // h2 is a snap-in "say" block, like a section of a script
    h2: ({ children }) => (
      <h2 className="cb cb-purple mt-14 mb-2 inline-block h-card sm:text-3xl">
        <span className="cb-body block px-5 pt-5 pb-4">{children}</span>
      </h2>
    ),
    h3: ({ children }) => (
      <h3 className="mt-10 mb-3 text-xl sm:text-2xl font-bold leading-snug">{children}</h3>
    ),
    p: ({ children }) => <p className="my-4 text-lg leading-relaxed">{children}</p>,
    ol: ({ children }) => (
      <ol className="my-5 list-decimal space-y-4 pl-7 text-lg leading-relaxed marker:font-display marker:font-bold marker:text-looks">
        {children}
      </ol>
    ),
    ul: ({ children }) => (
      <ul className="my-5 list-disc space-y-3 pl-7 text-lg leading-relaxed marker:text-looks">{children}</ul>
    ),
    li: ({ children }) => <li className="pl-1 [&>p]:my-0">{children}</li>,
    a: ({ href, children }) => {
      const external = href?.startsWith('http')
      return (
        <a
          href={href}
          className="font-bold text-motion underline hover:text-looks"
          {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
        >
          {children}
        </a>
      )
    },
    strong: ({ children }) => <strong className="font-bold">{children}</strong>,
    code: ({ children }) => (
      <code className="rounded-md bg-lilac px-1.5 py-0.5 font-mono text-[0.9em]">{children}</code>
    ),
    hr: () => <hr className="my-10 border-t-2 border-grid" />,
    img: (props) => (
      <Image
        sizes="(min-width: 768px) 32rem, 100vw"
        width={0}
        height={0}
        className="my-8 h-auto w-full max-w-lg rounded-media border-4 border-white shadow-soft"
        {...(props as ImageProps)}
        alt={props.alt ?? ''}
      />
    ),
    ...components,
  }
}
