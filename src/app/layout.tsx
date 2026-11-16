import './globals.css'
import type { Metadata, Viewport } from 'next'
import { Bricolage_Grotesque, Atkinson_Hyperlegible } from 'next/font/google'
import Navigation from './Navigation'
import Footer from './Footer'

const display = Bricolage_Grotesque({ subsets: ['latin'], variable: '--font-bricolage', display: 'swap' })
const body = Atkinson_Hyperlegible({ subsets: ['latin'], weight: ['400', '700'], variable: '--font-atkinson', display: 'swap' })

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
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable}`}>
      <body className="flex min-h-screen flex-col font-sans text-ink">
        <a href="#main" className="skip-link">
          Skip to content
        </a>
        <Navigation />
        <main id="main" className="flex-1">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  )
}
