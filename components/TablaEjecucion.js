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

function colorAvance(pct) {
  if (pct >= 50) return { bar: '#15803D', text: 'text-green-700', badge: 'bg-green-100 text-green-800 border-green-200' }
  if (pct >= 20) return { bar: '#D97706', text: 'text-amber-700', badge: 'bg-amber-100 text-amber-800 border-amber-200' }
  return           { bar: '#DC2626', text: 'text-red-700',   badge: 'bg-red-100 text-red-800 border-red-200'     }
}

function Barra({ pct, color }) {
  return (
    <div className="h-2 bg-gray-100 rounded-full overflow-hidden mt-1.5">
      <div
        className="h-full rounded-full transition-all duration-500"
        style={{ width: `${Math.min(pct, 100)}%`, backgroundColor: color }}
      />
    </div>
  )
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

  const colSpan = 5

  if (error) return (
    <tr>
      <td colSpan={colSpan} className="text-center text-red-500 text-sm py-3 bg-red-50 pl-16">
        Error: {error}
      </td>
    </tr>
  )
  if (!data) return (
    <tr>
      <td colSpan={colSpan} className="text-center text-gray-400 text-sm py-3 bg-slate-50">
        Cargando locadores de {MESES[mes]}...
      </td>
    </tr>
  )

  const lista = Array.isArray(data) ? data : []
  if (lista.length === 0) return (
    <tr>
      <td colSpan={colSpan} className="text-center text-gray-400 text-sm py-3 bg-slate-50">
        Sin entregables en {MESES[mes]}
      </td>
    </tr>
  )

  return (
    <>
      <tr className="bg-slate-100 text-xs text-gray-500 font-bold uppercase tracking-wide border-b border-slate-200">
        <td className="pl-14 pr-4 py-1.5">RUC</td>
        <td className="px-3 py-1.5 text-center">N° Orden</td>
        <td className="px-3 py-1.5 text-right">Monto</td>
        <td className="px-3 py-1.5 text-center">Estado</td>
        <td className="px-3 py-1.5 text-center">Inicio AR</td>
      </tr>
      {lista.map((loc, i) => (
        <tr key={i} className={`border-b border-slate-100 text-sm ${i % 2 === 0 ? 'bg-white' : 'bg-slate-50/60'}`}>
          <td className="pl-14 pr-4 py-2.5 font-mono text-gray-700 font-semibold tracking-wide">
            {loc.ruc || '—'}
          </td>
          <td className="px-3 py-2.5 text-center font-mono text-gray-500 text-xs">
            {loc.nro_orden || '—'}
          </td>
          <td className="px-3 py-2.5 text-right font-mono text-gray-700">
            {fmtFull(loc.monto)}
          </td>
          <td className="px-3 py-2.5 text-center">
            {loc.flag_girado === 1
              ? <span className="px-2.5 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold border border-green-200">Girado</span>
              : <span className="px-2.5 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-semibold border border-amber-200">Pendiente</span>
            }
          </td>
          <td className="px-3 py-2.5 text-center text-gray-400 text-xs">
            {loc.fecha_inicio_ar || '—'}
          </td>
        </tr>
      ))}
    </>
  )
}

export default function TablaEjecucion({ metas, totales, mes }) {
  const [expandido, setExpandido] = useState(null)
  const toggle = (idx) => setExpandido(expandido === idx ? null : idx)

  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200">
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-[#1B3A6B] text-white text-xs">
            <th className="px-4 py-3 text-left font-semibold min-w-[320px]">Meta / Proyecto</th>
            <th className="px-4 py-3 text-right font-semibold whitespace-nowrap">Compromiso Anual</th>
            <th className="px-4 py-3 text-right font-semibold whitespace-nowrap bg-[#2D4F8A]">
              ACM {MESES[mes]}
            </th>
            <th className="px-4 py-3 text-right font-semibold whitespace-nowrap bg-[#0F3D6B]">
              Girado {MESES[mes]}
            </th>
            <th className="px-4 py-3 text-center font-semibold whitespace-nowrap bg-[#0F3D6B] min-w-[180px]">
              Avance ACM %
            </th>
          </tr>
        </thead>
        <tbody>
          {metas.map((m, i) => {
            const avancePct = m.acm > 0 ? (m.girado / m.acm) * 100 : 0
            const C         = colorAvance(avancePct)
            const isOpen    = expandido === i

            return (
              <Fragment key={i}>
                <tr
                  className={`border-b border-gray-100 cursor-pointer transition-colors ${
                    isOpen ? 'bg-blue-50/60' : 'hover:bg-gray-50'
                  }`}
                  onClick={() => toggle(i)}
                >
                  {/* Meta / Proyecto */}
                  <td className="px-4 py-3.5">
                    <div className="flex items-start gap-2">
                      <span className="text-gray-400 text-xs mt-0.5 w-3 shrink-0 select-none">
                        {isOpen ? '▼' : '▶'}
                      </span>
                      <div>
                        <p className="font-semibold text-gray-800 text-sm leading-snug">{m.proyecto}</p>
                        {m.codi_meta && (
                          <p className="text-xs text-gray-400 mt-0.5">
                            Meta {m.codi_meta} · {m.total_entregables} entregables anuales
                          </p>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Compromiso Anual */}
                  <td className="px-4 py-3.5 text-right">
                    <p className="font-mono font-semibold text-gray-700 text-sm">{fmt(m.certificacion)}</p>
                  </td>

                  {/* ACM del mes */}
                  <td className="px-4 py-3.5 text-right bg-purple-50/20">
                    {m.acm > 0 ? (
                      <>
                        <p className="font-mono font-semibold text-purple-700 text-sm">{fmt(m.acm)}</p>
                        <p className="text-xs text-purple-400 mt-0.5">{m.entregables_acm} entregables</p>
                      </>
                    ) : (
                      <span className="text-gray-300 text-sm">—</span>
                    )}
                  </td>

                  {/* Girado del mes */}
                  <td className="px-4 py-3.5 text-right">
                    {m.acm > 0 ? (
                      <>
                        <p className={`font-mono font-semibold text-sm ${C.text}`}>{fmt(m.girado)}</p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {m.entregables_girados} girados
                          {m.entregables_pendientes > 0 && ` · ${m.entregables_pendientes} pend.`}
                        </p>
                      </>
                    ) : (
                      <span className="text-gray-300 text-sm">—</span>
                    )}
                  </td>

                  {/* Avance % con barra de progreso */}
                  <td className="px-4 py-3.5">
                    {m.acm > 0 ? (
                      <div>
                        <div className="flex items-center justify-between">
                          <span className={`text-lg font-bold ${C.text}`}>{avancePct.toFixed(1)}%</span>
                          <span className={`text-xs px-2 py-0.5 rounded-full border font-semibold ${C.badge}`}>
                            {avancePct >= 50 ? 'Bueno' : avancePct >= 20 ? 'Regular' : 'Bajo'}
                          </span>
                        </div>
                        <Barra pct={avancePct} color={C.bar} />
                        {m.certificacion > 0 && (
                          <p className="text-[10px] text-gray-400 mt-1">
                            Avance anual: {((m.girado_anual / m.certificacion) * 100).toFixed(1)}%
                          </p>
                        )}
                      </div>
                    ) : (
                      <span className="text-gray-300 text-sm">—</span>
                    )}
                  </td>
                </tr>

                {isOpen && <FilasLocadores mes={mes} proyecto={m.proyecto} />}
              </Fragment>
            )
          })}

          {/* Totales */}
          <tr className="bg-[#1B3A6B]/5 border-t-2 border-[#1B3A6B]/20 font-semibold">
            <td className="px-4 py-3.5 text-sm font-bold text-gray-700">
              TOTAL — {MESES[mes]}
            </td>
            <td className="px-4 py-3.5 text-right">
              <p className="font-mono font-bold text-gray-700 text-sm">{fmt(totales.certificacion)}</p>
            </td>
            <td className="px-4 py-3.5 text-right bg-purple-50/20">
              <p className="font-mono font-bold text-purple-700 text-sm">{fmt(totales.acm)}</p>
            </td>
            <td className="px-4 py-3.5 text-right">
              {(() => {
                const C = colorAvance(totales.acm > 0 ? (totales.girado / totales.acm) * 100 : 0)
                return <p className={`font-mono font-bold text-sm ${C.text}`}>{fmt(totales.girado)}</p>
              })()}
            </td>
            <td className="px-4 py-3.5">
              {totales.acm > 0 && (() => {
                const pct = (totales.girado / totales.acm) * 100
                const C   = colorAvance(pct)
                return (
                  <div>
                    <div className="flex items-center justify-between">
                      <span className={`text-lg font-bold ${C.text}`}>{pct.toFixed(1)}%</span>
                    </div>
                    <Barra pct={pct} color={C.bar} />
                    {totales.certificacion > 0 && (
                      <p className="text-[10px] text-gray-400 mt-1">
                        Avance anual: {((totales.girado_anual / totales.certificacion) * 100).toFixed(1)}%
                      </p>
                    )}
                  </div>
                )
              })()}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  )
}
