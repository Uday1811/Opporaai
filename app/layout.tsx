import type { Metadata, Viewport } from 'next'
import { Inter, Space_Grotesk } from 'next/font/google'

import './globals.css'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })
const spaceGrotesk = Space_Grotesk({ subsets: ['latin'], variable: '--font-space-grotesk' })

export const metadata: Metadata = {
  title: 'Oppora.ai - AI Sales Agents Built for Solopreneurs',
  description: 'Think, Type and Reach Out. AI-powered sales automation platform. Find leads, send emails, reply from your inbox and sync meetings to your CRM automatically.',
  keywords: ['AI sales', 'sales automation', 'lead generation', 'cold email', 'outbound sales'],
  robots: {
    index: false,
    follow: false,
  },
}

export const viewport: Viewport = {
  themeColor: '#0A0E1A',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${spaceGrotesk.variable}`}>
      <body className="font-sans antialiased">{children}</body>
    </html>
  )
}
