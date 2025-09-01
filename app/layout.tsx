import './globals.css'
import { AuthProvider } from './contexts/AuthContext'

export const metadata = {
  title: 'kabu-ana',
  description: 'AI×投資情報の新しい形',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ja">
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}