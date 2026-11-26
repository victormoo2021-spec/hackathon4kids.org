import Reveal from '../reveal/Reveal'
import EmailCta from '../EmailCta'

export default function FinalCta() {
  return (
    <Reveal as="section" id="join" aria-labelledby="join-title" className="container-x section-y text-center">
      <h2 id="join-title" data-reveal className="t-display mx-auto max-w-4xl">Get the next <span className="hl">class dates</span>.</h2>
      <div className="mt-10">
        <EmailCta size="lg" align="center" />
      </div>
    </Reveal>
  )
}
