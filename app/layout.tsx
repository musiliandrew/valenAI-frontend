import type { Metadata } from 'next'
import { Playfair_Display, Outfit } from 'next/font/google'

import './globals.css'

const playfairDisplay = Playfair_Display({ 
  subsets: ['latin'],
  variable: '--font-playfair',
  weight: ['400', '500', '600', '700', '800', '900'],
})

const outfit = Outfit({ 
  subsets: ['latin'],
  variable: '--font-outfit',
  weight: ['300', '400', '500', '600', '700'],
})

export const metadata: Metadata = {
  title: 'ValenAI - AI-Powered Valentine\'s Day Declarations',
  description: 'Create memorable, personalized Valentine\'s Day messages with AI. Say yes or no with interactive style.',
  generator: 'v0.app',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${playfairDisplay.variable} ${outfit.variable}`}>
      <body className="font-outfit antialiased">{children}</body>
    </html>
  )
}
