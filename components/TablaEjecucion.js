'use client'
import { useState, useEffect, Fragment } from 'react'

const MESES = ['', 'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
               'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']

function fmt(n) {
  if (n == null) return '—'
  if (n >= 1_000_000) return `S/ ${(n / 1_000_000).toFixed(2)}M`
  if (n >= 1_000)     return `S/ ${(n / 1_000).toFixed(1)}K`
  return `S/ ${Number(n).toFixed(0)}`
}

function fmtFull(n) {
  if (n == null) return '—'
  return `S/ ${Number(n).toLocaleString('es-PE', { minimumFractionDigits: 2 })}`
}

function badgeAvance(pct) {
  if (pct >= 50) return 'bg-green-100 text-green-800'
  if (pct >= 20) return 'bg-amber-100 text-amber-800'
  return 'bg-red-100 text-red-700'
}

function FilasLocadores({ mes, proyecto }) {
  const [data, setData]   = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    const url = `/api/mensual/detalle?mes=${mes}&proyecto=${encodeURIComponent(proyecto)}`
    fetch(url)
      .then(r => r.json())
      .then(d => {
        const locadores = d.proyectos
          ? d.proyectos.flatMap(p => p.locadores || [])
          : (d.locadores || d)
        setData(locadores)
      })
      .catch(e => setError(e.message))
  }, [mes, proyecto])

  if (error) return (
    <tr>
      <td colSpan={9} className="text-center text-red-500 text-sm py-3 bg-red-50">
        Error: {error}
      </td>
    </tr>
  )
  if (!data) return (
    <tr>
      <td colSpan={9} className="text-center text-gray-400 text-sm py-3 bg-blue-50">
        Cargando locadores de {MESES[mes]}...
      </td>
    </tr>
  )

  const lista = Array.isArray(data) ? data : []
  if (lista.length === 0) return (
    <tr>
      <td colSpan={9} className="text-center text-gray-400 text-sm py-3 bg-blue-50">
        Sin entregables en {MESES[mes]}
      </td>
    </tr>
  )

  return lista.map((loc, i) => (
    <tr key={i} className={`border-b border-blue-100 text-sm ${i % 2 === 0 ? 'bg-slate-50' : 'bg-blue-50/40'}`}>
      <td className="px-4 py-2 pl-12 text-gray-800 font-medium">{loc.proveedor}</td>
      <td className="px-4 py-2 text-gray-500 text-xs">RUC {loc.ruc}</td>
      <td className="px-4 py-2 text-center text-gray-400 text-xs">—</td>
      <td className="px-4 py-2 text-right font-mono text-gray-700">{fmtFull(loc.monto)}</td>
      <td className="px-4 py-2 text-right font-mono font-semibold text-blue-700">{fmtFull(loc.monto)}</td>
      <td className="px-4 py-2 text-center text-gray-300">—</td>
      <td className="px-4 py-2 text-right font-mono text-green-700">
        {loc.flag_girado === 1 ? fmtFull(loc.monto) : <span className="text-gray-300">—</span>}
      </td>
      <td className="px-4 py-2 text-center">
        {loc.flag_girado === 1
          ? <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded text-xs font-semibold">Girado</span>
          : <span className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded text-xs font-semibold">Pendiente</span>
        }
      </td>
      <td className="px-4 py-2 text-center text-gray-400 text-xs">
        {loc.fecha_inicio_ar || '—'}
      </td>
    </tr>
  ))
}

export default function TablaEjecucion({ metas, totales, mes }) {
  const [expandido, setExpandido] = useState(null)

  const toggle = (idx) => setExpandido(expandido === idx ? null : idx)

  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200">
      <table className="w-full border-collapse text-sm">
        <thead>
          {/* Fila 1 de cabecera */}
          <tr className="bg-[#1B3A6B] text-white text-xs">
            <th className="px-4 py-3 text-left font-semibold min-w-[280px]" rowSpan={2}>Meta / Proyecto</th>
            <th className="px-3 py-3 text-right font-semibold whitespace-nowrap" rowSpan={2}>PIA</th>
            <th className="px-3 py-3 text-right font-semibold whitespace-nowrap" rowSpan={2}>PIM</th>
            <th className="px-3 py-3 text-right font-semibold whitespace-nowrap" rowSpan={2}>Certificación</th>
            <th className="px-3 py-3 text-right font-semibold whitespace-nowrap" rowSpan={2}>
              Compromiso<br/>Anual
            </th>
            <th className="px-3 py-3 text-right font-semibold whitespace-nowrap bg-[#2D4F8A]" rowSpan={2}>
              ACM<br/>{MESES[mes]}
            </th>
            <th className="px-3 py-2 text-center font-semibold bg-[#0F3D6B]" colSpan={3}>
              Ejecución — {MESES[mes]}
            </th>
          </tr>
          {/* Fila 2 de cabecera */}
          <tr className="bg-[#1B3A6B] text-white text-xs">
            <th className="px-3 py-2 text-right font-semibold bg-[#0F3D6B] whitespace-nowrap">Devengado</th>
            <th className="px-3 py-2 text-right font-semibold bg-[#0F3D6B] whitespace-nowrap">Girado del Mes</th>
            <th className="px-3 py-2 text-right font-semibold bg-[#0F3D6B] whitespace-nowrap">Avance ACM %</th>
          </tr>
        </thead>
        <tbody>
          {metas.map((m, i) => {
            // Avance = girado del mes / ACM del mes (no sobre compromiso anual)
            const avancePct = m.acm > 0 ? (m.girado / m.acm) * 100 : 0
            const isOpen    = expandido === i

            return (
              <Fragment key={i}>
                <tr
                  className={`border-b border-gray-100 cursor-pointer transition-colors ${
                    isOpen ? 'bg-blue-50' : 'hover:bg-gray-50'
                  }`}
                  onClick={() => toggle(i)}
                >
                  {/* Meta / Proyecto */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="text-gray-400 text-xs w-3 shrink-0 select-none">
                        {isOpen ? '▼' : '▶'}
                      </span>
                      <div>
                        <div className="font-semibold text-gray-800 text-sm leading-tight">{m.proyecto}</div>
                        {m.codi_meta && (
                          <div className="text-xs text-gray-400 mt-0.5">Meta {m.codi_meta}</div>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* PIA */}
                  <td className="px-3 py-3 text-right font-mono text-sm text-gray-500">
                    {m.pia != null ? fmt(m.pia) : <span className="text-gray-300">—</span>}
                  </td>

                  {/* PIM */}
                  <td className="px-3 py-3 text-right font-mono text-sm text-gray-500">
                    {m.pim != null ? fmt(m.pim) : <span className="text-gray-300">—</span>}
                  </td>

                  {/* Certificación */}
                  <td className="px-3 py-3 text-right font-mono text-sm text-indigo-700">
                    {fmt(m.certificacion)}
                  </td>

                  {/* Compromiso Anual */}
                  <td className="px-3 py-3 text-right font-mono text-sm text-blue-700">
                    {fmt(m.certificacion)}
                    <div className="text-xs text-blue-400 mt-0.5">{m.total_entregables} entregables</div>
                  </td>

                  {/* ACM del mes */}
                  <td className="px-3 py-3 text-right font-mono text-sm text-purple-700 bg-purple-50/30">
                    {m.acm > 0 ? fmt(m.acm) : <span className="text-gray-300">—</span>}
                    {m.entregables_acm > 0 && (
                      <div className="text-xs text-purple-500 mt-0.5">
                        {m.entregables_girados} girados / {m.entregables_acm} total
                      </div>
                    )}
                  </td>

                  {/* Devengado */}
                  <td className="px-3 py-3 text-right font-mono text-sm text-teal-700">
                    {m.devengado > 0 ? fmt(m.devengado) : <span className="text-gray-300">—</span>}
                    {m.entregables_devengados > 0 && (
                      <div className="text-xs text-teal-400 mt-0.5">{m.entregables_devengados} en tesorería</div>
                    )}
                  </td>

                  {/* Girado del mes */}
                  <td className="px-3 py-3 text-right font-mono text-sm text-green-700">
                    {m.girado > 0 ? fmt(m.girado) : <span className="text-gray-300">—</span>}
                    {m.entregables_pendientes > 0 && (
                      <div className="text-xs text-amber-500 mt-0.5">{m.entregables_pendientes} pendientes</div>
                    )}
                  </td>

                  {/* Avance ACM % */}
                  <td className="px-3 py-3 text-right">
                    {m.acm > 0 ? (
                      <div>
                        <span className={`inline-block px-2.5 py-1 rounded text-sm font-bold ${badgeAvance(avancePct)}`}>
                          {avancePct.toFixed(1)}%
                        </span>
                        {m.girado_anual > 0 && m.certificacion > 0 && (
                          <div className="text-xs text-gray-400 mt-1">
                            Anual: {((m.girado_anual / m.certificacion) * 100).toFixed(1)}%
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className="text-gray-300 text-sm">—</span>
                    )}
                  </td>
                </tr>

                {isOpen && (
                  <FilasLocadores mes={mes} proyecto={m.proyecto} />
                )}
              </Fragment>
            )
          })}

          {/* Fila de totales */}
          <tr className="bg-gray-100 border-t-2 border-gray-300 font-semibold text-sm">
            <td className="px-4 py-3 text-gray-700">TOTAL — {MESES[mes]}</td>
            <td className="px-3 py-3" colSpan={2}></td>
            <td className="px-3 py-3 text-right font-mono text-indigo-800">{fmt(totales.certificacion)}</td>
            <td className="px-3 py-3 text-right font-mono text-blue-800">{fmt(totales.certificacion)}</td>
            <td className="px-3 py-3 text-right font-mono text-purple-800 bg-purple-50/30">{fmt(totales.acm)}</td>
            <td className="px-3 py-3 text-right font-mono text-teal-800">{fmt(totales.devengado)}</td>
            <td className="px-3 py-3 text-right font-mono text-green-800">{fmt(totales.girado)}</td>
            <td className="px-3 py-3 text-right">
              {totales.acm > 0 && (
                <div>
                  <span className={`inline-block px-2.5 py-1 rounded text-sm font-bold ${
                    badgeAvance((totales.girado / totales.acm) * 100)
                  }`}>
                    {((totales.girado / totales.acm) * 100).toFixed(1)}%
                  </span>
                  {totales.certificacion > 0 && (
                    <div className="text-xs text-gray-500 mt-1">
                      Anual: {((totales.girado_anual / totales.certificacion) * 100).toFixed(1)}%
                    </div>
                  )}
                </div>
              )}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  )
}
