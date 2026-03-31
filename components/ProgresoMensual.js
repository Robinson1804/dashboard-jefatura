'use client'

const MESES_CORTO = ['', 'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
                     'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']

function colorBarra(pct) {
  if (pct >= 50) return '#15803D'
  if (pct >= 20) return '#D97706'
  return '#DC2626'
}

function fmtK(n) {
  if (n >= 1_000_000) return `S/ ${(n/1_000_000).toFixed(1)}M`
  if (n >= 1_000)     return `S/ ${(n/1_000).toFixed(0)}K`
  return `S/ ${n}`
}

export default function ProgresoMensual({ meses, mesSeleccionado }) {
  if (!meses || meses.length === 0) return null
  const mesActual = new Date().getMonth() + 1

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <p className="text-xs font-bold text-gray-600 uppercase tracking-wide mb-3">
        Avance ACM por mes — 2026
      </p>
      <div className="grid grid-cols-12 gap-1.5">
        {meses.map(m => {
          const esSeleccionado = m.mes === mesSeleccionado
          const esPasado       = m.mes < mesActual
          const esFuturo       = m.mes > mesActual
          const sinDatos       = m.acm === 0

          let bg     = 'bg-gray-50 border-gray-200'
          let textPct = ''
          let barColor = '#E5E7EB'
          let barWidth = 0

          if (esSeleccionado) {
            bg = 'bg-blue-50 border-blue-400 border-2'
          }

          if (sinDatos && !esFuturo) {
            textPct = 'Sin ACM'
          } else if (esFuturo && sinDatos) {
            textPct = 'Pendiente'
            barColor = '#E5E7EB'
          } else if (m.avance_pct !== null) {
            textPct = `${m.avance_pct}%`
            barColor = colorBarra(m.avance_pct)
            barWidth = Math.min(m.avance_pct, 100)
          }

          return (
            <div key={m.mes} className={`rounded border p-2 text-center ${bg}`}>
              <p className={`text-xs font-bold mb-1 ${esSeleccionado ? 'text-blue-700' : 'text-gray-500'}`}>
                {MESES_CORTO[m.mes]}
              </p>
              {/* Barra de progreso */}
              <div className="h-1.5 bg-gray-200 rounded-full mb-1 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{ width: `${barWidth}%`, backgroundColor: barColor }}
                />
              </div>
              {/* Porcentaje */}
              <p className={`text-xs font-bold leading-tight ${
                esFuturo && sinDatos ? 'text-gray-300' :
                sinDatos ? 'text-gray-400' :
                m.avance_pct >= 50 ? 'text-green-700' :
                m.avance_pct >= 20 ? 'text-amber-600' : 'text-red-600'
              }`}>
                {textPct}
              </p>
              {/* ACM amount (only past/current with data) */}
              {!esFuturo && m.acm > 0 && (
                <p className="text-[9px] text-gray-400 mt-0.5">{fmtK(m.acm)}</p>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
