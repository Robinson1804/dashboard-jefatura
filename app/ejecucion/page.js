'use client'
import { useState, useEffect } from 'react'
import TablaEjecucion from '@/components/TablaEjecucion'
import LoadingSpinner from '@/components/LoadingSpinner'

const MESES = ['', 'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
               'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']

function fmtM(n) {
  return (Number(n) / 1_000_000).toFixed(2)
}

function KpiCard({ titulo, valor, sub, color = 'blue' }) {
  const colores = {
    blue:   { border: 'border-blue-500',   text: 'text-blue-700'   },
    green:  { border: 'border-green-500',  text: 'text-green-700'  },
    teal:   { border: 'border-teal-500',   text: 'text-teal-700'   },
    indigo: { border: 'border-indigo-500', text: 'text-indigo-700' },
  }
  const c = colores[color] || colores.blue
  return (
    <div className={`bg-white rounded-lg shadow-sm border-l-4 p-4 ${c.border}`}>
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-1">{titulo}</p>
      <p className={`text-2xl font-bold ${c.text}`}>{valor}</p>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </div>
  )
}

export default function EjecucionPage() {
  const mesActual = new Date().getMonth() + 1
  const [mes, setMes]       = useState(mesActual)
  const [data, setData]     = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]   = useState(null)

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

  const avancePct = data
    ? data.totales.certificacion > 0
      ? ((data.totales.girado / data.totales.certificacion) * 100).toFixed(1)
      : '0.0'
    : null

  return (
    <div className="space-y-5">

      {/* Cabecera */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-800">Ejecución por Meta — Estilo Consulta Amigable</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Locadores · Año fiscal 2026 · Fuente: Únete (tiempo real)
          </p>
        </div>
        <div className="flex items-center gap-3">
          <label className="text-sm font-medium text-gray-600">Mes ACM:</label>
          <select
            value={mes}
            onChange={e => setMes(Number(e.target.value))}
            className="border border-gray-300 rounded px-3 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {MESES.slice(1).map((nombre, i) => (
              <option key={i+1} value={i+1}>{nombre}</option>
            ))}
          </select>
          <button
            onClick={() => cargar(mes)}
            className="text-sm bg-white border border-gray-300 px-3 py-1.5 rounded hover:bg-gray-50 text-gray-600"
          >
            ↻ Actualizar
          </button>
        </div>
      </div>

      {loading && <LoadingSpinner mensaje="Calculando ejecución por meta..." />}

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
          {/* KPIs resumen */}
          <div className="grid grid-cols-4 gap-3">
            <KpiCard
              titulo="Compromiso Anual (Certificación)"
              valor={`S/ ${fmtM(data.totales.certificacion)}M`}
              sub={`${data.metas.length} metas · Comprometido total`}
              color="indigo"
            />
            <KpiCard
              titulo={`ACM ${MESES[mes]}`}
              valor={`S/ ${fmtM(data.totales.acm)}M`}
              sub={`Entregables en ${MESES[mes]}`}
              color="blue"
            />
            <KpiCard
              titulo="Devengado"
              valor={`S/ ${fmtM(data.totales.devengado)}M`}
              sub="En tesorería (CODESTADO=88)"
              color="teal"
            />
            <KpiCard
              titulo="Girado"
              valor={`S/ ${fmtM(data.totales.girado)}M`}
              sub={`${avancePct}% del compromiso anual`}
              color="green"
            />
          </div>

          {/* Nota sobre devengado */}
          {data.totales.devengado === 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-sm text-amber-700">
              <span className="font-semibold">Devengado en 0:</span> Requiere ejecutar{' '}
              <code className="bg-amber-100 px-1 rounded font-mono text-xs">node scripts/sync-to-postgres.js</code>{' '}
              con el nuevo JOIN a BDSACD para cargar el campo CODESTADO.
            </div>
          )}

          {/* Tabla */}
          <div className="bg-white rounded-lg border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-gray-700">
                Ejecución por meta — ACM: {MESES[mes]}
              </h2>
              <span className="text-xs text-gray-400">
                Haz clic en una fila para ver locadores del mes
              </span>
            </div>
            <TablaEjecucion metas={data.metas} totales={data.totales} mes={mes} />
          </div>
        </>
      )}
    </div>
  )
}
