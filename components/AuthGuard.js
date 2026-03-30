'use client'
import { useState, useEffect } from 'react'

const CLAVE_CORRECTA = 'Admin123!'
const SESSION_KEY = 'dashboard_auth'

export default function AuthGuard({ children }) {
  const [autenticado, setAutenticado] = useState(false)
  const [clave, setClave] = useState('')
  const [error, setError] = useState(false)
  const [montado, setMontado] = useState(false)

  useEffect(() => {
    const ok = sessionStorage.getItem(SESSION_KEY) === '1'
    setAutenticado(ok)
    setMontado(true)
  }, [])

  const handleSubmit = (e) => {
    e.preventDefault()
    if (clave === CLAVE_CORRECTA) {
      sessionStorage.setItem(SESSION_KEY, '1')
      setAutenticado(true)
      setError(false)
    } else {
      setError(true)
      setClave('')
    }
  }

  // Evitar flash: no renderizar nada hasta que se lea sessionStorage
  if (!montado) return null

  if (autenticado) return children

  return (
    <div className="relative min-h-screen">
      {/* Contenido bloqueado con blur */}
      <div className="filter blur-sm pointer-events-none select-none opacity-60 min-h-screen" aria-hidden="true">
        {children}
      </div>

      {/* Overlay */}
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
        <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 w-full max-w-sm mx-4 overflow-hidden">
          {/* Cabecera */}
          <div className="bg-[#1B3A6B] px-6 py-5 text-center">
            <div className="text-white font-bold text-lg tracking-wide">INEI · OTIN</div>
            <div className="text-blue-200 text-xs mt-0.5">Dashboard de Ejecución Presupuestal 2026</div>
          </div>

          {/* Formulario */}
          <form onSubmit={handleSubmit} className="px-6 py-6 space-y-4">
            <div className="text-center">
              <div className="text-3xl mb-2">🔒</div>
              <p className="text-sm font-semibold text-gray-700">Ingrese la clave del dashboard</p>
              <p className="text-xs text-gray-400 mt-1">Acceso restringido al personal autorizado</p>
            </div>

            <div>
              <input
                type="password"
                autoFocus
                value={clave}
                onChange={e => { setClave(e.target.value); setError(false) }}
                placeholder="Contraseña"
                className={`w-full border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 transition-colors ${
                  error
                    ? 'border-red-400 focus:ring-red-300 bg-red-50'
                    : 'border-gray-300 focus:ring-blue-300'
                }`}
              />
              {error && (
                <p className="text-xs text-red-600 mt-1.5 flex items-center gap-1">
                  <span>⚠</span> Clave incorrecta. Intente nuevamente.
                </p>
              )}
            </div>

            <button
              type="submit"
              className="w-full bg-[#1B3A6B] hover:bg-blue-800 text-white font-semibold py-2.5 rounded-lg text-sm transition-colors"
            >
              Ingresar
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
