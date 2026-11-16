import './globals.css'
import './shell.css'
import type { Metadata, Viewport } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import MotionProviders from './components/motion/Providers'
import Navigation from './Navigation'
import Footer from './Footer'

const geist = Geist({ subsets: ['latin'], variable: '--font-geist', display: 'swap' })
const geistMono = Geist_Mono({ subsets: ['latin'], variable: '--font-geist-mono', display: 'swap' })

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#ffffff',
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
    <html lang="en" className={`${geist.variable} ${geistMono.variable}`}>
      <body className="flex min-h-screen flex-col font-sans text-ink">
        <a href="#main" className="skip-link">
          Skip to content
        </a>
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
