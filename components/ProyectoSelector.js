'use client'
import { useState, useRef, useEffect } from 'react'

// Valor especial que identifica el grupo de ODEIs en el selector
export const GRUPO_ODEIS = '__ESTADISTICAS_DEPARTAMENTALES__'

function esOdei(proyecto) {
  return /estadisticas\s+departamental/i.test(proyecto)
}

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

  // Separar proyectos normales de ODEIs
  const normales = proyectos.filter(p => !esOdei(p.PROYECTO))
  const tieneOdeis = proyectos.some(p => esOdei(p.PROYECTO))

  // Ordenar alfabéticamente
  const ordenados = [...normales].sort((a, b) => a.PROYECTO.localeCompare(b.PROYECTO, 'es'))

  // Entrada virtual para el grupo de ODEIs
  const grupoOdei = tieneOdeis ? { PROYECTO: 'ESTADÍSTICAS DEPARTAMENTALES', codi_Meta: 'ODEIs', _grupo: true } : null

  // Construir lista final: ODEIs primero (si coincide con búsqueda), luego normales
  const busqLower = busqueda.trim().toLowerCase()
  const listaBase = grupoOdei
    ? [grupoOdei, ...ordenados]
    : ordenados

  const filtrados = busqLower
    ? listaBase.filter(p =>
        p.PROYECTO.toLowerCase().includes(busqLower) ||
        p.codi_Meta.toLowerCase().includes(busqLower)
      )
    : listaBase

  // Etiqueta del botón
  const etiqueta = valor === GRUPO_ODEIS
    ? 'ODEIs · ESTADÍSTICAS DEPARTAMENTALES'
    : valor
      ? `${proyectos.find(p => p.PROYECTO === valor)?.codi_Meta ?? ''} · ${valor.slice(0, 45)}${valor.length > 45 ? '...' : ''}`
      : 'Todos los proyectos'

  const seleccionar = (p) => {
    onChange(p._grupo ? GRUPO_ODEIS : p.PROYECTO)
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
            onClick={() => { onChange(''); setAbierto(false); setBusqueda('') }}
            className={`px-3 py-2 text-sm cursor-pointer hover:bg-blue-50 border-b border-gray-100 ${!valor ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-gray-600'}`}
          >
            Todos los proyectos
          </div>

          {/* Lista */}
          <div className="max-h-72 overflow-y-auto">
            {filtrados.length === 0 && (
              <p className="px-3 py-4 text-sm text-gray-400 text-center">Sin resultados</p>
            )}
            {filtrados.map((p, i) => {
              const isGrupo = !!p._grupo
              const isSelected = isGrupo ? valor === GRUPO_ODEIS : valor === p.PROYECTO
              return (
                <div
                  key={isGrupo ? '__odeis__' : p.codi_Meta}
                  onClick={() => seleccionar(p)}
                  className={`px-3 py-2 text-sm cursor-pointer hover:bg-blue-50 flex items-start gap-2 ${
                    isSelected ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                  } ${isGrupo ? 'border-b border-indigo-100 bg-indigo-50 font-semibold' : ''}`}
                >
                  <span className={`font-mono text-xs shrink-0 mt-0.5 w-10 ${isGrupo ? 'text-indigo-400' : 'text-gray-400'}`}>
                    {isGrupo ? '📍' : p.codi_Meta}
                  </span>
                  <span className="leading-tight">
                    {isGrupo ? (
                      <span>
                        <span className="text-indigo-700">ESTADÍSTICAS DEPARTAMENTALES</span>
                        <span className="text-xs text-indigo-400 ml-1 font-normal">(26 ODEIs)</span>
                      </span>
                    ) : p.PROYECTO}
                  </span>
                </div>
              )
            })}
          </div>

          {/* Contador */}
          <div className="px-3 py-1.5 border-t border-gray-100 text-xs text-gray-400">
            {filtrados.length} de {normales.length + (tieneOdeis ? 1 : 0)} proyectos
          </div>
        </div>
      )}
    </div>
  )
}
