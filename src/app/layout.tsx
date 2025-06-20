import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Toaster } from '@/components/ui/toaster'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: "AI Excel Formula Generator | Convert English to Excel Formulas",
  description: "Instantly convert your plain English instructions into powerful Excel and Google Sheets formulas with AI. Save time and reduce errors. Get started for free!",
  metadataBase: new URL('https://excel-formula-generator-sigma.vercel.app'),
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <Toaster />
        <div className="relative flex min-h-screen flex-col">
          {children}
        </div>
      </body>
    </html>
  )
} 