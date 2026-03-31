'use client'
import { useState, useEffect, Fragment } from 'react'

const MESES = ['', 'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
               'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']

function fmt(n) {
  if (n == null) return '—'
  if (n >= 1_000_000) return `S/ ${(n / 1_000_000).toFixed(2)}M`
  if (n >= 1_000)     return `S/ ${(n / 1_000).toFixed(0)}K`
  return `S/ ${n}`
}

function fmtFull(n) {
  if (n == null) return '—'
  return `S/ ${Number(n).toLocaleString('es-PE', { minimumFractionDigits: 2 })}`
}

function colorAvance(pct) {
  if (pct >= 50) return 'text-green-700 font-bold'
  if (pct >= 20) return 'text-amber-600 font-bold'
  return 'text-red-600 font-bold'
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
        // API returns { proyectos: [{ locadores: [...] }] } — flatten all locadores
        const locadores = d.proyectos
          ? d.proyectos.flatMap(p => p.locadores || [])
          : (d.locadores || d)
        setData(locadores)
      })
      .catch(e => setError(e.message))
  }, [mes, proyecto])

  if (error) return (
    <tr><td colSpan={9} className="text-center text-red-500 text-xs py-2">Error: {error}</td></tr>
  )
  if (!data) return (
    <tr><td colSpan={9} className="text-center text-gray-400 text-xs py-2">Cargando locadores...</td></tr>
  )

  const lista = Array.isArray(data) ? data : []
  if (lista.length === 0) return (
    <tr><td colSpan={9} className="text-center text-gray-400 text-xs py-2">Sin entregables en {MESES[mes]}</td></tr>
  )

  return lista.map((loc, i) => (
    <tr key={i} className="bg-blue-50 text-[11px] border-b border-blue-100">
      <td className="px-3 py-1.5 pl-10 text-gray-700 font-medium" colSpan={2}>{loc.proveedor}</td>
      <td className="px-3 py-1.5 text-gray-500">RUC: {loc.ruc}</td>
      <td className="px-3 py-1.5 text-right font-mono">{fmtFull(loc.monto)}</td>
      <td className="px-3 py-1.5 text-right font-mono">{fmtFull(loc.monto)}</td>
      <td className="px-3 py-1.5 text-center text-gray-400">—</td>
      <td className="px-3 py-1.5 text-center text-gray-400">—</td>
      <td className="px-3 py-1.5 text-center">
        {loc.flag_girado === 1
          ? <span className="px-1.5 py-0.5 bg-green-100 text-green-700 rounded text-[10px] font-semibold">Girado</span>
          : <span className="px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded text-[10px] font-semibold">Pendiente</span>
        }
      </td>
      <td className="px-3 py-1.5 text-center text-gray-400">
        {loc.fecha_fin_ar || loc.fecha_inicio_ar || '—'}
      </td>
    </tr>
  ))
}

export default function TablaEjecucion({ metas, totales, mes }) {
  const [expandido, setExpandido] = useState(null)

  const toggle = (idx) => setExpandido(expandido === idx ? null : idx)

  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="bg-[#1B3A6B] text-white text-[11px]">
            <th className="px-3 py-2 text-left font-semibold" rowSpan={2}>Meta / Proyecto</th>
            <th className="px-3 py-2 text-right font-semibold" rowSpan={2}>PIA</th>
            <th className="px-3 py-2 text-right font-semibold" rowSpan={2}>PIM</th>
            <th className="px-3 py-2 text-right font-semibold" rowSpan={2}>Certificación</th>
            <th className="px-3 py-2 text-right font-semibold" rowSpan={2}>Compromiso Anual</th>
            <th className="px-3 py-2 text-right font-semibold" rowSpan={2}>ACM {MESES[mes]}</th>
            <th className="px-3 py-2 text-center font-semibold bg-[#0F4C8A]" colSpan={3}>Ejecución</th>
          </tr>
          <tr className="bg-[#1B3A6B] text-white text-[11px]">
            <th className="px-3 py-2 text-right font-semibold bg-[#0F4C8A]">Devengado</th>
            <th className="px-3 py-2 text-right font-semibold bg-[#0F4C8A]">Girado</th>
            <th className="px-3 py-2 text-right font-semibold bg-[#0F4C8A]">Avance %</th>
          </tr>
        </thead>
        <tbody>
          {metas.map((m, i) => {
            const compromiso = m.certificacion
            const avancePct  = compromiso > 0 ? (m.girado / compromiso) * 100 : 0
            const isOpen     = expandido === i

            return (
            <Fragment key={i}>
              <tr
                className={`border-b border-gray-100 cursor-pointer transition-colors ${
                  isOpen ? 'bg-blue-50' : 'hover:bg-gray-50'
                }`}
                onClick={() => toggle(i)}
              >
                <td className="px-3 py-2.5">
                  <div className="flex items-center gap-1.5">
                    <span className="text-gray-400 text-xs w-3 shrink-0">{isOpen ? '▼' : '▶'}</span>
                    <div>
                      <div className="font-medium text-gray-800 text-[12px] leading-tight">{m.proyecto}</div>
                      {m.codi_meta && (
                        <div className="text-[10px] text-gray-400">Meta {m.codi_meta}</div>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-3 py-2.5 text-right text-gray-500 font-mono text-xs">
                  {m.pia != null ? fmt(m.pia) : <span className="text-gray-300">—</span>}
                </td>
                <td className="px-3 py-2.5 text-right text-gray-500 font-mono text-xs">
                  {m.pim != null ? fmt(m.pim) : <span className="text-gray-300">—</span>}
                </td>
                <td className="px-3 py-2.5 text-right font-mono text-xs text-indigo-700">
                  {fmt(m.certificacion)}
                </td>
                <td className="px-3 py-2.5 text-right font-mono text-xs text-blue-700">
                  {fmt(compromiso)}
                </td>
                <td className="px-3 py-2.5 text-right font-mono text-xs text-purple-700">
                  {fmt(m.acm)}
                  {m.entregables_acm > 0 && (
                    <div className="text-[9px] text-purple-400">{m.entregables_acm} entregables</div>
                  )}
                </td>
                <td className="px-3 py-2.5 text-right font-mono text-xs text-teal-700">
                  {fmt(m.devengado)}
                  {m.entregables_devengados > 0 && (
                    <div className="text-[9px] text-teal-400">{m.entregables_devengados} entregables</div>
                  )}
                </td>
                <td className="px-3 py-2.5 text-right font-mono text-xs text-green-700">
                  {fmt(m.girado)}
                  {m.entregables_girados > 0 && (
                    <div className="text-[9px] text-green-400">{m.entregables_girados} girados</div>
                  )}
                </td>
                <td className="px-3 py-2.5 text-right">
                  <span className={`inline-block px-2 py-0.5 rounded text-[11px] ${badgeAvance(avancePct)}`}>
                    {avancePct.toFixed(1)}%
                  </span>
                </td>
              </tr>,
              {isOpen && (
                <FilasLocadores mes={mes} proyecto={m.proyecto} />
              )}
            </Fragment>
          )
          })}

          {/* Fila de totales */}
          <tr className="bg-gray-100 border-t-2 border-gray-300 font-semibold text-[12px]">
            <td className="px-3 py-2.5 text-gray-700">TOTAL</td>
            <td className="px-3 py-2.5" colSpan={2}></td>
            <td className="px-3 py-2.5 text-right font-mono text-indigo-800">{fmt(totales.certificacion)}</td>
            <td className="px-3 py-2.5 text-right font-mono text-blue-800">{fmt(totales.certificacion)}</td>
            <td className="px-3 py-2.5 text-right font-mono text-purple-800">{fmt(totales.acm)}</td>
            <td className="px-3 py-2.5 text-right font-mono text-teal-800">{fmt(totales.devengado)}</td>
            <td className="px-3 py-2.5 text-right font-mono text-green-800">{fmt(totales.girado)}</td>
            <td className="px-3 py-2.5 text-right">
              {totales.certificacion > 0 && (
                <span className={`inline-block px-2 py-0.5 rounded text-[11px] ${
                  badgeAvance((totales.girado / totales.certificacion) * 100)
                }`}>
                  {((totales.girado / totales.certificacion) * 100).toFixed(1)}%
                </span>
              )}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  )
}
