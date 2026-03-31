'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

function fmt(num) {
  return Number(num).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function fmtM(n) {
  if (n >= 1_000_000) return `S/ ${(n / 1_000_000).toFixed(2)}M`
  if (n >= 1_000)     return `S/ ${(n / 1_000).toFixed(0)}K`
  return `S/ ${n.toFixed(0)}`
}

const ES_ODEI = p => /estadistica.*departamental/i.test(p.PROYECTO)

function PctBadge({ pct }) {
  const n = Number(pct)
  const cls = n >= 50 ? 'text-green-600' : n >= 20 ? 'text-amber-600' : 'text-red-600'
  return <span className={`font-semibold ${cls}`}>{pct}%</span>
}

export default function TablaProyectos({ proyectos }) {
  const router = useRouter()
  const [orden, setOrden] = useState({ campo: 'codi_Meta', asc: true })
  const [busqueda, setBusqueda] = useState('')
  const [odeiExpanded, setOdeiExpanded] = useState(false)

  // Separar ODEIS del resto
  const odeis  = proyectos.filter(p =>  ES_ODEI(p))
  const otros  = proyectos.filter(p => !ES_ODEI(p))

  // Fila agregada de ODEIS
  const odeiRow = odeis.length > 0 ? {
    PROYECTO:               `OFICINAS DEPARTAMENTALES — ODEIS (${odeis.length} regiones)`,
    codi_Meta:              'ODEIS',
    ordenes:                odeis.reduce((s, p) => s + p.ordenes, 0),
    proveedores:            odeis.reduce((s, p) => s + p.proveedores, 0),
    monto_armado:           odeis.reduce((s, p) => s + p.monto_armado, 0),
    monto_girado:           odeis.reduce((s, p) => s + p.monto_girado, 0),
    entregables_pendientes: odeis.reduce((s, p) => s + p.entregables_pendientes, 0),
    _isOdeiGroup: true,
  } : null

  // Ordenar y filtrar "otros"
  const datosFiltrados = [...otros]
    .filter(p => p.PROYECTO.toLowerCase().includes(busqueda.toLowerCase()))
    .sort((a, b) => {
      if (orden.campo === 'codi_Meta') {
        const cmp = String(a.codi_Meta).localeCompare(String(b.codi_Meta))
        return orden.asc ? cmp : -cmp
      }
      const va = Number(a[orden.campo]) || 0
      const vb = Number(b[orden.campo]) || 0
      return orden.asc ? va - vb : vb - va
    })

  // Insertar fila ODEIS ordenada por monto (entre los otros)
  const datosFinales = odeiRow
    ? [...datosFiltrados, odeiRow].sort((a, b) => {
        if (orden.campo === 'monto_armado' || orden.campo === 'monto_girado') {
          return orden.asc
            ? Number(a[orden.campo]) - Number(b[orden.campo])
            : Number(b[orden.campo]) - Number(a[orden.campo])
        }
        if (a._isOdeiGroup) return 1
        if (b._isOdeiGroup) return -1
        return 0
      })
    : datosFiltrados

  const toggleOrden = (campo) => {
    setOrden(prev => ({ campo, asc: prev.campo === campo ? !prev.asc : false }))
  }

  const irAEjecucion = (proyecto) => {
    router.push(`/ejecucion?proyecto=${encodeURIComponent(proyecto)}`)
  }

  const Th = ({ campo, label }) => (
    <th
      onClick={() => toggleOrden(campo)}
      className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide cursor-pointer hover:text-gray-700 select-none whitespace-nowrap"
    >
      {label} {orden.campo === campo ? (orden.asc ? '↑' : '↓') : ''}
    </th>
  )

  return (
    <div>
      <div className="mb-3">
        <input
          type="text"
          placeholder="Buscar proyecto..."
          value={busqueda}
          onChange={e => setBusqueda(e.target.value)}
          className="border border-gray-300 rounded px-3 py-2 text-sm w-72 focus:outline-none focus:ring-2 focus:ring-blue-300"
        />
      </div>
      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="w-full text-sm">
          <thead className="bg-gray-100 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase w-16">Meta</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Proyecto</th>
              <Th campo="ordenes" label="Órdenes" />
              <Th campo="proveedores" label="Proveed." />
              <Th campo="monto_armado" label="Comprometido (S/)" />
              <Th campo="monto_girado" label="Girado (S/)" />
              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">% Avance</th>
              <Th campo="entregables_pendientes" label="Pendientes" />
            </tr>
          </thead>
          <tbody>
            {datosFinales.map((p, i) => {
              const pct    = p.monto_armado > 0 ? ((p.monto_girado / p.monto_armado) * 100).toFixed(1) : '0.0'
              const isOdei = p._isOdeiGroup

              return (
                <>
                  <tr
                    key={p.codi_Meta}
                    onClick={() => isOdei ? setOdeiExpanded(v => !v) : irAEjecucion(p.PROYECTO)}
                    className={`cursor-pointer border-b border-gray-100 transition-colors ${
                      isOdei
                        ? 'bg-indigo-50 hover:bg-indigo-100'
                        : i % 2 === 0 ? 'bg-white hover:bg-blue-50' : 'bg-gray-50 hover:bg-blue-50'
                    }`}
                  >
                    <td className="px-4 py-2.5 font-mono text-xs text-gray-500 font-bold">
                      {isOdei ? (odeiExpanded ? '▼' : '▶') + ' ODEIS' : p.codi_Meta}
                    </td>
                    <td className="px-4 py-2.5 max-w-xs">
                      <span
                        className={`text-xs block leading-snug ${isOdei ? 'font-semibold text-indigo-700' : 'text-gray-800'}`}
                        title={p.PROYECTO}
                      >
                        {p.PROYECTO.length > 55 ? p.PROYECTO.slice(0, 53) + '…' : p.PROYECTO}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-right text-gray-600">{p.ordenes}</td>
                    <td className="px-4 py-2.5 text-right text-gray-600">{p.proveedores}</td>
                    <td className="px-4 py-2.5 text-right font-mono text-gray-700">{fmt(p.monto_armado)}</td>
                    <td className="px-4 py-2.5 text-right font-mono text-green-700">{fmt(p.monto_girado)}</td>
                    <td className="px-4 py-2.5 text-right"><PctBadge pct={pct} /></td>
                    <td className="px-4 py-2.5 text-right text-gray-500">{p.entregables_pendientes}</td>
                  </tr>

                  {/* Sub-filas ODEIS expandidas */}
                  {isOdei && odeiExpanded && odeis.map((odei, j) => {
                    const opct = odei.monto_armado > 0
                      ? ((odei.monto_girado / odei.monto_armado) * 100).toFixed(1) : '0.0'
                    const region = odei.PROYECTO
                      .replace(/estadisticas?\s+departamentale?s?\s*/i, '')
                      .replace(/^-\s*/, '')
                      .trim() || odei.PROYECTO
                    return (
                      <tr
                        key={odei.codi_Meta}
                        onClick={() => irAEjecucion(odei.PROYECTO)}
                        className="border-b border-indigo-100 bg-indigo-50/40 hover:bg-indigo-100/60 cursor-pointer"
                      >
                        <td className="pl-10 pr-4 py-2 font-mono text-xs text-indigo-400">{odei.codi_Meta}</td>
                        <td className="px-4 py-2 text-xs text-indigo-700 font-medium">
                          {region.length > 0 ? region : odei.PROYECTO}
                        </td>
                        <td className="px-4 py-2 text-right text-xs text-gray-500">{odei.ordenes}</td>
                        <td className="px-4 py-2 text-right text-xs text-gray-500">{odei.proveedores}</td>
                        <td className="px-4 py-2 text-right text-xs font-mono text-gray-600">{fmtM(odei.monto_armado)}</td>
                        <td className="px-4 py-2 text-right text-xs font-mono text-green-600">{fmtM(odei.monto_girado)}</td>
                        <td className="px-4 py-2 text-right text-xs"><PctBadge pct={opct} /></td>
                        <td className="px-4 py-2 text-right text-xs text-gray-400">{odei.entregables_pendientes}</td>
                      </tr>
                    )
                  })}
                </>
              )
            })}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-gray-400 mt-2">{datosFinales.length} proyectos{odeis.length > 0 ? ` (${odeis.length} ODEIS agrupadas)` : ''}</p>
    </div>
  )
}
