import EmailCta from './EmailCta'
import '../pages.css'

// Shared layout for .mdx pages: stock ground, 24px yellow bar, prose column, mailing-list action.
export default function MdxLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="pg">
      <div className="pg-bar" aria-hidden />
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

// Yellow closing band shared by /about and /programs.
export function FinalBand({ children }: { children?: React.ReactNode }) {
  return (
    <section className="pg-final" aria-labelledby="final-h">
      <div className="grid-x">
        <div className="pg-col-8">
          <h2 id="final-h" data-ink="wipe" className="t-h2">Get class dates</h2>
          <div className="lockup flex flex-wrap items-center gap-6">
            <EmailCta size="lg" />
            {children}
          </div>
        </div>
      </div>
    </section>
  )
}
