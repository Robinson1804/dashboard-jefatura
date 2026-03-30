'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const links = [
  { href: '/', label: 'Resumen' },
  { href: '/mensual', label: 'Ejecución Mensual' },
  { href: '/mensual-detalle', label: 'Detalle Mensual' },
  { href: '/detalle', label: 'Detalle por Proyecto' },
]

export default function Navbar() {
  const pathname = usePathname()

  return (
    <header className="bg-[#1B3A6B] text-white shadow-md">
      <div className="max-w-screen-xl mx-auto px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="font-bold text-lg tracking-wide">INEI · OTIN</div>
          <span className="text-blue-300 text-sm hidden sm:block">Dashboard de Ejecución Presupuestal 2026</span>
        </div>
        <nav className="flex gap-1">
          {links.map(link => (
            <Link
              key={link.href}
              href={link.href}
              className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
                pathname === link.href
                  ? 'bg-blue-500 text-white'
                  : 'text-blue-200 hover:bg-blue-800 hover:text-white'
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  )
}
