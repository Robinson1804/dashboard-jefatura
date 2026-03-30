'use client'
import { useState, useEffect } from 'react'
import TablaOrdenes from '@/components/TablaOrdenes'
import TablaOdeis from '@/components/TablaOdeis'
import LoadingSpinner from '@/components/LoadingSpinner'
import ProyectoSelector, { GRUPO_ODEIS } from '@/components/ProyectoSelector'

function esGrupoOdeis(valor) {
  return valor === GRUPO_ODEIS
}

function fmt(num) {
  return Number(num).toLocaleString('es-PE', { minimumFractionDigits: 2 })
}

export default function DetallePage() {
  const [proyectos, setProyectos] = useState([])
  const [proyectoSel, setProyectoSel] = useState('')
  const [data, setData] = useState(null)
  const [dataOdeis, setDataOdeis] = useState(null)
  const [modoOdeis, setModoOdeis] = useState(false)
  const [loading, setLoading] = useState(false)
  const [loadingProyectos, setLoadingProyectos] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetch('/api/proyectos')
      .then(r => r.json())
      .then(d => setProyectos(d.proyectos || []))
      .catch(() => {})
      .finally(() => setLoadingProyectos(false))
  }, [])

  const cargarDetalle = async (proyecto) => {
    if (!proyecto) return
    setLoading(true)
    setError(null)
    setData(null)
    setDataOdeis(null)

    const esOdeis = esGrupoOdeis(proyecto)
    setModoOdeis(esOdeis)

    try {
      if (esOdeis) {
        // Carga vista agrupada por ODEI
        const res = await fetch('/api/detalle-odeis')
        if (!res.ok) throw new Error('Error al consultar el servidor')
        const json = await res.json()
        setDataOdeis(json)
      } else {
        const res = await fetch(`/api/detalle?proyecto=${encodeURIComponent(proyecto)}`)
        if (!res.ok) throw new Error('Error al consultar el servidor')
        const json = await res.json()
        setData(json)
      }
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  const handleSelect = (valor) => {
    setProyectoSel(valor)
    cargarDetalle(valor)
  }

  const resumen = data?.ordenes ? {
    ordenes: data.ordenes.length,
    proveedores: new Set(data.ordenes.map(o => o.RUC)).size,
    monto_total: data.ordenes.reduce((a, o) => a + Number(o.monto_total), 0),
    monto_girado: data.ordenes.reduce((a, o) => a + Number(o.monto_girado), 0),
  } : dataOdeis?.odeis ? {
    ordenes: dataOdeis.odeis.reduce((a, o) => a + o.num_ordenes, 0),
    proveedores: dataOdeis.odeis.reduce((a, o) => a + o.num_ordenes, 0), // aproximado: 1 orden = 1 locador
    monto_total: dataOdeis.odeis.reduce((a, o) => a + o.monto_total, 0),
    monto_girado: dataOdeis.odeis.reduce((a, o) => a + o.monto_girado, 0),
  } : null

  return (
    <div className="space-y-6">

      <div>
        <h1 className="text-xl font-bold text-gray-800">Detalle por Proyecto</h1>
        <p className="text-sm text-gray-500 mt-0.5">Órdenes de servicio y entregables por locador</p>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-5">
        <label className="block text-sm font-semibold text-gray-700 mb-2">Seleccionar proyecto</label>
        {loadingProyectos ? (
          <p className="text-sm text-gray-400">Cargando proyectos...</p>
        ) : (
          <ProyectoSelector proyectos={proyectos} valor={proyectoSel} onChange={handleSelect} />
        )}
      </div>

      {loading && <LoadingSpinner mensaje="Cargando órdenes del proyecto..." />}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded p-4 text-red-700 text-sm">
          {error} — <button onClick={() => cargarDetalle(proyectoSel)} className="underline">Reintentar</button>
        </div>
      )}

      {resumen && !loading && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Órdenes</p>
              <p className="text-2xl font-bold text-blue-700">{resumen.ordenes}</p>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <p className="text-xs text-gray-500 uppercase font-semibold mb-1">{modoOdeis ? 'ODEIs' : 'Proveedores'}</p>
              <p className="text-2xl font-bold text-blue-700">{modoOdeis ? dataOdeis.odeis.length : resumen.proveedores}</p>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Compromiso Anual (S/)</p>
              <p className="text-xl font-bold text-blue-700">{fmt(resumen.monto_total)}</p>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Girado (S/)</p>
              <p className="text-xl font-bold text-green-700">{fmt(resumen.monto_girado)}</p>
              <p className="text-xs text-gray-400 mt-0.5">
                {resumen.monto_total > 0 ? ((resumen.monto_girado / resumen.monto_total) * 100).toFixed(1) : '0'}% de avance
              </p>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-5">
            {modoOdeis ? (
              <>
                <h2 className="text-sm font-semibold text-gray-700 mb-4">
                  Oficinas Departamentales (ODEIs) — <span className="font-normal text-gray-500">clic en una fila para ver locadores</span>
                </h2>
                <TablaOdeis odeis={dataOdeis.odeis} />
              </>
            ) : (
              <>
                <h2 className="text-sm font-semibold text-gray-700 mb-4">
                  Órdenes de servicio — <span className="font-normal text-gray-500">clic en una fila para ver entregables</span>
                </h2>
                <TablaOrdenes
                  ordenes={data.ordenes}
                  entregablesPorOrden={data.entregables_por_orden}
                />
              </>
            )}
          </div>
        </>
      )}

      {!proyectoSel && !loading && (
        <div className="text-center py-16 text-gray-400">
          <p className="text-4xl mb-3">📋</p>
          <p className="text-sm">Seleccione un proyecto para ver sus órdenes y entregables</p>
        </div>
      )}

    </div>
  )
}
