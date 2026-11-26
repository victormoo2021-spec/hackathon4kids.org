import './globals.css'
import './shell.css'
import type { Metadata, Viewport } from 'next'
import RevealObserver from './components/reveal/RevealObserver'
import './components/reveal/reveal.css'
import './components/spot/spot.css'
import { archivo, ibmPlexMono } from './fonts'
import Navigation from './Navigation'
import Footer from './Footer'

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#FFD60A',
}

export const metadata: Metadata = {
  metadataBase: new URL('https://hackathon4kids.org'),
  title: {
    default: 'Hackathon4Kids | Free coding classes, grades 3-8',
    template: '%s · Hackathon4Kids',
  },
  description:
    'Free coding and STEM classes for kids in grades 3-8 in the Bay Area, face-to-face and virtual, taught by high-school students. Join the mailing list to hear about the next program.',
  openGraph: {
    title: 'Hackathon4Kids | Free coding classes, grades 3-8',
    description: 'Free coding and STEM classes for kids in grades 3-8 in the Bay Area, taught by high-school students.',
    url: '/',
    siteName: 'Hackathon4Kids',
    type: 'website',
  },
  twitter: { card: 'summary_large_image', title: 'Hackathon4Kids | Free coding classes, grades 3-8' },
  alternates: { canonical: '/' },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${archivo.variable} ${ibmPlexMono.variable}`}>
      <body className="flex min-h-screen flex-col font-sans text-text">
        <a href="#main" className="skip-link">
          Skip to content
        </a>
        <Navigation />
        <main id="main" className="flex-1">
          {children}
        </main>
        <Footer />
        <RevealObserver />
      </body>
    </html>
  )
}
