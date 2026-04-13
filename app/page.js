'use client'
import { useState, useEffect } from 'react'
import ProyectosChart from '@/components/ProyectosChart'
import TablaProyectos from '@/components/TablaProyectos'
import CadenaPresupuestal from '@/components/CadenaPresupuestal'
import LoadingSpinner from '@/components/LoadingSpinner'

function fmtM(n) {
  return (Number(n) / 1_000_000).toFixed(1)
}

// ── KPI card con fuente ───────────────────────────────────────────────────────
function KpiCard({ titulo, valor, sub, sub2, fuente, color = 'blue' }) {
  const colores = {
    blue:   { border: 'border-blue-500',   text: 'text-blue-700',   badge: 'bg-blue-50 text-blue-600' },
    green:  { border: 'border-green-500',  text: 'text-green-700',  badge: 'bg-green-50 text-green-600' },
    amber:  { border: 'border-amber-500',  text: 'text-amber-700',  badge: 'bg-amber-50 text-amber-600' },
    gray:   { border: 'border-gray-400',   text: 'text-gray-600',   badge: 'bg-gray-50 text-gray-500' },
    indigo: { border: 'border-indigo-500', text: 'text-indigo-700', badge: 'bg-indigo-50 text-indigo-600' },
    red:    { border: 'border-red-400',    text: 'text-red-700',    badge: 'bg-red-50 text-red-600' },
  }
  const c = colores[color] || colores.blue
  return (
    <div className={`bg-white rounded-lg shadow-sm border-l-4 p-4 ${c.border}`}>
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-1">{titulo}</p>
      <p className={`text-2xl font-bold ${c.text}`}>{valor}</p>
      {sub  && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      {sub2 && <p className="text-xs font-semibold text-gray-600 mt-0.5">{sub2}</p>}
      {fuente && (
        <span className={`inline-block mt-1.5 text-[10px] font-semibold px-1.5 py-0.5 rounded ${c.badge}`}>
          {fuente}
        </span>
      )}
    </div>
  )
}

// ── Semáforo vertical ─────────────────────────────────────────────────────────
function Semaforo({ kpis }) {
  const mesActual = new Date().getMonth() + 1
  const pctAno = Math.round((mesActual / 12) * 100)
  const pim = kpis.mef.pim
  const comprometido = kpis.monto_armado
  const girado = kpis.monto_girado

  const pctCompromiso = pim > 0 ? (comprometido / pim) * 100 : 0
  const idealAhora = pim * (mesActual / 12)
  const ritmoGiro = idealAhora > 0 ? (girado / idealAhora) * 100 : 0

  const indicadores = [
    {
      label: 'Mes del año',
      valor: `${pctAno}%`,
      desc: `Mes ${mesActual} de 12`,
      nota: 'Referencia temporal',
      estado: 'info',
    },
    {
      label: 'Compromiso vs PIM',
      valor: `${pctCompromiso.toFixed(1)}%`,
      desc: `S/ ${fmtM(comprometido)}M de S/ ${fmtM(pim)}M`,
      nota: pctCompromiso >= pctAno ? `Sobre el ritmo anual (${pctAno}%)` : `Bajo el ritmo anual (${pctAno}%)`,
      estado: pctCompromiso >= pctAno ? 'ok' : pctCompromiso >= pctAno * 0.7 ? 'alerta' : 'mal',
    },
    {
      label: 'Ritmo de giro',
      valor: `${ritmoGiro.toFixed(0)}%`,
      desc: `S/ ${fmtM(girado)}M · ideal S/ ${fmtM(idealAhora)}M`,
      nota: ritmoGiro >= 75 ? 'Dentro del ritmo' : 'Giro lento — pendientes de pago',
      estado: ritmoGiro >= 75 ? 'ok' : ritmoGiro >= 40 ? 'alerta' : 'mal',
    },
  ]

  const C = {
    ok:     { dot: 'bg-green-500', wrap: 'bg-green-50 border-green-200',  num: 'text-green-700',  nota: 'text-green-600' },
    alerta: { dot: 'bg-amber-500', wrap: 'bg-amber-50 border-amber-200',  num: 'text-amber-700',  nota: 'text-amber-600' },
    mal:    { dot: 'bg-red-500',   wrap: 'bg-red-50 border-red-200',      num: 'text-red-700',    nota: 'text-red-600'   },
    info:   { dot: 'bg-blue-400',  wrap: 'bg-blue-50 border-blue-200',    num: 'text-blue-700',   nota: 'text-blue-600'  },
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-3">
      <p className="text-xs font-bold text-gray-700 mb-3">Semáforo de ejecución</p>
      <div className="space-y-3">
        {indicadores.map(ind => {
          const c = C[ind.estado]
          return (
            <div key={ind.label} className={`rounded-lg border p-3 ${c.wrap}`}>
              <div className="flex items-center gap-1.5 mb-1">
                <div className={`w-2 h-2 rounded-full shrink-0 ${c.dot}`} />
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">{ind.label}</p>
              </div>
              <p className={`text-2xl font-bold leading-tight ${c.num}`}>{ind.valor}</p>
              <p className="text-[11px] text-gray-500 mt-0.5">{ind.desc}</p>
              <p className={`text-[11px] font-semibold mt-1 ${c.nota}`}>{ind.nota}</p>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Página ────────────────────────────────────────────────────────────────────
export default function ResumenPage() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const cargarDatos = async (refresh = false) => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(refresh ? '/api/resumen?refresh=1' : '/api/resumen')
      if (!res.ok) throw new Error('Error al consultar el servidor de base de datos')
      setData(await res.json())
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { cargarDatos() }, [])

  if (loading) return <LoadingSpinner mensaje="Consultando base de datos..." />

  if (error) return (
    <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
      <p className="text-red-700 font-semibold mb-2">Error de conexión</p>
      <p className="text-red-500 text-sm mb-4">{error}</p>
      <button onClick={() => cargarDatos()} className="bg-red-600 text-white px-4 py-2 rounded text-sm hover:bg-red-700">
        Reintentar
      </button>
    </div>
  )

  const { kpis, proyectos } = data
  const { mef } = kpis

  return (
    // Layout: contenido principal | semáforo (cadena oculta)
    <div className="grid gap-4" style={{ gridTemplateColumns: '1fr 210px' }}>

      {/* ── Cadena presupuestal — oculta temporalmente, no borrar ── */}
      {false && (
        <div className="sticky top-4 self-start">
          <CadenaPresupuestal
            mef={mef}
            unete={{ monto_armado: kpis.monto_armado, monto_girado: kpis.monto_girado }}
          />
        </div>
      )}

      {/* ── Centro ── */}
      <div className="space-y-4 min-w-0">

        {/* Cabecera */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-800">Resumen de Ejecución Presupuestal</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Locadores · Año fiscal 2026 · {proyectos.length} proyectos · {kpis.ordenes.toLocaleString()} órdenes
            </p>
          </div>
          <button
            onClick={() => cargarDatos(true)}
            className="text-sm bg-white border border-gray-300 px-3 py-2 rounded hover:bg-gray-50 text-gray-600 shrink-0"
          >
            ↻ Actualizar datos
          </button>
        </div>

        {/* KPIs — 5 tarjetas */}
        <div className="grid grid-cols-5 gap-3">
          <KpiCard
            titulo="PIM Locadores 2026"
            valor={`S/ ${fmtM(mef.pim)}M`}
            sub={`PIA: S/ ${fmtM(mef.pia)}M`}
            fuente={`MEF · ${mef.fecha_corte}`}
            color="gray"
          />
          <KpiCard
            titulo="Comprometido"
            valor={`S/ ${fmtM(kpis.monto_armado)}M`}
            sub={`${Number(kpis.pct_compromiso_pim)}% del PIM · ${kpis.ordenes.toLocaleString()} órdenes`}
            fuente="Únete · tiempo real"
            color="blue"
          />
          <KpiCard
            titulo="Girado"
            valor={`S/ ${fmtM(kpis.monto_girado)}M`}
            sub={`${kpis.entregables_girados.toLocaleString()} entregables pagados`}
            sub2={`${kpis.pct_ejecucion}% del PIM MEF`}
            fuente="Únete · tiempo real"
            color="green"
          />
          <KpiCard
            titulo="Saldo Libre"
            valor={`S/ ${fmtM(kpis.saldo_libre)}M`}
            sub="PIM menos comprometido"
            fuente="PIM MEF − Comprometido"
            color={kpis.saldo_libre > 0 ? 'indigo' : 'red'}
          />
          <KpiCard
            titulo="% Ejecución"
            valor={`${kpis.pct_ejecucion}%`}
            sub={`${kpis.entregables_pendientes.toLocaleString()} entregables pendientes`}
            fuente="Girado Únete / PIM MEF"
            color={Number(kpis.pct_ejecucion) >= 20 ? 'green' : 'amber'}
          />
        </div>

        {/* Gráfico */}
        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-sm font-semibold text-gray-700">Top 15 proyectos — Compromiso Anual vs Girado</h2>
            <div className="flex items-center gap-4 text-xs text-gray-500">
              <span className="flex items-center gap-1.5"><span className="inline-block w-3 h-2 rounded-sm bg-blue-200"></span>Compromiso</span>
              <span className="flex items-center gap-1.5"><span className="inline-block w-3 h-2 rounded-sm bg-emerald-500"></span>Girado</span>
            </div>
          </div>
          <p className="text-xs text-gray-400 mb-3">Fuente: Únete · Montos en soles · % = Girado / Compromiso</p>
          <ProyectosChart proyectos={proyectos} />
        </div>

        {/* Tabla */}
        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Detalle por proyecto</h2>
          <TablaProyectos proyectos={proyectos} />
        </div>

      </div>

      {/* ── Semáforo (derecha, sticky) ── */}
      <div className="sticky top-4 self-start">
        <Semaforo kpis={kpis} />
      </div>

    </div>
  )
}
