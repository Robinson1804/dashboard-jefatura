'use client'
import { useState, useEffect, useRef, Fragment } from 'react'
import LoadingSpinner from '@/components/LoadingSpinner'
import MensualChart from '@/components/MensualChart'

const NOMBRES_MES = ['', 'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']

function fmt(n) { return Number(n).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }
function fmtN(n) { return Number(n).toLocaleString('es-PE') }

function Barra({ pct }) {
  const c = pct >= 80 ? 'bg-green-500' : pct >= 30 ? 'bg-amber-400' : pct > 0 ? 'bg-red-400' : 'bg-gray-200'
  const t = pct >= 80 ? 'text-green-700' : pct >= 30 ? 'text-amber-600' : pct > 0 ? 'text-red-600' : 'text-gray-400'
  return (
    <div className="flex items-center gap-2 min-w-28">
      <div className="flex-1 bg-gray-200 rounded-full h-1.5">
        <div className={`${c} h-1.5 rounded-full transition-all`} style={{ width: `${Math.min(pct, 100)}%` }} />
      </div>
      <span className={`text-xs font-semibold w-9 text-right tabular-nums ${t}`}>{pct.toFixed(1)}%</span>
    </div>
  )
}

// ── Entregables de un locador ────────────────────────────────────────────────
function FilasEntregables({ entregables }) {
  return (
    <tr>
      <td colSpan={7} className="px-0 py-0 bg-slate-50 border-b border-slate-200">
        <div className="mx-6 my-2">
          <table className="w-full text-xs border border-slate-200 rounded overflow-hidden">
            <thead className="bg-slate-100">
              <tr>
                <th className="px-3 py-1.5 text-left text-slate-600 font-semibold">N° Entregable</th>
                <th className="px-3 py-1.5 text-left text-slate-600 font-semibold">Período AR</th>
                <th className="px-3 py-1.5 text-right text-slate-600 font-semibold">Monto (S/)</th>
                <th className="px-3 py-1.5 text-center text-slate-600 font-semibold">Estado</th>
                <th className="px-3 py-1.5 text-left text-slate-600 font-semibold">Fecha Giro</th>
              </tr>
            </thead>
            <tbody>
              {entregables.map((e, i) => (
                <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                  <td className="px-3 py-1.5 font-mono text-slate-500">N° {e.N_ENTREGABLE}</td>
                  <td className="px-3 py-1.5 text-slate-500">{e.fecha_inicio_ar} – {e.fecha_fin_ar}</td>
                  <td className="px-3 py-1.5 text-right font-mono">{fmt(e.monto)}</td>
                  <td className="px-3 py-1.5 text-center">
                    {e.FLAG_GIRADO === 1
                      ? <span className="bg-green-100 text-green-700 font-semibold px-2 py-0.5 rounded text-xs">Girado</span>
                      : <span className="bg-gray-100 text-gray-500 px-2 py-0.5 rounded text-xs">Pendiente</span>}
                  </td>
                  <td className="px-3 py-1.5 text-slate-400">{e.fecha_girado || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </td>
    </tr>
  )
}

// ── Tabla de locadores de un proyecto ────────────────────────────────────────
function FilasLocadores({ proyecto }) {
  const [locExpand, setLocExpand] = useState(null)

  // Agrupar entregables por RUC
  const locMap = {}
  for (const e of proyecto.locadores) {
    if (!locMap[e.RUC]) locMap[e.RUC] = { PROVEEDOR: e.PROVEEDOR, RUC: e.RUC, entregables: [], monto: 0, girado: 0 }
    locMap[e.RUC].entregables.push(e)
    locMap[e.RUC].monto += Number(e.monto)
    if (e.FLAG_GIRADO === 1) locMap[e.RUC].girado += Number(e.monto)
  }
  const locadores = Object.values(locMap).sort((a, b) => b.monto - a.monto)

  return (
    <tr>
      <td colSpan={7} className="px-0 py-0 bg-indigo-50 border-b border-indigo-200">
        <div className="mx-4 my-2">
          {/* Resumen del proyecto */}
          <div className="flex gap-4 text-xs text-gray-600 mb-2 px-1">
            <span className="font-semibold text-indigo-700">{proyecto.proyecto}</span>
            <span>Comprometido: <strong>S/ {fmt(proyecto.total_monto)}</strong></span>
            <span>Girado: <strong className="text-green-700">S/ {fmt(proyecto.total_girado)}</strong></span>
            <span>{locadores.length} locadores · {proyecto.locadores.length} entregables</span>
          </div>
          <table className="w-full text-xs border border-indigo-200 rounded overflow-hidden">
            <thead className="bg-indigo-100">
              <tr>
                <th className="w-6 px-2" />
                <th className="px-3 py-2 text-left font-semibold text-indigo-800">Locador</th>
                <th className="px-3 py-2 text-left font-semibold text-indigo-800">RUC</th>
                <th className="px-3 py-2 text-right font-semibold text-indigo-800">Entregables</th>
                <th className="px-3 py-2 text-right font-semibold text-indigo-800">Comprometido (S/)</th>
                <th className="px-3 py-2 text-right font-semibold text-indigo-800">Girado (S/)</th>
                <th className="px-3 py-2 text-right font-semibold text-indigo-800 min-w-28">Avance</th>
              </tr>
            </thead>
            <tbody>
              {locadores.map((loc, i) => {
                const open = locExpand === loc.RUC
                const pct = loc.monto > 0 ? (loc.girado / loc.monto) * 100 : 0
                return (
                  <Fragment key={loc.RUC}>
                    <tr
                      onClick={() => setLocExpand(open ? null : loc.RUC)}
                      className={`cursor-pointer border-t border-indigo-100 hover:bg-indigo-200/50 transition-colors ${i % 2 === 0 ? 'bg-white' : 'bg-indigo-50'} ${open ? 'bg-indigo-200/60' : ''}`}
                    >
                      <td className="px-2 text-center text-indigo-400 text-xs">{open ? '▼' : '▶'}</td>
                      <td className="px-3 py-2 font-medium text-gray-800">{loc.PROVEEDOR}</td>
                      <td className="px-3 py-2 font-mono text-gray-400">{loc.RUC}</td>
                      <td className="px-3 py-2 text-right text-gray-600">{loc.entregables.length}</td>
                      <td className="px-3 py-2 text-right font-mono">{fmt(loc.monto)}</td>
                      <td className="px-3 py-2 text-right font-mono text-green-700">{fmt(loc.girado)}</td>
                      <td className="px-3 py-2"><Barra pct={pct} /></td>
                    </tr>
                    {open && <FilasEntregables entregables={loc.entregables} />}
                  </Fragment>
                )
              })}
            </tbody>
          </table>
        </div>
      </td>
    </tr>
  )
}

// ── Tabla de proyectos de un mes ─────────────────────────────────────────────
function FilasProyectos({ drillData, loading }) {
  const [proyExpand, setProyExpand] = useState(null)
  const [busqueda, setBusqueda] = useState('')

  if (loading) return (
    <tr>
      <td colSpan={5} className="px-4 py-3 bg-blue-50 border-b border-blue-200">
        <div className="mx-4 space-y-2 py-2 animate-pulse">
          {[1,2,3,4,5].map(n => (
            <div key={n} className="flex gap-3 items-center">
              <div className="h-3 bg-blue-200 rounded w-16" />
              <div className="h-3 bg-blue-200 rounded flex-1" />
              <div className="h-3 bg-blue-200 rounded w-20" />
              <div className="h-3 bg-blue-200 rounded w-20" />
              <div className="h-3 bg-blue-200 rounded w-28" />
            </div>
          ))}
        </div>
      </td>
    </tr>
  )
  if (!drillData) return null

  const { proyectos, totales } = drillData
  const filtrados = busqueda.trim()
    ? proyectos.filter(p => p.proyecto.toLowerCase().includes(busqueda.toLowerCase()) || p.codi_Meta.includes(busqueda))
    : proyectos

  return (
    <tr>
      <td colSpan={5} className="px-0 py-0 bg-blue-50 border-b border-blue-200">
        <div className="mx-4 my-3">
          {/* Resumen del mes */}
          <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
            <div className="flex gap-4 text-xs text-gray-600">
              <span>{proyectos.length} proyectos · <strong>{fmtN(totales.locadores)}</strong> entregables</span>
              <span>Comprometido: <strong className="text-blue-700">S/ {fmt(totales.monto)}</strong></span>
              <span>Girado: <strong className="text-green-700">S/ {fmt(totales.girado)}</strong></span>
              <span>Por girar: <strong className="text-amber-600">S/ {fmt(totales.monto - totales.girado)}</strong></span>
            </div>
            <input
              type="text" placeholder="Buscar proyecto..."
              value={busqueda} onChange={e => setBusqueda(e.target.value)}
              className="border border-blue-200 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-400 bg-white w-44"
            />
          </div>

          <table className="w-full text-sm border border-blue-200 rounded overflow-hidden">
            <thead className="bg-blue-100">
              <tr>
                <th className="w-6 px-2" />
                <th className="px-3 py-2 text-left text-xs font-semibold text-blue-800">Meta</th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-blue-800">Proyecto</th>
                <th className="px-3 py-2 text-right text-xs font-semibold text-blue-800">Loc.</th>
                <th className="px-3 py-2 text-right text-xs font-semibold text-blue-800">Monto (S/)</th>
                <th className="px-3 py-2 text-right text-xs font-semibold text-blue-800">Girado (S/)</th>
                <th className="px-3 py-2 text-xs font-semibold text-blue-800 min-w-28">Avance</th>
              </tr>
            </thead>
            <tbody>
              {filtrados.map((p, i) => {
                const open = proyExpand === p.codi_Meta
                const pct = p.total_monto > 0 ? (p.total_girado / p.total_monto) * 100 : 0
                return (
                  <Fragment key={p.codi_Meta}>
                    <tr
                      onClick={() => setProyExpand(open ? null : p.codi_Meta)}
                      className={`cursor-pointer border-t border-blue-100 hover:bg-blue-200/50 transition-colors ${i % 2 === 0 ? 'bg-white' : 'bg-blue-50'} ${open ? 'bg-blue-200/60' : ''}`}
                    >
                      <td className="px-2 text-center text-blue-400 text-xs">{open ? '▼' : '▶'}</td>
                      <td className="px-3 py-2 font-mono text-xs text-gray-400">{p.codi_Meta}</td>
                      <td className="px-3 py-2 text-xs font-medium max-w-xs truncate" title={p.proyecto}>{p.proyecto}</td>
                      <td className="px-3 py-2 text-right text-gray-600">{p.locadores.length}</td>
                      <td className="px-3 py-2 text-right font-mono">{fmt(p.total_monto)}</td>
                      <td className="px-3 py-2 text-right font-mono text-green-700">{fmt(p.total_girado)}</td>
                      <td className="px-3 py-2"><Barra pct={pct} /></td>
                    </tr>
                    {open && <FilasLocadores proyecto={p} />}
                  </Fragment>
                )
              })}
              {filtrados.length === 0 && (
                <tr><td colSpan={7} className="px-3 py-4 text-center text-xs text-gray-400">Sin resultados</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </td>
    </tr>
  )
}

// ── Página principal ──────────────────────────────────────────────────────────
export default function MensualDetallePage() {
  const MES_ACTUAL = new Date().getMonth() + 1

  const [meses, setMeses] = useState([])
  const [loading, setLoading] = useState(true)

  const [mesSel, setMesSel] = useState(null)
  const [drillCache, setDrillCache] = useState({}) // { [mes]: data }
  const [loadingMes, setLoadingMes] = useState(null)

  const rowRefs = useRef({})

  useEffect(() => {
    fetch('/api/mensual')
      .then(r => r.json())
      .then(d => {
        setMeses(d.meses || [])
        // Pre-fetch todos los meses en background para que click = instantáneo
        const mesesConDatos = (d.meses || []).filter(m => m.total_entregables > 0)
        mesesConDatos.forEach(m => {
          fetch(`/api/mensual/detalle?mes=${m.mes}`)
            .then(r => r.json())
            .then(json => setDrillCache(prev => ({ ...prev, [m.mes]: json })))
            .catch(() => {})
        })
      })
      .finally(() => setLoading(false))
  }, [])

  const handleMesClick = async (mes) => {
    if (mes === mesSel) { setMesSel(null); return }
    setMesSel(mes)

    // Scroll suave hacia la fila seleccionada
    setTimeout(() => rowRefs.current[mes]?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50)

    if (drillCache[mes]) return // ya cargado

    setLoadingMes(mes)
    try {
      const res = await fetch(`/api/mensual/detalle?mes=${mes}`)
      const json = await res.json()
      setDrillCache(prev => ({ ...prev, [mes]: json }))
    } catch { /* silencioso */ }
    finally { setLoadingMes(null) }
  }

  if (loading) return <LoadingSpinner mensaje="Cargando datos mensuales..." />

  const totalArmado = meses.reduce((a, m) => a + Number(m.monto_armado), 0)
  const totalGirado = meses.reduce((a, m) => a + Number(m.monto_girado), 0)
  const pctGlobal = totalArmado > 0 ? (totalGirado / totalArmado) * 100 : 0

  return (
    <div className="space-y-5">

      <div>
        <h1 className="text-xl font-bold text-gray-800">Detalle Mensual por Proyecto</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Clic en un mes → proyectos · clic en proyecto → locadores · clic en locador → entregables
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Compromiso Anual 2026</p>
          <p className="text-xl font-bold text-blue-700">S/ {fmt(totalArmado)}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Total Girado 2026</p>
          <p className="text-xl font-bold text-green-700">S/ {fmt(totalGirado)}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Avance Global</p>
          <Barra pct={pctGlobal} />
          <p className="text-xs text-gray-400 mt-1">S/ {fmt(totalArmado - totalGirado)} por girar</p>
        </div>
      </div>

      {/* Gráfico de barras */}
      <div className="bg-white rounded-lg border border-gray-200 p-5">
        <h2 className="text-sm font-semibold text-gray-700 mb-1">
          Distribución mensual — Girado vs Pendiente
          {mesSel && <span className="ml-2 text-blue-600 font-normal">· {NOMBRES_MES[mesSel]} seleccionado</span>}
        </h2>
        <p className="text-xs text-gray-400 mb-4">Clic en una barra para expandir los proyectos del mes</p>
        <MensualChart meses={meses} onMesClick={handleMesClick} mesSeleccionado={mesSel} />
      </div>

      {/* Tabla principal — todo inline */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-100 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Mes</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Entregables</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Comprometido (S/)</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Girado (S/)</th>
              <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase min-w-36">Avance</th>
            </tr>
          </thead>
          <tbody>
            {meses.map((m, i) => {
              const esActual = m.mes === MES_ACTUAL
              const esSel = m.mes === mesSel
              return (
                <Fragment key={m.mes}>
                  <tr
                    ref={el => rowRefs.current[m.mes] = el}
                    onClick={() => handleMesClick(m.mes)}
                    className={`cursor-pointer hover:bg-blue-50 transition-colors border-b border-gray-100 ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50'} ${esActual ? 'ring-1 ring-inset ring-amber-400' : ''} ${esSel ? 'bg-blue-50 ring-2 ring-inset ring-blue-400' : ''}`}
                  >
                    <td className="px-4 py-3 font-medium">
                      {m.nombre_mes}
                      {esActual && <span className="ml-2 text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded">actual</span>}
                      {esSel && <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">▼ abierto</span>}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">{fmtN(m.total_entregables)}</td>
                    <td className="px-4 py-3 text-right font-mono tabular-nums">{fmt(m.monto_armado)}</td>
                    <td className="px-4 py-3 text-right font-mono tabular-nums text-green-700">{fmt(m.monto_girado)}</td>
                    <td className="px-4 py-3"><Barra pct={Number(m.pct_avance)} /></td>
                  </tr>

                  {/* Expansión inline de proyectos */}
                  {esSel && (
                    <FilasProyectos
                      drillData={drillCache[m.mes]}
                      loading={loadingMes === m.mes && !drillCache[m.mes]}
                    />
                  )}
                </Fragment>
              )
            })}
          </tbody>
        </table>
      </div>

    </div>
  )
}
