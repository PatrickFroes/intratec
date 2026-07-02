import type { Metadata, Viewport } from 'next'
import './globals.css'
import { AuthWrapper } from '@/components/AuthWrapper'
import { AppProvider } from '@/components/AppProvider'


export const metadata: Metadata = {
  title: 'Shopping Intranet - Administração',
  description: 'Sistema de administração para shoppings',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Shopping Admin',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: '#0f172a',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR">
      <body>
        <AppProvider>
          <AuthWrapper>
            {children}
          </AuthWrapper>
        </AppProvider>
      </body>
    </html>
  )
}
