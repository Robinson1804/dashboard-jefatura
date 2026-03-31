'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

function fmt(num) {
  return Number(num).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export default function TablaProyectos({ proyectos }) {
  const router = useRouter()
  const [orden, setOrden] = useState({ campo: 'codi_Meta', asc: true })
  const [busqueda, setBusqueda] = useState('')

  const datos = [...proyectos]
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

  const toggleOrden = (campo) => {
    setOrden(prev => ({ campo, asc: prev.campo === campo ? !prev.asc : false }))
  }

  const Th = ({ campo, label }) => (
    <th
      onClick={() => toggleOrden(campo)}
      className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide cursor-pointer hover:text-gray-700 select-none whitespace-nowrap"
    >
      {label} {orden.campo === campo ? (orden.asc ? '↑' : '↓') : ''}
    </th>
  )

  const irAEjecucion = (proyecto) => {
    router.push(`/ejecucion?proyecto=${encodeURIComponent(proyecto)}`)
  }

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <input
          type="text"
          placeholder="Buscar proyecto..."
          value={busqueda}
          onChange={e => setBusqueda(e.target.value)}
          className="border border-gray-300 rounded px-3 py-2 text-sm w-72 focus:outline-none focus:ring-2 focus:ring-blue-300"
        />
        <p className="text-xs text-gray-400">Clic en fila para ver ejecución mensual</p>
      </div>
      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="w-full text-sm">
          <thead className="bg-gray-100 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Meta</th>
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
            {datos.map((p, i) => {
              const pct    = p.monto_armado > 0 ? ((p.monto_girado / p.monto_armado) * 100).toFixed(1) : '0.0'
              const pctNum = Number(pct)
              return (
                <tr
                  key={p.codi_Meta}
                  onClick={() => irAEjecucion(p.PROYECTO)}
                  className={`cursor-pointer transition-colors hover:bg-blue-50 ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}
                  title={`Ver ejecución mensual de "${p.PROYECTO}"`}
                >
                  <td className="px-4 py-2 font-mono text-xs text-gray-500">{p.codi_Meta}</td>
                  <td className="px-4 py-2 text-xs max-w-xs">
                    <span className="truncate block max-w-[240px]" title={p.PROYECTO}>{p.PROYECTO}</span>
                    <span className="text-[10px] text-blue-400 font-medium">→ ver ejecución</span>
                  </td>
                  <td className="px-4 py-2 text-right">{p.ordenes}</td>
                  <td className="px-4 py-2 text-right">{p.proveedores}</td>
                  <td className="px-4 py-2 text-right font-mono">{fmt(p.monto_armado)}</td>
                  <td className="px-4 py-2 text-right font-mono text-green-700">{fmt(p.monto_girado)}</td>
                  <td className="px-4 py-2 text-right">
                    <span className={`font-semibold ${pctNum >= 50 ? 'text-green-600' : pctNum >= 20 ? 'text-amber-600' : 'text-red-600'}`}>
                      {pct}%
                    </span>
                  </td>
                  <td className="px-4 py-2 text-right text-gray-500">{p.entregables_pendientes}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-gray-400 mt-2">{datos.length} proyectos</p>
    </div>
  )
}
