'use client'
import {
  BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, ReferenceLine
} from 'recharts'

function formatMiles(value) {
  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`
  if (value >= 1000) return `${(value / 1000).toFixed(0)}K`
  return value
}

export default function MensualChart({ meses, onMesClick, mesSeleccionado }) {
  const MES_ACTUAL = new Date().getMonth() + 1

  const data = meses.map(m => ({
    mes: m.nombre_mes.slice(0, 3),
    mesNum: m.mes,
    girado: Number(m.monto_girado),
    pendiente: Number(m.monto_pendiente),
    esFuturo: m.mes > MES_ACTUAL,
  }))

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null
    const girado = payload.find(p => p.dataKey === 'girado')?.value || 0
    const pendiente = payload.find(p => p.dataKey === 'pendiente')?.value || 0
    const total = girado + pendiente
    return (
      <div className="bg-white border border-gray-200 rounded p-3 shadow text-xs">
        <p className="font-semibold mb-1">{label}</p>
        <p className="text-green-600">Girado: S/ {girado.toLocaleString('es-PE', { minimumFractionDigits: 0 })}</p>
        <p className="text-gray-500">Pendiente: S/ {pendiente.toLocaleString('es-PE', { minimumFractionDigits: 0 })}</p>
        <p className="text-gray-700 font-medium border-t mt-1 pt-1">Total: S/ {total.toLocaleString('es-PE', { minimumFractionDigits: 0 })}</p>
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data} margin={{ left: 10, right: 10, top: 5, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
        <YAxis tickFormatter={formatMiles} tick={{ fontSize: 11 }} />
        <Tooltip content={<CustomTooltip />} />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <ReferenceLine x="Mar" stroke="#F59E0B" strokeDasharray="4 4" label={{ value: 'Hoy', fontSize: 10, fill: '#F59E0B' }} />
        <Bar dataKey="girado" name="Girado" stackId="a" onClick={(d) => onMesClick && onMesClick(d.mesNum)} style={{ cursor: 'pointer' }}>
          {data.map((entry, index) => (
            <Cell key={index} fill={entry.mesNum === mesSeleccionado ? '#15803D' : '#16A34A'} fillOpacity={entry.mesNum === mesSeleccionado ? 1 : 0.85} />
          ))}
        </Bar>
        <Bar dataKey="pendiente" name="Pendiente" stackId="a" radius={[3, 3, 0, 0]} onClick={(d) => onMesClick && onMesClick(d.mesNum)} style={{ cursor: 'pointer' }}>
          {data.map((entry, index) => (
            <Cell key={index} fill={entry.mesNum === mesSeleccionado ? '#9CA3AF' : '#D1D5DB'} fillOpacity={entry.mesNum === mesSeleccionado ? 1 : 0.85} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
