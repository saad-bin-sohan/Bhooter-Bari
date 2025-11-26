import type { Metadata } from 'next'
import { ReactNode } from 'react'
import { Manrope } from 'next/font/google'
import './globals.css'

const manrope = Manrope({ subsets: ['latin'], display: 'swap' })

export const metadata: Metadata = {
  title: 'Bhooter Bari',
  description: 'Anonymous ephemeral E2EE rooms'
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className={`${manrope.className} bg-transparent`}>{children}</body>
    </html>
  )
}
