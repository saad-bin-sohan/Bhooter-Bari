import type { Metadata } from 'next'
import { ReactNode } from 'react'
import { DM_Sans, JetBrains_Mono, Syne } from 'next/font/google'
import './globals.css'
import { ThemeProvider } from '../components/ui/ThemeProvider'
import { Toaster } from '../components/ui/Toast'
import { resolveAdminRoutePrefix } from '../lib/adminRoute'

const display = Syne({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  display: 'swap',
  variable: '--font-display'
})

const sans = DM_Sans({
  subsets: ['latin'],
  style: ['normal', 'italic'],
  display: 'swap',
  variable: '--font-sans'
})

const mono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  display: 'swap',
  variable: '--font-mono'
})

export const metadata: Metadata = {
  title: 'Bhooter Bari',
  description: 'Anonymous, invite-only, end-to-end encrypted rooms.'
}

resolveAdminRoutePrefix()

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${sans.variable} ${mono.variable} dark`} suppressHydrationWarning>
      <body className="min-h-screen bg-transparent text-foreground antialiased">
        <ThemeProvider>
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  )
}
