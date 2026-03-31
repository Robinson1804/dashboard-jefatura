'use client'
import { useState, useEffect } from 'react'
import TablaEjecucion from '@/components/TablaEjecucion'
import LoadingSpinner from '@/components/LoadingSpinner'

const MESES = ['', 'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
               'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']

function fmtM(n, decimals = 2) {
  return (Number(n) / 1_000_000).toFixed(decimals)
}

function KpiCard({ titulo, valor, sub, sub2, color = 'blue' }) {
  const colores = {
    blue:   { border: 'border-blue-500',   text: 'text-blue-700',   bg: 'bg-blue-50'   },
    green:  { border: 'border-green-500',  text: 'text-green-700',  bg: 'bg-green-50'  },
    teal:   { border: 'border-teal-500',   text: 'text-teal-700',   bg: 'bg-teal-50'   },
    indigo: { border: 'border-indigo-500', text: 'text-indigo-700', bg: 'bg-indigo-50' },
    purple: { border: 'border-purple-500', text: 'text-purple-700', bg: 'bg-purple-50' },
    amber:  { border: 'border-amber-500',  text: 'text-amber-700',  bg: 'bg-amber-50'  },
  }
  const c = colores[color] || colores.blue
  return (
    <div className={`rounded-lg shadow-sm border-l-4 p-5 ${c.border} ${c.bg}`}>
      <p className="text-xs font-bold uppercase tracking-wide text-gray-500 mb-1">{titulo}</p>
      <p className={`text-3xl font-bold ${c.text}`}>{valor}</p>
      {sub  && <p className="text-sm text-gray-500 mt-1">{sub}</p>}
      {sub2 && <p className="text-xs text-gray-400 mt-0.5">{sub2}</p>}
    </div>
  )
}

export default function EjecucionPage() {
  const mesActual = new Date().getMonth() + 1
  const [mes, setMes]         = useState(mesActual)
  const [data, setData]       = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(null)

  const cargar = async (m) => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/ejecucion-metas?mes=${m}`)
      if (!res.ok) throw new Error('Error al consultar datos de ejecución')
      setData(await res.json())
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { cargar(mes) }, [mes])

  const t = data?.totales
  const avanceMesPct   = t && t.acm > 0          ? ((t.girado      / t.acm)          * 100).toFixed(1) : '0.0'
  const avanceAnualPct = t && t.certificacion > 0 ? ((t.girado_anual / t.certificacion) * 100).toFixed(1) : '0.0'

  return (
    <div className="space-y-5">

      {/* Cabecera */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-800">Ejecución por Meta — Consulta Amigable</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Locadores · Año fiscal 2026 · Fuente: Únete (tiempo real)
          </p>
        </div>
        <div className="flex items-center gap-3">
          <label className="text-sm font-semibold text-gray-600">Mes ACM:</label>
          <select
            value={mes}
            onChange={e => setMes(Number(e.target.value))}
            className="border border-gray-300 rounded px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {MESES.slice(1).map((nombre, i) => (
              <option key={i+1} value={i+1}>{nombre}</option>
            ))}
          </select>
          <button
            onClick={() => cargar(mes)}
            className="text-sm bg-white border border-gray-300 px-4 py-2 rounded hover:bg-gray-50 text-gray-600 font-medium"
          >
            ↻ Actualizar
          </button>
        </div>
      </div>

      {loading && <LoadingSpinner mensaje={`Calculando ejecución de ${MESES[mes]}...`} />}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <p className="text-red-700 font-semibold mb-2">Error</p>
          <p className="text-red-500 text-sm mb-4">{error}</p>
          <button onClick={() => cargar(mes)} className="bg-red-600 text-white px-4 py-2 rounded text-sm hover:bg-red-700">
            Reintentar
          </button>
        </div>
      )}

      {!loading && !error && data && (
        <>
          {/* KPIs — 5 tarjetas */}
          <div className="grid grid-cols-5 gap-4">
            <KpiCard
              titulo="Compromiso Anual"
              valor={`S/ ${fmtM(t.certificacion)}M`}
              sub={`${data.metas.length} metas comprometidas`}
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
              titulo="Devengado"
              valor={`S/ ${fmtM(t.devengado)}M`}
              sub="En tesorería (CODESTADO=88)"
              color="teal"
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
              sub2={`Avance anual: ${avanceAnualPct}%`}
              color={Number(avanceMesPct) >= 50 ? 'green' : Number(avanceMesPct) >= 20 ? 'amber' : 'blue'}
            />
          </div>

          {/* Tabla */}
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h2 className="text-base font-semibold text-gray-800">
                  Ejecución por meta — ACM: {MESES[mes]}
                </h2>
                <p className="text-xs text-gray-400 mt-0.5">
                  Girado y Avance % calculados sobre los entregables del mes seleccionado · Clic en fila para ver locadores
                </p>
              </div>
            </div>
            <TablaEjecucion metas={data.metas} totales={data.totales} mes={mes} />
          </div>
        </>
      )}
    </div>
  )
}
