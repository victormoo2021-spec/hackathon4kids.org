import Reveal from '../motion/Reveal'
import EmailCta from '../EmailCta'

export default function FinalCta() {
  return (
    <Reveal as="section" id="join" aria-labelledby="join-title" className="container-x section-y text-center">
      <h2 id="join-title" data-reveal className="t-display mx-auto max-w-4xl">Get the next class dates.</h2>
      <svg aria-hidden viewBox="0 0 2 96" className="cta-trail mt-12">
        <path d="M1 0V96" pathLength={1} />
      </svg>
      <div data-reveal className="mt-2">
        <EmailCta size="lg" align="center" />
      </div>
      <p data-reveal className="mt-6 text-text-dim">For parents and guardians.</p>
    </Reveal>
  )
}
