'use client'
import { useState, useEffect } from 'react'
import ProyectosChart from '@/components/ProyectosChart'
import TablaProyectos from '@/components/TablaProyectos'
import CadenaPresupuestal from '@/components/CadenaPresupuestal'
import LoadingSpinner from '@/components/LoadingSpinner'

function fmt(n) {
  return Number(n).toLocaleString('es-PE', { minimumFractionDigits: 2 })
}
function fmtM(n) {
  return (Number(n) / 1_000_000).toFixed(1)
}

// ── Tarjeta KPI con indicador de fuente ──────────────────────────────────────
function KpiCard({ titulo, valor, sub, fuente, color = 'blue', grande = false }) {
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
      <p className={`font-bold ${grande ? 'text-2xl' : 'text-xl'} ${c.text}`}>{valor}</p>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      {fuente && (
        <span className={`inline-block mt-1.5 text-[10px] font-semibold px-1.5 py-0.5 rounded ${c.badge}`}>
          {fuente}
        </span>
      )}
    </div>
  )
}

// ── Semáforo de ritmo de ejecución ───────────────────────────────────────────
function Semaforo({ kpis }) {
  const mesActual = new Date().getMonth() + 1
  const pctAno = Math.round((mesActual / 12) * 100)
  const pim = kpis.mef.pim
  const comprometido = kpis.monto_armado
  const girado = kpis.monto_girado

  const pctCompromiso = pim > 0 ? (comprometido / pim) * 100 : 0
  const pctGirado = pim > 0 ? (girado / pim) * 100 : 0
  const idealAhora = pim * (mesActual / 12)
  const ritmoGiro = idealAhora > 0 ? (girado / idealAhora) * 100 : 0

  const indicadores = [
    {
      label: 'Compromiso vs PIM',
      valor: `${pctCompromiso.toFixed(1)}%`,
      desc: `S/ ${fmtM(comprometido)}M de S/ ${fmtM(pim)}M`,
      estado: pctCompromiso >= pctAno ? 'ok' : pctCompromiso >= pctAno * 0.7 ? 'alerta' : 'mal',
      nota: pctCompromiso >= pctAno
        ? `Por encima del ritmo esperado (${pctAno}%)`
        : `Por debajo del ritmo anual (${pctAno}% del año)`,
    },
    {
      label: 'Ritmo de giro',
      valor: `${ritmoGiro.toFixed(0)}%`,
      desc: `S/ ${fmtM(girado)}M girado · ideal S/ ${fmtM(idealAhora)}M`,
      estado: ritmoGiro >= 75 ? 'ok' : ritmoGiro >= 40 ? 'alerta' : 'mal',
      nota: ritmoGiro >= 75 ? 'Giro dentro del ritmo esperado' : 'Ritmo de giro lento — entregables pendientes de pago',
    },
    {
      label: 'Mes del año',
      valor: `${pctAno}%`,
      desc: `Mes ${mesActual} de 12`,
      estado: 'info',
      nota: `Referencia temporal para medir ritmo`,
    },
  ]

  const colores = {
    ok:     { dot: 'bg-green-500',  bg: 'bg-green-50  border-green-200',  text: 'text-green-700' },
    alerta: { dot: 'bg-amber-500',  bg: 'bg-amber-50  border-amber-200',  text: 'text-amber-700' },
    mal:    { dot: 'bg-red-500',    bg: 'bg-red-50    border-red-200',    text: 'text-red-700'   },
    info:   { dot: 'bg-blue-400',   bg: 'bg-blue-50   border-blue-200',   text: 'text-blue-700'  },
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-5">
      <h2 className="text-sm font-semibold text-gray-700 mb-3">Semáforo de ritmo de ejecución</h2>
      <div className="grid grid-cols-3 gap-3">
        {indicadores.map(ind => {
          const c = colores[ind.estado]
          return (
            <div key={ind.label} className={`rounded-lg border p-3 ${c.bg}`}>
              <div className="flex items-center gap-2 mb-1">
                <div className={`w-2 h-2 rounded-full shrink-0 ${c.dot}`} />
                <p className="text-xs font-semibold text-gray-500 uppercase">{ind.label}</p>
              </div>
              <p className={`text-2xl font-bold ${c.text}`}>{ind.valor}</p>
              <p className="text-xs text-gray-500 mt-0.5">{ind.desc}</p>
              <p className={`text-xs mt-1 font-medium ${c.text}`}>{ind.nota}</p>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Página principal ──────────────────────────────────────────────────────────
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
    <div className="space-y-5">

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
          className="text-sm bg-white border border-gray-300 px-4 py-2 rounded hover:bg-gray-50 text-gray-600"
        >
          ↻ Actualizar datos
        </button>
      </div>

      {/* Banner de desfase temporal */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-2.5 flex items-start gap-2 text-xs text-blue-700">
        <span className="mt-0.5 shrink-0">ℹ</span>
        <span>
          <strong>Fuentes de datos:</strong> Los datos de PIM, Certificación, Compromiso MEF, Devengado y Girado MEF
          provienen de la <strong>Consulta Amigable del MEF</strong> (actualización mensual · corte {mef.fecha_corte}).
          Los datos de Compromiso y Girado del dashboard provienen de{' '}
          <strong>Únete (tiempo real)</strong>. La diferencia entre ambas fuentes representa lo registrado
          después del último corte SIAF.
        </span>
      </div>

      {/* KPIs principales — fila única */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <KpiCard
          titulo="PIM Locadores 2026"
          valor={`S/ ${fmtM(mef.pim)}M`}
          sub={`PIA: S/ ${fmtM(mef.pia)}M`}
          fuente={`MEF · ${mef.fecha_corte}`}
          color="gray"
          grande
        />
        <KpiCard
          titulo="Comprometido"
          valor={`S/ ${fmtM(kpis.monto_armado)}M`}
          sub={`${Number(kpis.pct_compromiso_pim)}% del PIM · ${kpis.ordenes.toLocaleString()} órdenes`}
          fuente="Únete · tiempo real"
          color="blue"
          grande
        />
        <KpiCard
          titulo="Girado"
          valor={`S/ ${fmtM(kpis.monto_girado)}M`}
          sub={`${kpis.entregables_girados.toLocaleString()} entregables pagados`}
          fuente="Únete · tiempo real"
          color="green"
          grande
        />
        <KpiCard
          titulo="Saldo Libre"
          valor={`S/ ${fmtM(kpis.saldo_libre)}M`}
          sub={`PIM menos comprometido`}
          fuente="PIM MEF − Comprometido"
          color={kpis.saldo_libre > 0 ? 'indigo' : 'red'}
          grande
        />
        <KpiCard
          titulo="% Ejecución"
          valor={`${kpis.pct_ejecucion}%`}
          sub={`Girado / PIM · ${kpis.entregables_pendientes.toLocaleString()} entregables pendientes`}
          fuente="Girado Únete / PIM MEF"
          color={Number(kpis.pct_ejecucion) >= 20 ? 'green' : 'amber'}
          grande
        />
      </div>

      {/* KPIs MEF secundarios */}
      <div>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
          Cadena SIAF — MEF · Corte {mef.fecha_corte} · Específica: Locación de Servicios Persona Natural
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <KpiCard
            titulo="Certificación MEF"
            valor={`S/ ${fmtM(mef.certificacion)}M`}
            sub={`${((mef.certificacion / mef.pim) * 100).toFixed(1)}% del PIM`}
            fuente={`MEF · ${mef.fecha_corte}`}
            color="indigo"
          />
          <KpiCard
            titulo="Compromiso MEF"
            valor={`S/ ${fmtM(mef.compromiso)}M`}
            sub={`SIAF corte ${mef.fecha_corte}`}
            fuente={`MEF · ${mef.fecha_corte}`}
            color="blue"
          />
          <KpiCard
            titulo="Devengado MEF"
            valor={`S/ ${fmtM(mef.devengado)}M`}
            sub="Obligación reconocida"
            fuente={`MEF · ${mef.fecha_corte}`}
            color="blue"
          />
          <KpiCard
            titulo="Girado MEF"
            valor={`S/ ${fmtM(mef.girado)}M`}
            sub={`Avance ${((mef.girado / mef.pim) * 100).toFixed(1)}% del PIM`}
            fuente={`MEF · ${mef.fecha_corte}`}
            color="green"
          />
        </div>
      </div>

      {/* Semáforo */}
      <Semaforo kpis={kpis} />

      {/* Cadena presupuestal (funnel) */}
      <CadenaPresupuestal mef={mef} />

      {/* Gráfico */}
      <div className="bg-white rounded-lg border border-gray-200 p-5">
        <h2 className="text-sm font-semibold text-gray-700 mb-1">Top 15 proyectos — Compromiso Anual vs Girado</h2>
        <p className="text-xs text-gray-400 mb-4">Fuente: Únete · Datos en tiempo real</p>
        <ProyectosChart proyectos={proyectos} />
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-lg border border-gray-200 p-5">
        <h2 className="text-sm font-semibold text-gray-700 mb-4">Detalle por proyecto</h2>
        <TablaProyectos proyectos={proyectos} />
      </div>

    </div>
  )
}
