import { MAILING_LIST } from './contest'

const CONTACT_EMAIL = 'hackathon4kidsevent@gmail.com'

export type FaqItem = { q: string; a: string; link?: { href: string; label: string; external?: boolean } }

export const faq: FaqItem[] = [
  {
    q: 'Does it cost anything?',
    a: 'No. Hackathon4Kids classes and contests are free.',
  },
  {
    q: 'Who can join?',
    a: 'Kids in grades 3 to 8 in the Bay Area.',
  },
  {
    q: 'Where do classes happen?',
    a: 'Classes are offered both in person and online.',
  },
  {
    q: 'Who teaches the classes?',
    a: 'High school students teach them. We started in 2018, when two high school students founded Hackathon4Kids.',
  },
  {
    q: 'How big are the classes?',
    a: 'Each class has one instructor and up to 20 students.',
  },
  {
    q: 'When are the classes?',
    a: 'We have not set the schedule yet. When dates are ready, we will announce them by email. Join the mailing list to get them.',
    link: { href: MAILING_LIST, label: 'Join the mailing list', external: true },
  },
  {
    q: 'How do I sign up?',
    a: 'Parents or guardians can join our mailing list. We only email you when a new program or contest opens.',
    link: { href: MAILING_LIST, label: 'Join the mailing list', external: true },
  },
  {
    q: 'What happens to my email address?',
    a: 'We use it only to send Hackathon4Kids updates. We never sell it or share it.',
  },
  {
    q: 'How do the contests work?',
    a: 'Contests run on Code.org. Our contest page has the instructions.',
    link: { href: '/code.org', label: 'See the contest instructions' },
  },
  {
    q: 'How can I help or donate?',
    a: 'Email us. Donations go toward helping children who are underprivileged.',
    link: {
      href: `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent('Helping Hackathon4Kids')}`,
      label: CONTACT_EMAIL,
      external: true,
    },
  },
]
