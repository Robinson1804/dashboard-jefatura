'use client'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer, LabelList
} from 'recharts'

const MESES_CORTO = ['', 'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
                     'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']

function fmtMillones(v) {
  return `S/ ${(v / 1_000_000).toFixed(2)}M`
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  const acm    = payload.find(p => p.dataKey === 'ACM')?.value    ?? 0
  const girado = payload.find(p => p.dataKey === 'Girado')?.value ?? 0
  const pct    = acm > 0 ? ((girado / acm) * 100).toFixed(1) : '0.0'
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3 text-sm">
      <p className="font-bold text-gray-700 mb-2">{label}</p>
      <p style={{ color: '#93C5FD' }} className="text-sm">ACM: {fmtMillones(acm)}</p>
      <p style={{ color: '#16A34A' }} className="text-sm">Girado: {fmtMillones(girado)}</p>
      <p className="text-xs text-gray-500 mt-1 pt-1 border-t border-gray-100 font-semibold">
        Avance: {pct}%
      </p>
    </div>
  )
}

function PctLabel({ x, y, width, height, value }) {
  if (!value || value <= 0 || height < 14) return null
  return (
    <text
      x={x + width / 2}
      y={y + height / 2 + 4}
      fill="white"
      textAnchor="middle"
      fontSize={10}
      fontWeight="bold"
    >
      {value}%
    </text>
  )
}

export default function EjecucionChart({ meses, titulo }) {
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
      <p className="text-xs font-bold text-gray-600 uppercase tracking-wide mb-0.5">
        {titulo || 'Distribución mensual — ACM vs Girado'}
      </p>
      <p className="text-xs text-gray-400 mb-4">Montos en millones de soles · Porcentaje sobre ACM del mes</p>
      <ResponsiveContainer width="100%" height={260}>
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
            formatter={v => <span style={{ color: '#6B7280' }}>{v}</span>}
          />
          <Bar dataKey="ACM" fill="#BFDBFE" radius={[3,3,0,0]} maxBarSize={44} />
          <Bar dataKey="Girado" fill="#16A34A" radius={[3,3,0,0]} maxBarSize={44}>
            <LabelList content={<PctLabel />} dataKey="pct" />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
