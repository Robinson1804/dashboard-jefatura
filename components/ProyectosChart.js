'use client'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, LabelList
} from 'recharts'

function formatMiles(value) {
  if (value >= 1_000_000) return `S/ ${(value / 1_000_000).toFixed(1)}M`
  if (value >= 1_000)     return `S/ ${(value / 1_000).toFixed(0)}K`
  return `S/ ${value}`
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  const armado = payload.find(p => p.dataKey === 'armado')?.value ?? 0
  const girado = payload.find(p => p.dataKey === 'girado')?.value ?? 0
  const pct    = armado > 0 ? ((girado / armado) * 100).toFixed(1) : '0.0'
  const nombre = payload[0]?.payload?.proyecto ?? label
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-3 shadow-lg text-xs max-w-[260px]">
      <p className="font-bold text-gray-700 mb-2 leading-snug">{nombre}</p>
      <div className="space-y-1">
        <div className="flex justify-between gap-4">
          <span className="text-gray-500">Compromiso:</span>
          <span className="font-semibold text-blue-700">{formatMiles(armado)}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-gray-500">Girado:</span>
          <span className="font-semibold text-green-700">{formatMiles(girado)}</span>
        </div>
        <div className="flex justify-between gap-4 pt-1 border-t border-gray-100">
          <span className="text-gray-500">Avance:</span>
          <span className={`font-bold ${Number(pct) >= 50 ? 'text-green-700' : Number(pct) >= 20 ? 'text-amber-700' : 'text-red-600'}`}>
            {pct}%
          </span>
        </div>
      </div>
    </div>
  )
}

export default function ProyectosChart({ proyectos }) {
  const data = proyectos.slice(0, 15).map(p => {
    const armado = Number(p.monto_armado)
    const girado = Number(p.monto_girado)
    const pct    = armado > 0 ? Number(((girado / armado) * 100).toFixed(1)) : 0
    return {
      name:     p.codi_Meta,
      proyecto: p.PROYECTO,
      armado,
      girado,
      pct,
    }
  })

  const PctLabel = ({ x, y, width, height, value }) => {
    if (!value || value <= 0 || width < 30) return null
    return (
      <text x={x + width - 4} y={y + height / 2 + 4} fill="white" textAnchor="end" fontSize={10} fontWeight="bold">
        {value}%
      </text>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={420}>
      <BarChart data={data} layout="vertical" margin={{ left: 8, right: 50, top: 5, bottom: 5 }} barGap={3}>
        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#F3F4F6" />
        <XAxis
          type="number"
          tickFormatter={formatMiles}
          tick={{ fontSize: 11, fill: '#9CA3AF' }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          type="category"
          dataKey="name"
          width={50}
          tick={{ fontSize: 11, fill: '#6B7280', fontWeight: 600 }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: '#F9FAFB' }} />
        <Bar dataKey="armado" name="Compromiso Anual" fill="#BFDBFE" radius={[0, 3, 3, 0]} maxBarSize={18} />
        <Bar dataKey="girado" name="Girado" fill="#16A34A" radius={[0, 3, 3, 0]} maxBarSize={18}>
          <LabelList content={<PctLabel />} dataKey="pct" />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
