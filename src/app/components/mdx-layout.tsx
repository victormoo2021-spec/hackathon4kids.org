import EmailCta from './EmailCta'
import '../pages.css'

// Shared layout for .mdx pages: Apple-docs reading column, ends in the mailing list.
export default function MdxLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="container-x page-hero pb-28 text-ink">
      <article className="mx-auto max-w-[68ch]">{children}</article>
      <div className="mx-auto mt-16 flex max-w-[68ch] flex-wrap items-center gap-4">
        <EmailCta size="lg" />
        <a href="/programs" className="btn btn-secondary btn-lg">See our programs</a>
      </div>
    </div>
  )
}
