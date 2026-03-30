'use client'
import { useState, useRef, useEffect } from 'react'

export default function ProyectoSelector({ proyectos, valor, onChange }) {
  const [abierto, setAbierto] = useState(false)
  const [busqueda, setBusqueda] = useState('')
  const ref = useRef(null)

  // Cerrar al hacer click fuera
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setAbierto(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // Ordenar alfabéticamente por nombre de proyecto
  const ordenados = [...proyectos].sort((a, b) => a.PROYECTO.localeCompare(b.PROYECTO, 'es'))

  // Filtrar por búsqueda (nombre o código)
  const filtrados = busqueda.trim()
    ? ordenados.filter(p =>
        p.PROYECTO.toLowerCase().includes(busqueda.toLowerCase()) ||
        p.codi_Meta.includes(busqueda)
      )
    : ordenados

  const etiqueta = valor
    ? `${proyectos.find(p => p.PROYECTO === valor)?.codi_Meta ?? ''} · ${valor.slice(0, 45)}${valor.length > 45 ? '...' : ''}`
    : 'Todos los proyectos'

  const seleccionar = (proyecto) => {
    onChange(proyecto)
    setAbierto(false)
    setBusqueda('')
  }

  return (
    <div ref={ref} className="relative min-w-72">
      {/* Botón disparador */}
      <button
        onClick={() => setAbierto(v => !v)}
        className="w-full flex items-center justify-between gap-2 border border-gray-300 rounded px-3 py-2 text-sm bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-300 text-left"
      >
        <span className={valor ? 'text-gray-800' : 'text-gray-400'}>{etiqueta}</span>
        <span className="text-gray-400 shrink-0">{abierto ? '▲' : '▼'}</span>
      </button>

      {/* Panel desplegable */}
      {abierto && (
        <div className="absolute right-0 mt-1 w-96 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
          {/* Buscador */}
          <div className="p-2 border-b border-gray-100">
            <input
              autoFocus
              type="text"
              placeholder="Buscar por nombre o código..."
              value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
            />
          </div>

          {/* Opción "Todos" */}
          <div
            onClick={() => seleccionar('')}
            className={`px-3 py-2 text-sm cursor-pointer hover:bg-blue-50 border-b border-gray-100 ${!valor ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-gray-600'}`}
          >
            Todos los proyectos
          </div>

          {/* Lista */}
          <div className="max-h-72 overflow-y-auto">
            {filtrados.length === 0 && (
              <p className="px-3 py-4 text-sm text-gray-400 text-center">Sin resultados</p>
            )}
            {filtrados.map(p => (
              <div
                key={p.codi_Meta}
                onClick={() => seleccionar(p.PROYECTO)}
                className={`px-3 py-2 text-sm cursor-pointer hover:bg-blue-50 flex items-start gap-2 ${valor === p.PROYECTO ? 'bg-blue-50 text-blue-700' : 'text-gray-700'}`}
              >
                <span className="font-mono text-xs text-gray-400 shrink-0 mt-0.5 w-10">{p.codi_Meta}</span>
                <span className="leading-tight">{p.PROYECTO}</span>
              </div>
            ))}
          </div>

          {/* Contador */}
          <div className="px-3 py-1.5 border-t border-gray-100 text-xs text-gray-400">
            {filtrados.length} de {proyectos.length} proyectos
          </div>
        </div>
      )}
    </div>
  )
}
