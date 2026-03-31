'use client'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer, Cell
} from 'recharts'

const MESES_CORTO = ['', 'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
                     'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']

function fmtMillones(v) {
  return `S/ ${(v / 1_000_000).toFixed(2)}M`
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3 text-sm">
      <p className="font-bold text-gray-700 mb-2">{label}</p>
      {payload.map(p => (
        <p key={p.name} style={{ color: p.color }} className="text-sm">
          {p.name}: {fmtMillones(p.value)}
        </p>
      ))}
      {payload.length === 2 && payload[0].value > 0 && (
        <p className="text-xs text-gray-500 mt-1 pt-1 border-t border-gray-100">
          Avance: {((payload[1].value / payload[0].value) * 100).toFixed(1)}%
        </p>
      )}
    </div>
  )
}

export default function EjecucionChart({ meses }) {
  if (!meses) return null

  const data = meses
    .filter(m => m.acm > 0)
    .map(m => ({
      mes:    MESES_CORTO[m.mes],
      ACM:    m.acm,
      Girado: m.girado,
      pct:    m.avance_pct,
    }))

  if (data.length === 0) return (
    <div className="text-center text-gray-400 text-sm py-8">Sin datos para mostrar</div>
  )

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <p className="text-xs font-bold text-gray-600 uppercase tracking-wide mb-1">
        Distribucion mensual — ACM vs Girado
      </p>
      <p className="text-xs text-gray-400 mb-4">Montos en millones de soles · Fuente: Unete</p>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} margin={{ top: 5, right: 20, left: 10, bottom: 5 }} barGap={2}>
          <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
          <XAxis dataKey="mes" tick={{ fontSize: 12, fill: '#6B7280' }} axisLine={false} tickLine={false} />
          <YAxis
            tickFormatter={v => `S/${(v/1_000_000).toFixed(1)}M`}
            tick={{ fontSize: 11, fill: '#9CA3AF' }}
            axisLine={false} tickLine={false}
            width={70}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }}
            formatter={v => <span className="text-gray-600">{v}</span>}
          />
          <Bar dataKey="ACM" fill="#93C5FD" radius={[3,3,0,0]} maxBarSize={40} />
          <Bar dataKey="Girado" fill="#16A34A" radius={[3,3,0,0]} maxBarSize={40} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
