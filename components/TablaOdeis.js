'use client'
import { useState, Fragment } from 'react'
import TablaOrdenes from './TablaOrdenes'

function fmt(num) {
  return Number(num).toLocaleString('es-PE', { minimumFractionDigits: 2 })
}

function BarraAvance({ pct }) {
  const color = pct >= 80 ? '#16A34A' : pct > 0 ? '#D97706' : '#9CA3AF'
  return (
    <div className="flex items-center gap-2">
      <div className="w-20 h-1.5 bg-gray-200 rounded-full overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${Math.min(pct, 100)}%`, backgroundColor: color }} />
      </div>
      <span className="text-xs font-semibold" style={{ color }}>{pct.toFixed(1)}%</span>
    </div>
  )
}

export default function TablaOdeis({ odeis }) {
  const [odeiExpandida, setOdeiExpandida] = useState(null)
  const [busqueda, setBusqueda] = useState('')

  const toggle = (proyecto) => {
    setOdeiExpandida(prev => prev === proyecto ? null : proyecto)
  }

  const filtrados = odeis.filter(o =>
    o.proyecto.toLowerCase().includes(busqueda.toLowerCase()) ||
    o.codi_meta.includes(busqueda)
  )

  const totalMonto  = odeis.reduce((a, o) => a + o.monto_total,  0)
  const totalGirado = odeis.reduce((a, o) => a + o.monto_girado, 0)
  const totalOrdenes = odeis.reduce((a, o) => a + o.num_ordenes, 0)

  return (
    <div>
      {/* Resumen global de ODEIs */}
      <div className="flex gap-3 mb-4 flex-wrap text-xs">
        <div className="bg-blue-50 border border-blue-200 rounded px-3 py-2">
          <p className="text-gray-500 font-semibold uppercase">ODEIs</p>
          <p className="text-blue-700 font-bold text-base">{odeis.length}</p>
        </div>
        <div className="bg-gray-50 border border-gray-200 rounded px-3 py-2">
          <p className="text-gray-500 font-semibold uppercase">Órdenes</p>
          <p className="text-gray-700 font-bold text-base">{totalOrdenes}</p>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded px-3 py-2">
          <p className="text-gray-500 font-semibold uppercase">Monto Total (S/)</p>
          <p className="text-blue-700 font-bold">{fmt(totalMonto)}</p>
        </div>
        <div className="bg-green-50 border border-green-200 rounded px-3 py-2">
          <p className="text-gray-500 font-semibold uppercase">Total Girado (S/)</p>
          <p className="text-green-700 font-bold">{fmt(totalGirado)}</p>
        </div>
        <div className="bg-amber-50 border border-amber-200 rounded px-3 py-2">
          <p className="text-gray-500 font-semibold uppercase">Pendiente (S/)</p>
          <p className="text-amber-700 font-bold">{fmt(totalMonto - totalGirado)}</p>
        </div>
      </div>

      {/* Buscador */}
      <div className="mb-3">
        <input
          type="text"
          placeholder="Buscar ODEI por nombre o código..."
          value={busqueda}
          onChange={e => setBusqueda(e.target.value)}
          className="border border-gray-300 rounded px-3 py-2 text-sm w-80 focus:outline-none focus:ring-2 focus:ring-blue-300"
        />
      </div>

      {/* Tabla de ODEIs */}
      <div className="rounded-lg border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-100 border-b border-gray-200">
            <tr>
              <th className="w-8 px-2" />
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">ODEI</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Código</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Órdenes</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Monto Total (S/)</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Girado (S/)</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Avance</th>
            </tr>
          </thead>
          <tbody>
            {filtrados.map((odei, i) => {
              const isOpen = odeiExpandida === odei.proyecto
              const pct = odei.monto_total > 0
                ? (odei.monto_girado / odei.monto_total) * 100
                : 0
              // Extraer el nombre del departamento del proyecto (quitar prefijo)
              const nombreDept = odei.proyecto
                .replace(/^ESTADISTICAS DEPARTAMENTALES?\s*[-–]?\s*/i, '')
                .trim() || odei.proyecto

              return (
                <Fragment key={odei.proyecto}>
                  <tr
                    onClick={() => toggle(odei.proyecto)}
                    className={`cursor-pointer hover:bg-indigo-50 transition-colors border-b border-gray-100
                      ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}
                      ${isOpen ? 'bg-indigo-50 border-l-4 border-l-indigo-400' : ''}`}
                  >
                    <td className="px-2 py-2.5 text-center text-gray-400 text-xs">{isOpen ? '▼' : '▶'}</td>
                    <td className="px-4 py-2.5 font-semibold text-sm text-gray-800">
                      {nombreDept}
                    </td>
                    <td className="px-4 py-2.5 font-mono text-xs text-gray-400">{odei.codi_meta}</td>
                    <td className="px-4 py-2.5 text-right text-xs font-medium text-gray-600">{odei.num_ordenes}</td>
                    <td className="px-4 py-2.5 text-right money text-xs">{fmt(odei.monto_total)}</td>
                    <td className="px-4 py-2.5 text-right money text-xs text-green-700">{fmt(odei.monto_girado)}</td>
                    <td className="px-4 py-2.5">
                      <BarraAvance pct={pct} />
                    </td>
                  </tr>

                  {isOpen && (
                    <tr>
                      <td colSpan={7} className="bg-indigo-50 px-6 py-4 border-b border-indigo-200">
                        <div className="mb-2 text-xs text-indigo-700 font-semibold uppercase tracking-wide">
                          Locadores — {nombreDept}
                        </div>
                        <TablaOrdenes
                          ordenes={odei.ordenes}
                          entregablesPorOrden={odei.entregables_por_orden}
                        />
                      </td>
                    </tr>
                  )}
                </Fragment>
              )
            })}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-gray-400 mt-2">{filtrados.length} ODEIs</p>
    </div>
  )
}
