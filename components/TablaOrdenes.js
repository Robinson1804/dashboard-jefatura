'use client'
import { useState } from 'react'

function fmt(num) {
  return Number(num).toLocaleString('es-PE', { minimumFractionDigits: 2 })
}

function EstadoBadge({ flagGirado, diasFin }) {
  if (flagGirado === 1) return <span className="bg-green-100 text-green-700 text-xs font-medium px-2 py-0.5 rounded">Girado</span>
  if (diasFin < 0) return <span className="bg-red-100 text-red-700 text-xs font-medium px-2 py-0.5 rounded">Vencido</span>
  if (diasFin <= 30) return <span className="bg-amber-100 text-amber-700 text-xs font-medium px-2 py-0.5 rounded">Vence pronto</span>
  return <span className="bg-gray-100 text-gray-600 text-xs font-medium px-2 py-0.5 rounded">Pendiente</span>
}

export default function TablaOrdenes({ ordenes, entregablesPorOrden }) {
  const [expandido, setExpandido] = useState(null)
  const [busqueda, setBusqueda] = useState('')

  const datos = ordenes.filter(o =>
    o.PROVEEDOR.toLowerCase().includes(busqueda.toLowerCase()) ||
    o.NRO_ORDEN.includes(busqueda) ||
    o.RUC.includes(busqueda)
  )

  const toggle = (nroOrden) => {
    setExpandido(prev => prev === nroOrden ? null : nroOrden)
  }

  return (
    <div>
      <div className="mb-3">
        <input
          type="text"
          placeholder="Buscar por proveedor, orden o RUC..."
          value={busqueda}
          onChange={e => setBusqueda(e.target.value)}
          className="border border-gray-300 rounded px-3 py-2 text-sm w-80 focus:outline-none focus:ring-2 focus:ring-blue-300"
        />
      </div>
      <div className="rounded-lg border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-100 border-b border-gray-200">
            <tr>
              <th className="w-8 px-2" />
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Proveedor</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">RUC</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">N° Orden</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Fin Contrato</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Monto Total (S/)</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Entregables</th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Estado</th>
            </tr>
          </thead>
          <tbody>
            {datos.map((o, i) => {
              const isOpen = expandido === o.NRO_ORDEN
              const entregables = entregablesPorOrden[o.NRO_ORDEN] || []
              return (
                <>
                  <tr
                    key={o.NRO_ORDEN}
                    onClick={() => toggle(o.NRO_ORDEN)}
                    className={`cursor-pointer hover:bg-blue-50 transition-colors ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50'} ${isOpen ? 'bg-blue-50' : ''}`}
                  >
                    <td className="px-2 py-2 text-center text-gray-400 text-xs">{isOpen ? '▼' : '▶'}</td>
                    <td className="px-4 py-2 font-medium text-xs max-w-xs truncate" title={o.PROVEEDOR}>{o.PROVEEDOR}</td>
                    <td className="px-4 py-2 font-mono text-xs text-gray-500">{o.RUC}</td>
                    <td className="px-4 py-2 font-mono text-xs text-gray-500">{o.NRO_ORDEN?.trim()}</td>
                    <td className="px-4 py-2 text-right text-xs">{o.fecha_fin}</td>
                    <td className="px-4 py-2 text-right money">{fmt(o.monto_total)}</td>
                    <td className="px-4 py-2 text-right">
                      <span className="text-green-700">{o.entregables_girados}</span>
                      <span className="text-gray-400"> / {o.num_entregables}</span>
                    </td>
                    <td className="px-4 py-2 text-center">
                      <EstadoBadge flagGirado={o.entregables_girados === o.num_entregables ? 1 : null} diasFin={o.dias_fin} />
                    </td>
                  </tr>
                  {isOpen && (
                    <tr key={`${o.NRO_ORDEN}-detalle`} className="bg-blue-50">
                      <td colSpan={8} className="px-6 py-3">
                        {/* Mini-resumen del locador */}
                        {(() => {
                          const ents = entregablesPorOrden[o.NRO_ORDEN] || []
                          const totalArmado = ents.reduce((a, e) => a + Number(e.monto_armada), 0)
                          const totalGirado = ents.filter(e => e.FLAG_GIRADO === 1).reduce((a, e) => a + Number(e.monto_armada), 0)
                          const proximoPendiente = ents.find(e => e.FLAG_GIRADO !== 1)
                          const pctLocador = totalArmado > 0 ? ((totalGirado / totalArmado) * 100).toFixed(1) : '0.0'
                          return (
                            <div className="flex gap-4 mb-3 text-xs flex-wrap">
                              <div className="bg-blue-50 border border-blue-200 rounded px-3 py-2">
                                <p className="text-gray-500 font-semibold uppercase text-xs">Total Armado</p>
                                <p className="text-blue-700 font-bold">S/ {fmt(totalArmado)}</p>
                              </div>
                              <div className="bg-green-50 border border-green-200 rounded px-3 py-2">
                                <p className="text-gray-500 font-semibold uppercase text-xs">Total Girado</p>
                                <p className="text-green-700 font-bold">S/ {fmt(totalGirado)}</p>
                              </div>
                              <div className="bg-amber-50 border border-amber-200 rounded px-3 py-2">
                                <p className="text-gray-500 font-semibold uppercase text-xs">Pendiente</p>
                                <p className="text-amber-700 font-bold">S/ {fmt(totalArmado - totalGirado)}</p>
                              </div>
                              <div className="bg-gray-50 border border-gray-200 rounded px-3 py-2">
                                <p className="text-gray-500 font-semibold uppercase text-xs">Avance</p>
                                <p className="font-bold" style={{color: Number(pctLocador)>=80?'#16A34A':Number(pctLocador)>0?'#D97706':'#6B7280'}}>{pctLocador}%</p>
                              </div>
                              {proximoPendiente && (
                                <div className="bg-gray-50 border border-gray-200 rounded px-3 py-2">
                                  <p className="text-gray-500 font-semibold uppercase text-xs">Próximo pago</p>
                                  <p className="text-gray-700 font-bold">{proximoPendiente.fecha_inicio_ar} · S/ {fmt(proximoPendiente.monto_armada)}</p>
                                </div>
                              )}
                            </div>
                          )
                        })()}
                        <table className="w-full text-xs border border-blue-200 rounded overflow-hidden">
                          <thead className="bg-blue-100">
                            <tr>
                              <th className="px-3 py-2 text-left font-semibold text-blue-700">Entregable</th>
                              <th className="px-3 py-2 text-left font-semibold text-blue-700">Período</th>
                              <th className="px-3 py-2 text-right font-semibold text-blue-700">Monto (S/)</th>
                              <th className="px-3 py-2 text-center font-semibold text-blue-700">Estado</th>
                              <th className="px-3 py-2 text-left font-semibold text-blue-700">Fecha Giro</th>
                            </tr>
                          </thead>
                          <tbody>
                            {entregables.map((e, ei) => (
                              <tr key={ei} className={ei % 2 === 0 ? 'bg-white' : 'bg-blue-50'}>
                                <td className="px-3 py-1.5 font-mono">#{e.N_ENTREGABLE}</td>
                                <td className="px-3 py-1.5">{e.fecha_inicio_ar} – {e.fecha_fin_ar}</td>
                                <td className="px-3 py-1.5 text-right money">{fmt(e.monto_armada)}</td>
                                <td className="px-3 py-1.5 text-center">
                                  {e.FLAG_GIRADO === 1
                                    ? <span className="text-green-700 font-semibold">Girado</span>
                                    : <span className="text-gray-500">Pendiente</span>
                                  }
                                </td>
                                <td className="px-3 py-1.5 text-gray-500">{e.fecha_girado || '—'}</td>
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
      <p className="text-xs text-gray-400 mt-2">{datos.length} órdenes</p>
    </div>
  )
}
