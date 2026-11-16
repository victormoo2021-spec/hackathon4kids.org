import './globals.css'
import './shell.css'
import type { Metadata, Viewport } from 'next'
import MotionProviders from './components/motion/Providers'
import Navigation from './Navigation'
import Footer from './Footer'
import StreakField from './components/fx/StreakField'
import Fluid from './components/fx/Fluid'

// Fonts: system SF stack (see globals.css), so no web font download.
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#0a0710',
  colorScheme: 'dark',
}

export const metadata: Metadata = {
  metadataBase: new URL('https://hackathon4kids.org'),
  title: {
    default: 'Hackathon4Kids · Free coding classes for grades 3-8',
    template: '%s · Hackathon4Kids',
  },
  description:
    'Free coding and STEM classes for kids in grades 3-8 in the Bay Area, face-to-face and virtual, taught by high-school students. Join the mailing list to hear about the next program.',
  openGraph: {
    title: 'Hackathon4Kids · Free coding classes for grades 3-8',
    description: 'Free coding and STEM classes for kids in grades 3-8 in the Bay Area, taught by high-school students.',
    url: '/',
    siteName: 'Hackathon4Kids',
    type: 'website',
  },
  twitter: { card: 'summary_large_image', title: 'Hackathon4Kids · Free coding classes for grades 3-8' },
  alternates: { canonical: '/' },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="flex min-h-screen flex-col font-sans text-text">
        <a href="#main" className="skip-link">
          Skip to content
        </a>
        <StreakField />
        <Fluid />
        <MotionProviders>
          <Navigation />
          <main id="main" className="flex-1">
            {children}
          </main>
          <Footer />
        </MotionProviders>
      </body>
    </html>
  )
}
