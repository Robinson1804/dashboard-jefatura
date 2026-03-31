'use client'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, LabelList
} from 'recharts'

const ES_ODEI = n => /estadistica.*departamental/i.test(n)

function formatMiles(value) {
  if (value >= 1_000_000) return `S/ ${(value / 1_000_000).toFixed(1)}M`
  if (value >= 1_000)     return `S/ ${(value / 1_000).toFixed(0)}K`
  return `S/ ${value}`
}

// Nombre corto para el eje Y
function shortName(proyecto) {
  return proyecto
    .replace(/^ENCUESTA\s+(PERMANENTE\s+DE\s+)?/i, 'Enc. ')
    .replace(/^IMPLEMENTACIÓN\s+DEL?\s+SISTEMA\s+(DE\s+)?/i, 'Impl. ')
    .replace(/^CENSOS\s+NACIONALES:.*/i, 'Censos Nacionales')
    .replace(/^PROGRAMA\s+/i, 'Prog. ')
    .replace(/^INDICADORES\s+/i, 'Ind. ')
    .replace(/^ELABORACION\s+(DE\s+LAS?\s+)?/i, 'Elab. ')
    .replace(/^CONDUCCIÓN\s+DE\s+LÍNEAS\s+/i, 'Cond. Líneas ')
    .replace(/^PLANEAMIENTO,\s+/i, 'Planeam., ')
    .slice(0, 26)
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  const armado = payload.find(p => p.dataKey === 'armado')?.value ?? 0
  const girado = payload.find(p => p.dataKey === 'girado')?.value ?? 0
  const pct    = armado > 0 ? ((girado / armado) * 100).toFixed(1) : '0.0'
  const fullName = payload[0]?.payload?.fullName ?? label
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-3 shadow-lg text-xs max-w-[280px]">
      <p className="font-bold text-gray-700 mb-2 leading-snug">{fullName}</p>
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

function PctLabel({ x, y, width, height, value }) {
  if (!value || value <= 0 || width < 28) return null
  return (
    <text x={x + width - 4} y={y + height / 2 + 4} fill="white" textAnchor="end" fontSize={10} fontWeight="bold">
      {value}%
    </text>
  )
}

export default function ProyectosChart({ proyectos }) {
  // Separar ODEIS y agruparlas en una sola entrada
  const odeis  = proyectos.filter(p =>  ES_ODEI(p.PROYECTO))
  const otros  = proyectos.filter(p => !ES_ODEI(p.PROYECTO))

  const odeiAgrupado = odeis.length > 0 ? {
    PROYECTO: `ODEIS — Oficinas Departamentales (${odeis.length} regiones)`,
    codi_Meta: 'ODEIS',
    monto_armado: odeis.reduce((s, p) => s + Number(p.monto_armado), 0),
    monto_girado: odeis.reduce((s, p) => s + Number(p.monto_girado), 0),
  } : null

  const todos = odeiAgrupado ? [...otros, odeiAgrupado] : otros

  const data = todos
    .sort((a, b) => Number(b.monto_armado) - Number(a.monto_armado))
    .slice(0, 15)
    .map(p => {
      const armado = Number(p.monto_armado)
      const girado = Number(p.monto_girado)
      const pct    = armado > 0 ? Number(((girado / armado) * 100).toFixed(1)) : 0
      const isOdei = ES_ODEI(p.PROYECTO) || p.codi_Meta === 'ODEIS'
      return {
        name:     isOdei ? 'ODEIS (26 regiones)' : shortName(p.PROYECTO),
        fullName: p.PROYECTO,
        armado,
        girado,
        pct,
      }
    })

  return (
    <ResponsiveContainer width="100%" height={420}>
      <BarChart data={data} layout="vertical" margin={{ left: 8, right: 55, top: 5, bottom: 5 }} barGap={3}>
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
          width={175}
          tick={{ fontSize: 10.5, fill: '#374151' }}
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
