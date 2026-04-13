'use client'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, LabelList
} from 'recharts'

const ES_ODEI = n => /estadistica.*departamental/i.test(n)

function formatMiles(value) {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`
  if (value >= 1_000)     return `${(value / 1_000).toFixed(0)}K`
  return `${value}`
}

function shortName(proyecto) {
  return proyecto
    .replace(/^ENCUESTA\s+(PERMANENTE\s+DE\s+EMPLEO\s+NACIONAL)/i, 'Enc. Empleo Nacional')
    .replace(/^ENCUESTA\s+(NACIONAL\s+DE\s+HOGARES)/i, 'Enc. Nacional de Hogares')
    .replace(/^ENCUESTA\s+(DEMOGRAFICA.*)/i, 'Enc. Demográfica y Salud Familiar')
    .replace(/^ENCUESTA\s+(NACIONAL\s+AGROPECUARIA)/i, 'Enc. Nacional Agropecuaria')
    .replace(/^ENCUESTA\s+(DE\s+EMPRESAS.*)/i, 'Enc. Empresas y Establecimientos')
    .replace(/^ENCUESTA\s+/i, 'Enc. ')
    .replace(/^IMPLEMENTACIÓN\s+DEL\s+SISTEMA\s+DE\s+/i, 'Impl. ')
    .replace(/^CENSOS\s+NACIONALES:.*/i, 'Censos Nacionales')
    .replace(/^ENAPRES-.*/i, 'ENAPRES')
    .replace(/^INDICADORES\s+COYUNTURALES/i, 'Ind. Coyunturales')
    .replace(/^NUEVO\s+AÑO\s+BASE\s+DE\s+LAS\s+CUENTAS.*/i, 'Nuevo Año Base CCNN')
    .replace(/^ELABORACION\s+DE\s+LAS\s+CUENTAS.*/i, 'Elab. Cuentas Nacionales')
    .replace(/^MARCOS\s+MUESTRALES.*/i, 'Marcos Muestrales y Cart.')
    .replace(/^ESTUDIOS\s+DEMOGRAFICOS.*/i, 'Estudios Demográficos')
    .replace(/^CONSERVACION\s+Y\s+MANTENIMIENTO/i, 'Conservación y Mant.')
    .replace(/^ADMINISTRACIÓN\s+GENERAL/i, 'Administración General')
    .replace(/^CONDUCCIÓN\s+DE\s+LÍNEAS.*/i, 'Cond. Líneas de Política')
    .replace(/^PLANEAMIENTO,.*/i, 'Planeamiento y Presupuesto')
    .replace(/^DIFUSION\s+Y\s+COMUNICACIONES/i, 'Difusión y Comunicaciones')
    .replace(/^ELABORACION\s+Y\s+PROMOCION.*/i, 'Elab. e Invest. Estadíst.')
    .slice(0, 28)
}

function CustomTooltip({ active, payload }) {
  if (!active || !payload?.length) return null
  const armado  = payload.find(p => p.dataKey === 'armado')?.value  ?? 0
  const girado  = payload.find(p => p.dataKey === 'girado')?.value  ?? 0
  const pct     = armado > 0 ? ((girado / armado) * 100).toFixed(1) : '0.0'
  const nombre  = payload[0]?.payload?.fullName ?? ''
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-3 shadow-xl text-xs max-w-[260px]">
      <p className="font-bold text-gray-800 mb-2 leading-snug">{nombre}</p>
      <div className="space-y-1.5">
        <div className="flex justify-between gap-6">
          <span className="text-gray-500">Compromiso:</span>
          <span className="font-semibold text-blue-700">S/ {formatMiles(armado)}</span>
        </div>
        <div className="flex justify-between gap-6">
          <span className="text-gray-500">Girado:</span>
          <span className="font-semibold text-emerald-700">S/ {formatMiles(girado)}</span>
        </div>
        <div className="flex justify-between gap-6 pt-1.5 border-t border-gray-100">
          <span className="text-gray-500">Avance:</span>
          <span className={`font-bold text-sm ${Number(pct) >= 50 ? 'text-emerald-600' : Number(pct) >= 20 ? 'text-amber-600' : 'text-red-500'}`}>
            {pct}%
          </span>
        </div>
      </div>
    </div>
  )
}

// Tick personalizado para Y-axis — texto a la derecha, alineado
function CustomYTick({ x, y, payload }) {
  const name = payload.value ?? ''
  return (
    <g transform={`translate(${x},${y})`}>
      <text
        x={-6} y={0} dy={4}
        textAnchor="end"
        fill="#374151"
        fontSize={11}
        fontFamily="system-ui, sans-serif"
      >
        {name}
      </text>
    </g>
  )
}

// Label del % fuera de la barra girado (a la derecha)
function PctLabel({ x, y, width, height, value }) {
  if (!value || value <= 0) return null
  const inside = width > 36
  return (
    <text
      x={inside ? x + width - 5 : x + width + 5}
      y={y + height / 2 + 4}
      fill={inside ? 'white' : '#059669'}
      textAnchor={inside ? 'end' : 'start'}
      fontSize={10}
      fontWeight="bold"
    >
      {value}%
    </text>
  )
}

export default function ProyectosChart({ proyectos }) {
  const odeis = proyectos.filter(p =>  ES_ODEI(p.PROYECTO))
  const otros  = proyectos.filter(p => !ES_ODEI(p.PROYECTO))

  const odeiRow = odeis.length > 0 ? {
    PROYECTO:    `ODEIS — Oficinas Departamentales (${odeis.length} regiones)`,
    codi_Meta:   'ODEIS',
    monto_armado: odeis.reduce((s, p) => s + Number(p.monto_armado), 0),
    monto_girado: odeis.reduce((s, p) => s + Number(p.monto_girado), 0),
  } : null

  const todos = odeiRow ? [...otros, odeiRow] : otros

  const data = todos
    .sort((a, b) => Number(b.monto_armado) - Number(a.monto_armado))
    .slice(0, 15)
    .map(p => {
      const armado = Number(p.monto_armado)
      const girado = Number(p.monto_girado)
      const pct    = armado > 0 ? Number(((girado / armado) * 100).toFixed(1)) : 0
      const isOdei = ES_ODEI(p.PROYECTO) || p.codi_Meta === 'ODEIS'
      return {
        name:     isOdei ? `ODEIS (${odeis.length} regiones)` : shortName(p.PROYECTO),
        fullName: p.PROYECTO,
        armado,
        girado,
        pct,
        isOdei,
      }
    })

  // Altura dinámica: 40px por barra + espacio para ejes
  const chartHeight = data.length * 40 + 40

  return (
    <ResponsiveContainer width="100%" height={chartHeight}>
      <BarChart
        data={data}
        layout="vertical"
        margin={{ left: 12, right: 60, top: 4, bottom: 4 }}
        barCategoryGap="28%"
        barGap={3}
      >
        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#F1F5F9" />
        <XAxis
          type="number"
          tickFormatter={v => `S/ ${formatMiles(v)}`}
          tick={{ fontSize: 11, fill: '#94A3B8' }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          type="category"
          dataKey="name"
          width={182}
          tick={<CustomYTick />}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: '#F8FAFC', rx: 4 }} />
        <Bar
          dataKey="armado"
          name="Compromiso Anual"
          fill="#BFDBFE"
          radius={[0, 3, 3, 0]}
          maxBarSize={14}
        >
          {data.map((entry, i) => (
            <Cell key={i} fill={entry.isOdei ? '#C7D2FE' : '#BFDBFE'} />
          ))}
        </Bar>
        <Bar
          dataKey="girado"
          name="Girado"
          radius={[0, 3, 3, 0]}
          maxBarSize={14}
        >
          {data.map((entry, i) => (
            <Cell key={i} fill={entry.isOdei ? '#6366F1' : '#10B981'} />
          ))}
          <LabelList content={<PctLabel />} dataKey="pct" />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
