'use client'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts'

function formatMiles(value) {
  if (value >= 1000000) return `S/ ${(value / 1000000).toFixed(1)}M`
  if (value >= 1000) return `S/ ${(value / 1000).toFixed(0)}K`
  return `S/ ${value}`
}

function formatTooltip(value) {
  return `S/ ${Number(value).toLocaleString('es-PE', { minimumFractionDigits: 2 })}`
}

export default function ProyectosChart({ proyectos }) {
  const data = proyectos.slice(0, 15).map(p => ({
    name: p.codi_Meta,
    proyecto: p.PROYECTO,
    armado: Number(p.monto_armado),
    girado: Number(p.monto_girado),
  }))

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null
    const item = data.find(d => d.name === label)
    return (
      <div className="bg-white border border-gray-200 rounded p-3 shadow text-xs max-w-xs">
        <p className="font-semibold text-gray-700 mb-1 leading-tight">{item?.proyecto}</p>
        <p className="text-blue-600">Comprometido: {formatTooltip(payload[0]?.value)}</p>
        <p className="text-green-600">Girado: {formatTooltip(payload[1]?.value)}</p>
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={400}>
      <BarChart data={data} layout="vertical" margin={{ left: 10, right: 30, top: 5, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" horizontal={false} />
        <XAxis type="number" tickFormatter={formatMiles} tick={{ fontSize: 11 }} />
        <YAxis type="category" dataKey="name" width={48} tick={{ fontSize: 11 }} />
        <Tooltip content={<CustomTooltip />} />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Bar dataKey="armado" name="Compromiso Anual" fill="#2563EB" radius={[0, 3, 3, 0]} />
        <Bar dataKey="girado" name="Monto Girado" fill="#16A34A" radius={[0, 3, 3, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}
