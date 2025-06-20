import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Toaster } from 'react-hot-toast'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: "AI Excel Formula Generator | Convert English to Excel Formulas",
  description: "Instantly convert your plain English instructions into powerful Excel and Google Sheets formulas with AI. Save time and reduce errors. Get started for free!",
  metadataBase: new URL('https://excel-formula-generator-sigma.vercel.app'),
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Toaster />
        {children}
      </body>
    </html>
  )
} 