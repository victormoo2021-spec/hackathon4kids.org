import CtaPair from './CtaPair'

// Shared layout for .mdx pages: readable measure on the stage, ends in the mailing list.
export default function MdxLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto w-full max-w-[75ch] px-4 sm:px-6 page-top page-bottom text-ink">
      <article>{children}</article>
      <div className="mt-12">
        <CtaPair secondary={{ label: 'See our programs', href: '/programs' }} />
      </div>
    </div>
  )
}
