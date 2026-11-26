import EmailCta from './EmailCta'
import '../pages.css'

// Shared layout for .mdx pages: dark ground, hairline, prose column, mailing-list action.
export default function MdxLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="pg">
      <div className="grid-x pg-prose">
        <div className="pg-col-8">
          <article>{children}</article>
          <div className="mt-12">
            <EmailCta size="lg" />
          </div>
        </div>
      </div>
    </div>
  )
}

// Accent closing band shared by /about and /programs.
export function FinalBand({ children }: { children?: React.ReactNode }) {
  return (
    <section className="pg-final" aria-labelledby="final-h">
      <div className="grid-x">
        <h2 id="final-h" data-m="head" className="t-h2 pg-col-8">Next class dates</h2>
        <div className="lockup pg-col-4 flex flex-wrap items-center gap-6">
          <EmailCta size="lg" />
          {children}
        </div>
      </div>
    </section>
  )
}
