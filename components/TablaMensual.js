'use client'
import { useState } from 'react'

function fmt(num) {
  return Number(num).toLocaleString('es-PE', { minimumFractionDigits: 2 })
}

const COLS = [
  { key: 'mes', label: 'Mes', align: 'left' },
  { key: 'total_entregables', label: 'Entregables', align: 'right' },
  { key: 'monto_armado', label: 'Compromiso Mensual (S/)', align: 'right' },
  { key: 'entregables_girados', label: 'Girados', align: 'right' },
  { key: 'monto_girado', label: 'Monto Girado (S/)', align: 'right' },
  { key: 'entregables_pendientes', label: 'Pendientes', align: 'right' },
  { key: 'pct_avance', label: '% Avance', align: 'right' },
]

export default function TablaMensual({ meses, onMesClick, mesSeleccionado }) {
  const MES_ACTUAL = new Date().getMonth() + 1
  const [sortCol, setSortCol] = useState(null)
  const [sortDir, setSortDir] = useState('asc')

  const handleSort = (key) => {
    if (key === 'mes') return // mes ya tiene orden natural
    if (sortCol === key) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    } else {
      setSortCol(key)
      setSortDir('desc')
    }
  }

  const sorted = sortCol
    ? [...meses].sort((a, b) => {
        const va = Number(a[sortCol])
        const vb = Number(b[sortCol])
        return sortDir === 'asc' ? va - vb : vb - va
      })
    : meses

  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200">
      <table className="w-full text-sm">
        <thead className="bg-gray-100 border-b border-gray-200">
          <tr>
            {COLS.map(col => (
              <th
                key={col.key}
                onClick={() => handleSort(col.key)}
                className={`px-4 py-3 text-xs font-semibold text-gray-500 uppercase ${col.align === 'right' ? 'text-right' : 'text-left'} ${col.key !== 'mes' ? 'cursor-pointer select-none hover:text-gray-800' : ''}`}
              >
                {col.label}
                {sortCol === col.key && (
                  <span className="ml-1">{sortDir === 'asc' ? '↑' : '↓'}</span>
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sorted.map((m, i) => {
            const esPasado = m.mes < MES_ACTUAL
            const esActual = m.mes === MES_ACTUAL
            const esSeleccionado = m.mes === mesSeleccionado
            return (
              <tr
                key={m.mes}
                onClick={() => onMesClick && onMesClick(m.mes)}
                className={`cursor-pointer hover:bg-blue-50 transition-colors ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50'} ${esActual ? 'ring-1 ring-amber-400 ring-inset' : ''} ${esSeleccionado ? 'ring-2 ring-blue-400 ring-inset bg-blue-50' : ''}`}
              >
                <td className="px-4 py-2 font-medium">
                  {m.nombre_mes}
                  {esActual && <span className="ml-2 text-xs bg-amber-100 text-amber-700 px-1 rounded">actual</span>}
                  {esSeleccionado && <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-1 rounded">seleccionado</span>}
                </td>
                <td className="px-4 py-2 text-right">{m.total_entregables}</td>
                <td className="px-4 py-2 text-right money">{fmt(m.monto_armado)}</td>
                <td className="px-4 py-2 text-right text-green-700">{m.entregables_girados}</td>
                <td className="px-4 py-2 text-right money text-green-700">{fmt(m.monto_girado)}</td>
                <td className="px-4 py-2 text-right text-gray-500">{m.entregables_pendientes}</td>
                <td className="px-4 py-2 text-right">
                  <span className={`font-semibold ${
                    esPasado && Number(m.pct_avance) < 80 ? 'text-red-600' :
                    Number(m.pct_avance) >= 80 ? 'text-green-600' :
                    'text-amber-600'
                  }`}>
                    {m.pct_avance}%
                  </span>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
