'use client'
import { useState, useEffect } from 'react'
import KpiCard from '@/components/KpiCard'
import ProyectosChart from '@/components/ProyectosChart'
import TablaProyectos from '@/components/TablaProyectos'
import LoadingSpinner from '@/components/LoadingSpinner'

function fmt(num) {
  return Number(num).toLocaleString('es-PE', { minimumFractionDigits: 2 })
}

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
      const resumen = await res.json()
      setData(resumen)
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
      <button onClick={cargarDatos} className="bg-red-600 text-white px-4 py-2 rounded text-sm hover:bg-red-700">
        Reintentar
      </button>
    </div>
  )

  const { kpis, proyectos } = data

  return (
    <div className="space-y-6">

      {/* Cabecera */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-800">Resumen de Ejecución Presupuestal</h1>
          <p className="text-sm text-gray-500 mt-0.5">Locadores — Año fiscal 2026 · {proyectos.length} proyectos · {kpis.proveedores.toLocaleString()} proveedores</p>
        </div>
        <button
          onClick={() => cargarDatos(true)}
          className="text-sm bg-white border border-gray-300 px-4 py-2 rounded hover:bg-gray-50 text-gray-600"
        >
          ↻ Actualizar datos
        </button>
      </div>

      {/* KPIs — fila 1: MEF */}
      <div>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Presupuesto institucional INEI · MEF ({kpis.fecha_consulta_mef})</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <KpiCard titulo="PIM Total INEI" valor={`S/ ${fmt(kpis.pim_total)}`} subtitulo="Presupuesto Modificado" color="gray" />
          <KpiCard titulo="Devengado MEF" valor={`S/ ${fmt(kpis.devengado_mef)}`} subtitulo="Reconocido como obligación" color="blue" />
          <KpiCard titulo="Girado MEF" valor={`S/ ${fmt(kpis.girado_mef)}`} subtitulo="Pago efectivo realizado" color="green" />
          <KpiCard titulo="Avance MEF" valor={`${kpis.avance_mef}%`} subtitulo="Devengado / PIM" color={kpis.avance_mef >= 30 ? 'green' : 'amber'} />
        </div>
      </div>

      {/* KPIs — fila 2: Locadores */}
      <div>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Locadores (Sistema Únete) · datos en tiempo real</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <KpiCard titulo="Compromiso Anual" valor={`S/ ${fmt(kpis.monto_armado)}`} subtitulo={`${kpis.ordenes.toLocaleString()} órdenes de servicio`} color="blue" />
          <KpiCard titulo="Girado" valor={`S/ ${fmt(kpis.monto_girado)}`} subtitulo={`${kpis.entregables_girados.toLocaleString()} entregables pagados`} color="green" />
          <KpiCard titulo="Saldo por Girar" valor={`S/ ${fmt(kpis.monto_armado - kpis.monto_girado)}`} subtitulo={`${kpis.entregables_pendientes.toLocaleString()} entregables pendientes`} color="amber" />
          <KpiCard titulo="Avance de Giro" valor={`${kpis.pct_avance_locadores}%`} subtitulo="Girado / Comprometido" color={Number(kpis.pct_avance_locadores) >= 50 ? 'green' : 'amber'} />
        </div>
      </div>

      {/* Gráfico */}
      <div className="bg-white rounded-lg border border-gray-200 p-5">
        <h2 className="text-sm font-semibold text-gray-700 mb-4">Top 15 proyectos — Compromiso Anual vs Girado (por código de meta)</h2>
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
