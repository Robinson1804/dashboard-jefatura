'use client'
import { useState, useEffect } from 'react'
import MensualChart from '@/components/MensualChart'
import TablaMensual from '@/components/TablaMensual'
import MesDrillDown from '@/components/MesDrillDown'
import LoadingSpinner from '@/components/LoadingSpinner'
import ProyectoSelector from '@/components/ProyectoSelector'

const NOMBRES_MES = ['', 'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']

function fmt(num) {
  return Number(num).toLocaleString('es-PE', { minimumFractionDigits: 2 })
}

export default function MensualPage() {
  const [data, setData] = useState(null)
  const [proyectos, setProyectos] = useState([])
  const [proyectoSel, setProyectoSel] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const [mesSel, setMesSel] = useState(null)
  const [drillData, setDrillData] = useState(null)
  const [loadingDrill, setLoadingDrill] = useState(false)

  useEffect(() => {
    fetch('/api/proyectos')
      .then(r => r.json())
      .then(d => setProyectos(d.proyectos || []))
      .catch(() => {})
  }, [])

  const cargarDatos = async () => {
    setLoading(true)
    setError(null)
    try {
      const url = proyectoSel ? `/api/mensual?proyecto=${encodeURIComponent(proyectoSel)}` : '/api/mensual'
      const res = await fetch(url)
      if (!res.ok) throw new Error('Error al consultar el servidor')
      const json = await res.json()
      setData(json)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    cargarDatos()
    // Al cambiar proyecto, cerrar drill-down
    setMesSel(null)
    setDrillData(null)
  }, [proyectoSel])

  const handleMesClick = async (mes) => {
    // Si ya está seleccionado, cerrar
    if (mes === mesSel) {
      setMesSel(null)
      setDrillData(null)
      return
    }
    setMesSel(mes)
    setLoadingDrill(true)
    try {
      const params = new URLSearchParams({ mes })
      if (proyectoSel) params.set('proyecto', proyectoSel)
      const res = await fetch(`/api/mensual/detalle?${params}`)
      if (!res.ok) throw new Error('Error al cargar detalle')
      const json = await res.json()
      setDrillData(json)
    } catch (e) {
      setDrillData(null)
    } finally {
      setLoadingDrill(false)
    }
  }

  // Totales: si hay mes seleccionado usar drillData, si no usar totales anuales
  const totalArmado = mesSel && drillData
    ? drillData.totales.monto
    : data?.meses?.reduce((a, m) => a + Number(m.monto_armado), 0) || 0
  const totalGirado = mesSel && drillData
    ? drillData.totales.girado
    : data?.meses?.reduce((a, m) => a + Number(m.monto_girado), 0) || 0

  const labelProgramado = mesSel ? `Comprometido en ${NOMBRES_MES[mesSel]}` : 'Compromiso Anual'
  const labelGirado = mesSel ? `Girado en ${NOMBRES_MES[mesSel]}` : 'Total Girado'
  const labelPorGirar = mesSel ? `Saldo por Girar en ${NOMBRES_MES[mesSel]}` : 'Saldo por Girar'

  return (
    <div className="space-y-6">

      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-800">Ejecución Mensual 2026</h1>
          <p className="text-sm text-gray-500 mt-0.5">Distribución de entregables y montos por mes</p>
        </div>
        <div className="flex items-center gap-3">
          {mesSel && (
            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded font-semibold">
              {NOMBRES_MES[mesSel]} seleccionado
            </span>
          )}
          <ProyectoSelector proyectos={proyectos} valor={proyectoSel} onChange={setProyectoSel} />
        </div>
      </div>

      {loading && <LoadingSpinner />}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded p-4 text-red-700 text-sm">
          {error} — <button onClick={cargarDatos} className="underline">Reintentar</button>
        </div>
      )}

      {data && !loading && (
        <>
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <p className="text-xs text-gray-500 uppercase font-semibold mb-1">{labelProgramado}</p>
              <p className="text-xl font-bold text-blue-700">S/ {fmt(totalArmado)}</p>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <p className="text-xs text-gray-500 uppercase font-semibold mb-1">{labelGirado}</p>
              <p className="text-xl font-bold text-green-700">S/ {fmt(totalGirado)}</p>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <p className="text-xs text-gray-500 uppercase font-semibold mb-1">{labelPorGirar}</p>
              <p className="text-xl font-bold text-amber-600">S/ {fmt(totalArmado - totalGirado)}</p>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-5">
            <h2 className="text-sm font-semibold text-gray-700 mb-4">
              Distribución mensual — Girado vs Pendiente
              {proyectoSel && <span className="ml-2 text-blue-600 font-normal">({proyectoSel.slice(0, 40)}...)</span>}
            </h2>
            <MensualChart meses={data.meses} onMesClick={handleMesClick} mesSeleccionado={mesSel} />
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-5">
            <h2 className="text-sm font-semibold text-gray-700 mb-4">Detalle mensual</h2>
            <TablaMensual meses={data.meses} onMesClick={handleMesClick} mesSeleccionado={mesSel} />
          </div>

          {loadingDrill && (
            <div className="text-center py-4 text-sm text-gray-500">Cargando detalle del mes...</div>
          )}

          {mesSel && drillData && !loadingDrill && (
            <MesDrillDown
              mes={mesSel}
              data={drillData}
              onCerrar={() => { setMesSel(null); setDrillData(null) }}
            />
          )}
        </>
      )}
    </div>
  )
}
