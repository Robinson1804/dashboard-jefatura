import { Inter } from 'next/font/google'
import './globals.css'
import Navbar from '@/components/Navbar'
import AuthGuard from '@/components/AuthGuard'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'Dashboard Gerencial — INEI OTIN 2026',
  description: 'Monitoreo de ejecución presupuestal de locadores',
}

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body className={inter.className}>
        <AuthGuard>
          <Navbar />
          <main className="max-w-screen-xl mx-auto px-6 py-6">
            {children}
          </main>
          <footer className="text-center text-xs text-gray-400 py-4 mt-8 border-t border-gray-200">
            INEI — Oficina Técnica de Informática · Solo lectura · {new Date().getFullYear()}
          </footer>
        </AuthGuard>
      </body>
    </html>
  )
}
