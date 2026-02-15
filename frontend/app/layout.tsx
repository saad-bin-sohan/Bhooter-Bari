import type { Metadata } from 'next'
import { ReactNode } from 'react'
import { Space_Grotesk, Plus_Jakarta_Sans } from 'next/font/google'
import './globals.css'
import { ThemeProvider } from '../components/ui/ThemeProvider'
import { Toaster } from '../components/ui/Toast'
import { resolveAdminRoutePrefix } from '../lib/adminRoute'

const display = Space_Grotesk({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-display'
})

const sans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-sans'
})

export const metadata: Metadata = {
  title: 'Bhooter Bari',
  description: 'Anonymous, ephemeral, end-to-end encrypted rooms.'
}

resolveAdminRoutePrefix()

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${sans.variable} dark`} suppressHydrationWarning>
      <body className="min-h-screen bg-transparent text-foreground antialiased">
        <ThemeProvider>
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  )
}
