'use client'
import { useState } from 'react'

const NOMBRES_MES = ['', 'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']

function fmt(num) {
  return Number(num).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export default function MesDrillDown({ mes, data, onCerrar }) {
  const [expandido, setExpandido] = useState(null)
  const [sortCol, setSortCol] = useState(null)
  const [sortDir, setSortDir] = useState('desc')

  const handleSort = (col) => {
    if (sortCol === col) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    } else {
      setSortCol(col)
      setSortDir('desc')
    }
  }

  const SortTh = ({ col, label, align = 'right' }) => (
    <th
      onClick={() => handleSort(col)}
      className={`px-4 py-2 text-xs font-semibold text-gray-500 uppercase cursor-pointer select-none hover:text-gray-800 ${align === 'right' ? 'text-right' : 'text-left'}`}
    >
      {label}{sortCol === col && <span className="ml-1">{sortDir === 'asc' ? '↑' : '↓'}</span>}
    </th>
  )

  if (!data) return null

  const { proyectos, totales } = data

  return (
    <div className="bg-white rounded-lg border border-blue-200 shadow-md p-5 mt-4">
      {/* Cabecera */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-bold text-gray-800">
            Detalle de <span className="text-blue-700">{NOMBRES_MES[mes]}</span>
            <span className="ml-2 text-gray-500 font-normal">— {proyectos.length} proyectos · {totales.locadores} entregables</span>
          </h3>
          <div className="flex gap-4 mt-1 text-xs">
            <span className="text-gray-600">Comprometido: <strong className="text-blue-700">S/ {fmt(totales.monto)}</strong></span>
            <span className="text-gray-600">Girado: <strong className="text-green-700">S/ {fmt(totales.girado)}</strong></span>
            <span className="text-gray-600">Pendientes: <strong className="text-amber-600">{totales.pendientes} entregables</strong></span>
          </div>
        </div>
        <button onClick={onCerrar} className="text-gray-400 hover:text-gray-600 text-lg font-bold px-2">&#x2715;</button>
      </div>

      {/* Tabla de proyectos expandibles */}
      <div className="rounded-lg border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-100 border-b border-gray-200">
            <tr>
              <th className="w-8 px-2" />
              <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase">Meta</th>
              <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase">Proyecto</th>
              <SortTh col="locadores_count" label="Locadores" />
              <SortTh col="total_monto" label="Monto (S/)" />
              <SortTh col="total_girado" label="Girado (S/)" />
              <SortTh col="pct" label="% Avance" />
            </tr>
          </thead>
          <tbody>
            {(sortCol
              ? [...proyectos].sort((a, b) => {
                  const va = sortCol === 'locadores_count' ? a.locadores.length
                    : sortCol === 'pct' ? (a.total_monto > 0 ? a.total_girado / a.total_monto : 0)
                    : Number(a[sortCol])
                  const vb = sortCol === 'locadores_count' ? b.locadores.length
                    : sortCol === 'pct' ? (b.total_monto > 0 ? b.total_girado / b.total_monto : 0)
                    : Number(b[sortCol])
                  return sortDir === 'asc' ? va - vb : vb - va
                })
              : proyectos
            ).map((p, i) => {
              const isOpen = expandido === p.codi_Meta
              const pct = p.total_monto > 0 ? ((p.total_girado / p.total_monto) * 100).toFixed(1) : '0.0'
              return (
                <>
                  <tr
                    key={p.codi_Meta}
                    onClick={() => setExpandido(isOpen ? null : p.codi_Meta)}
                    className={`cursor-pointer hover:bg-blue-50 transition-colors ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50'} ${isOpen ? 'bg-blue-50' : ''}`}
                  >
                    <td className="px-2 py-2 text-center text-gray-400 text-xs">{isOpen ? '▼' : '▶'}</td>
                    <td className="px-4 py-2 font-mono text-xs text-gray-500">{p.codi_Meta}</td>
                    <td className="px-4 py-2 text-xs max-w-xs truncate" title={p.proyecto}>{p.proyecto}</td>
                    <td className="px-4 py-2 text-right">{p.locadores.length}</td>
                    <td className="px-4 py-2 text-right font-mono">{fmt(p.total_monto)}</td>
                    <td className="px-4 py-2 text-right font-mono text-green-700">{fmt(p.total_girado)}</td>
                    <td className="px-4 py-2 text-right">
                      <span className={`font-semibold text-xs ${Number(pct) >= 80 ? 'text-green-600' : Number(pct) > 0 ? 'text-amber-600' : 'text-gray-400'}`}>
                        {pct}%
                      </span>
                    </td>
                  </tr>
                  {isOpen && (
                    <tr key={`${p.codi_Meta}-det`} className="bg-blue-50">
                      <td colSpan={7} className="px-6 py-3">
                        <table className="w-full text-xs border border-blue-200 rounded overflow-hidden">
                          <thead className="bg-blue-100">
                            <tr>
                              <th className="px-3 py-2 text-left font-semibold text-blue-700">Locador</th>
                              <th className="px-3 py-2 text-left font-semibold text-blue-700">RUC</th>
                              <th className="px-3 py-2 text-left font-semibold text-blue-700">Período</th>
                              <th className="px-3 py-2 text-right font-semibold text-blue-700">Monto (S/)</th>
                              <th className="px-3 py-2 text-center font-semibold text-blue-700">Estado</th>
                              <th className="px-3 py-2 text-left font-semibold text-blue-700">Fecha Giro</th>
                            </tr>
                          </thead>
                          <tbody>
                            {p.locadores.map((l, li) => (
                              <tr key={li} className={li % 2 === 0 ? 'bg-white' : 'bg-blue-50'}>
                                <td className="px-3 py-1.5 font-medium">{l.PROVEEDOR}</td>
                                <td className="px-3 py-1.5 font-mono text-gray-500">{l.RUC}</td>
                                <td className="px-3 py-1.5 text-gray-500">{l.fecha_inicio_ar} &ndash; {l.fecha_fin_ar}</td>
                                <td className="px-3 py-1.5 text-right font-mono">{fmt(l.monto)}</td>
                                <td className="px-3 py-1.5 text-center">
                                  {l.FLAG_GIRADO === 1
                                    ? <span className="text-green-700 font-semibold">Girado</span>
                                    : <span className="text-gray-500">Pendiente</span>
                                  }
                                </td>
                                <td className="px-3 py-1.5 text-gray-500">{l.fecha_girado || '—'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </td>
                    </tr>
                  )}
                </>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
