'use client'

import { useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useGSAP } from '@gsap/react'
import EmailCta from '../EmailCta'
import Device from './Device'
import GameScene from './GameScene'
import CourseFlyIn, { allCourses } from './CourseFlyIn'
import './hero.css'

gsap.registerPlugin(ScrollTrigger, useGSAP)

const FACTS = ['Free', 'Grades 3-8', 'Bay Area', 'In person and online', 'Up to 20 kids per class']
const CAPS = [
  'Write a few lines.',
  'Press run.',
  'Watch it come alive.',
  'Then keep going: Python, robotics, game design, math, physics.',
]

export default function Hero() {
  const root = useRef<HTMLElement>(null)

  useGSAP(
    () => {
      const hero = root.current!
      const $ = (s: string) => hero.querySelector<HTMLElement>(s)!
      const $$ = (s: string) => gsap.utils.toArray<HTMLElement>(s, hero)
      const mm = gsap.matchMedia()

      mm.add('(min-width: 900px) and (prefers-reduced-motion: no-preference)', () => {
        const wrap = $('.device-wrap')
        const caps = $$('.cap')
        const chars = $$('.device .ln:nth-child(n+3) .ch')
        const cards = $$('.flyin li')
        const sparks = $$('.device .gs-spark')
        const robot = $('.device .gs-robot')
        const star = $('.device .gs-star')
        const capIn = { autoAlpha: 1, y: 0, duration: 0.5, ease: 'power2.out' }
        const capFrom = { autoAlpha: 0, y: 26 }
        const capOut = { autoAlpha: 0, y: -26, duration: 0.4, ease: 'power2.in' }
        const cy = () => wrap.offsetTop + wrap.offsetHeight / 2

        const tl = gsap.timeline({
          defaults: { ease: 'none' },
          scrollTrigger: {
            trigger: hero,
            start: 'top top',
            end: () => '+=' + Math.round(window.innerHeight * 2.8),
            pin: true,
            scrub: 0.6,
            anticipatePin: 1,
            invalidateOnRefresh: true,
          },
        })

        // a) copy leaves, device glides to center
        tl.to($('.hero-copy'), { autoAlpha: 0, x: -90, duration: 1.1, ease: 'power2.in' }, 0)
          .to(wrap, { x: () => hero.clientWidth / 2 - (wrap.offsetLeft + wrap.offsetWidth / 2), scale: 1.08, duration: 1.4, ease: 'power2.inOut' }, 0)
          .fromTo(caps[0], capFrom, capIn, 0.9)
          // type
          .fromTo(chars, { opacity: 0 }, { opacity: 1, duration: 0.02, stagger: { amount: 2.8 } }, 1.3)
          .to(caps[0], capOut, 4.3)
          // b) run
          .fromTo(caps[1], capFrom, capIn, 4.5)
          .to($('.run-btn'), { scale: 0.88, backgroundColor: '#1d3bf0', duration: 0.18, ease: 'power2.out' }, 4.9)
          .to($('.run-btn'), { scale: 1, duration: 0.25, ease: 'back.out(3)' }, 5.1)
          // c) screen becomes the game
          .to($('.editor'), { scale: 0.94, opacity: 0, duration: 0.8, ease: 'power2.in' }, 5.5)
          .fromTo($('.game-layer'), { clipPath: 'inset(0 0 0 100%)' }, { clipPath: 'inset(0 0 0 0%)', duration: 0.9, ease: 'power2.inOut' }, 5.4)
          .to(caps[1], capOut, 5.6)
          .fromTo(caps[2], capFrom, capIn, 6)
          .to(robot, { x: 170, duration: 1.3, ease: 'power1.inOut' }, 6.4)
          .to(robot, { y: -78, duration: 1, ease: 'power1.inOut' }, 7.7)
          .to(robot, { y: -92, duration: 0.25, yoyo: true, repeat: 1, ease: 'power2.out' }, 8.7)
          .to(star, { scale: 0, rotation: 180, duration: 0.4, ease: 'back.in(2)' }, 8.85)
          .fromTo(sparks, { x: 0, y: 0, opacity: 1, scale: 1 }, {
            x: (i) => Math.cos((i * Math.PI) / 4) * 42,
            y: (i) => Math.sin((i * Math.PI) / 4) * 42,
            opacity: 0, scale: 0.3, duration: 0.7, ease: 'power2.out',
          }, 8.9)
          .to(caps[2], capOut, 9.6)
          // d) courses fly out of the screen
          .fromTo(caps[3], capFrom, capIn, 9.9)
          .fromTo(cards,
            { xPercent: -50, yPercent: -50, x: () => hero.clientWidth / 2, y: cy, scale: 0.2, autoAlpha: 0 },
            {
              x: (i, el: HTMLElement) => hero.clientWidth / 2 + parseFloat(el.dataset.fx!) * hero.clientWidth,
              y: (i, el: HTMLElement) => cy() + parseFloat(el.dataset.fy!) * hero.clientHeight,
              scale: 1, autoAlpha: 1, duration: 1, ease: 'power3.out', stagger: 0.09,
            }, 9.8)
          // e) device settles back, then un-pins
          .to(wrap, { scale: 0.88, duration: 1, ease: 'power2.inOut' }, 11)
          .to({}, { duration: 0.6 }, 12)
      })

      const refresh = () => ScrollTrigger.refresh()
      document.fonts?.ready.then(refresh)
      requestAnimationFrame(refresh)
      return () => mm.revert()
    },
    { scope: root },
  )

  return (
    <section id="hero" ref={root} className="hero" aria-labelledby="hero-h1">
      <div className="container-x hero-grid">
        <div className="hero-copy">
          <h1 id="hero-h1" className="hero-h1">Free coding classes for grades 3-8.</h1>
          <p className="hero-cont rise" style={{ animationDelay: '60ms' }}>
            Taught by high-school students, in person and online.
          </p>
          <div className="rise" style={{ animationDelay: '140ms' }}>
            <EmailCta size="lg" reassure />
          </div>
          <ul className="facts rise" style={{ animationDelay: '220ms' }}>
            {FACTS.map((f) => <li key={f}>{f}</li>)}
          </ul>
        </div>
        <Device />
      </div>

      <div id="story" className="story">
        <div className="game-card"><GameScene loop /></div>
        <ul className="chips" aria-label="Courses">
          {allCourses.map((c) => (
            <li key={c.name} className="course-chip"><i style={{ background: c.hue }} />{c.name}</li>
          ))}
        </ul>
        <ol className="caps">
          {CAPS.map((c) => <li key={c} className="cap">{c}</li>)}
        </ol>
        <CourseFlyIn />
      </div>
    </section>
  )
}
