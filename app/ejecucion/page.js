'use client'
import { useState, useEffect } from 'react'
import TablaEjecucion  from '@/components/TablaEjecucion'
import EjecucionChart  from '@/components/EjecucionChart'
import LoadingSpinner  from '@/components/LoadingSpinner'

const MESES = ['', 'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
               'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']

function fmtM(n) {
  return (Number(n) / 1_000_000).toFixed(2)
}

function KpiCard({ titulo, valor, sub, sub2, color = 'blue' }) {
  const C = {
    blue:   { border: 'border-blue-500',   text: 'text-blue-700',   bg: 'bg-blue-50'   },
    green:  { border: 'border-green-500',  text: 'text-green-700',  bg: 'bg-green-50'  },
    indigo: { border: 'border-indigo-500', text: 'text-indigo-700', bg: 'bg-indigo-50' },
    purple: { border: 'border-purple-500', text: 'text-purple-700', bg: 'bg-purple-50' },
    amber:  { border: 'border-amber-500',  text: 'text-amber-700',  bg: 'bg-amber-50'  },
  }[color] || { border: 'border-blue-500', text: 'text-blue-700', bg: 'bg-blue-50' }

  return (
    <div className={`rounded-lg shadow-sm border-l-4 p-5 ${C.border} ${C.bg}`}>
      <p className="text-xs font-bold uppercase tracking-wide text-gray-500 mb-1">{titulo}</p>
      <p className={`text-3xl font-bold leading-tight ${C.text}`}>{valor}</p>
      {sub  && <p className="text-sm text-gray-500 mt-1.5">{sub}</p>}
      {sub2 && <p className="text-xs text-gray-400 mt-0.5">{sub2}</p>}
    </div>
  )
}

export default function EjecucionPage() {
  const mesActual = new Date().getMonth() + 1

  const [mes,       setMes]       = useState(mesActual)
  const [proyecto,  setProyecto]  = useState('')   // '' = todos
  const [dataMes,   setDataMes]   = useState(null)
  const [dataTodos, setDataTodos] = useState(null)
  const [loading,   setLoading]   = useState(true)
  const [error,     setError]     = useState(null)

  // Leer ?proyecto=X de la URL al montar
  useEffect(() => {
    const p = new URLSearchParams(window.location.search).get('proyecto')
    if (p) setProyecto(p)
  }, [])

  const cargar = async (m, proy) => {
    setLoading(true)
    setError(null)
    try {
      const proyParam = proy ? `&proyecto=${encodeURIComponent(proy)}` : ''
      const [resMes, resTodos] = await Promise.all([
        fetch(`/api/ejecucion-metas?mes=${m}`),
        fetch(`/api/ejecucion-meses?mes=${m}${proyParam}`),
      ])
      if (!resMes.ok || !resTodos.ok) throw new Error('Error al consultar datos')
      const [dMes, dTodos] = await Promise.all([resMes.json(), resTodos.json()])
      setDataMes(dMes)
      setDataTodos(dTodos)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { cargar(mes, proyecto) }, [mes, proyecto])

  // Actualizar URL cuando cambia el proyecto
  const handleProyecto = (p) => {
    setProyecto(p)
    const url = new URL(window.location)
    if (p) url.searchParams.set('proyecto', p)
    else   url.searchParams.delete('proyecto')
    window.history.pushState({}, '', url)
  }

  // Lista de proyectos para el selector (de los datos completos)
  const listaProyectos = dataMes
    ? [...new Map(dataMes.metas.map(m => [m.proyecto, m])).values()]
        .sort((a, b) => String(a.codi_meta).localeCompare(String(b.codi_meta)))
    : []

  // Filtrar metas por proyecto seleccionado (client-side)
  const metasFiltradas = dataMes
    ? (proyecto ? dataMes.metas.filter(m => m.proyecto === proyecto) : dataMes.metas)
    : []

  // Recalcular totales de las metas filtradas
  const totalesFiltrados = metasFiltradas.reduce((acc, m) => ({
    certificacion: acc.certificacion + m.certificacion,
    acm:           acc.acm           + m.acm,
    devengado:     acc.devengado      + m.devengado,
    girado:        acc.girado         + m.girado,
    girado_anual:  acc.girado_anual   + m.girado_anual,
  }), { certificacion: 0, acm: 0, devengado: 0, girado: 0, girado_anual: 0 })

  const t            = totalesFiltrados
  const avanceMesPct = t.acm > 0          ? ((t.girado       / t.acm)           * 100).toFixed(1) : '0.0'
  const avanceAnPct  = t.certificacion > 0 ? ((t.girado_anual / t.certificacion) * 100).toFixed(1) : '0.0'
  const colorAvance  = Number(avanceMesPct) >= 50 ? 'green' : Number(avanceMesPct) >= 20 ? 'amber' : 'blue'

  return (
    <div className="space-y-4">

      {/* Cabecera */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-800">Ejecución Presupuestal — Locadores 2026</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {proyecto ? `Proyecto: ${proyecto}` : 'Todos los proyectos'} · Año fiscal 2026 · Fuente: Únete
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {/* Filtro por proyecto */}
          <div className="flex items-center gap-2">
            <label className="text-sm font-semibold text-gray-600 whitespace-nowrap">Proyecto:</label>
            <select
              value={proyecto}
              onChange={e => handleProyecto(e.target.value)}
              className="border border-gray-300 rounded px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 max-w-[260px]"
            >
              <option value="">Todos los proyectos</option>
              {listaProyectos.map(m => (
                <option key={m.proyecto} value={m.proyecto}>
                  {m.codi_meta} — {m.proyecto.length > 40 ? m.proyecto.slice(0, 40) + '…' : m.proyecto}
                </option>
              ))}
            </select>
          </div>

          {/* Filtro por mes */}
          <div className="flex items-center gap-2">
            <label className="text-sm font-semibold text-gray-600">Mes ACM:</label>
            <select
              value={mes}
              onChange={e => setMes(Number(e.target.value))}
              className="border border-gray-300 rounded px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {MESES.slice(1).map((n, i) => (
                <option key={i + 1} value={i + 1}>{n}</option>
              ))}
            </select>
          </div>

          <button
            onClick={() => cargar(mes, proyecto)}
            className="text-sm bg-white border border-gray-300 px-4 py-2 rounded hover:bg-gray-50 text-gray-600 font-medium"
          >
            ↻ Actualizar
          </button>
        </div>
      </div>

      {loading && <LoadingSpinner mensaje={`Calculando ejecución de ${MESES[mes]}...`} />}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <p className="text-red-700 font-semibold mb-2">Error de conexión</p>
          <p className="text-red-500 text-sm mb-4">{error}</p>
          <button onClick={() => cargar(mes, proyecto)} className="bg-red-600 text-white px-4 py-2 rounded text-sm hover:bg-red-700">
            Reintentar
          </button>
        </div>
      )}

      {!loading && !error && dataMes && dataTodos && (
        <>
          {/* 4 KPIs */}
          <div className="grid grid-cols-4 gap-4">
            <KpiCard
              titulo="Compromiso Anual"
              valor={`S/ ${fmtM(t.certificacion)}M`}
              sub={`${metasFiltradas.length} metas comprometidas`}
              sub2="Total año fiscal 2026"
              color="indigo"
            />
            <KpiCard
              titulo={`ACM ${MESES[mes]}`}
              valor={`S/ ${fmtM(t.acm)}M`}
              sub={`Entregables con inicio en ${MESES[mes]}`}
              color="purple"
            />
            <KpiCard
              titulo={`Girado ${MESES[mes]}`}
              valor={`S/ ${fmtM(t.girado)}M`}
              sub={`${avanceMesPct}% del ACM de ${MESES[mes]}`}
              sub2={`Girado anual acumulado: S/ ${fmtM(t.girado_anual)}M`}
              color="green"
            />
            <KpiCard
              titulo="Avance ACM del Mes"
              valor={`${avanceMesPct}%`}
              sub={`Girado / ACM ${MESES[mes]}`}
              sub2={`Avance anual: ${avanceAnPct}%`}
              color={colorAvance}
            />
          </div>

          {/* Gráfico de distribución mensual — ancho completo */}
          <EjecucionChart
            meses={dataTodos.meses}
            titulo={proyecto ? `Distribución mensual — ${proyecto.length > 50 ? proyecto.slice(0,50)+'…' : proyecto}` : undefined}
          />

          {/* Tabla por meta */}
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h2 className="text-base font-semibold text-gray-800">
                  Ejecución por meta — {MESES[mes]}
                  {proyecto && <span className="ml-2 text-sm font-normal text-gray-500">({proyecto})</span>}
                </h2>
                <p className="text-xs text-gray-400 mt-0.5">
                  Girado y avance calculados sobre ACM del mes seleccionado · Expandir fila para ver locadores por RUC
                </p>
              </div>
            </div>
            <TablaEjecucion metas={metasFiltradas} totales={totalesFiltrados} mes={mes} />
          </div>
        </>
      )}
    </div>
  )
}
