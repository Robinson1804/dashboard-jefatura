'use client'

function fmt(n) {
  if (n >= 1_000_000) return `S/ ${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000)     return `S/ ${(n / 1_000).toFixed(0)}K`
  return `S/ ${n}`
}
function fmtFull(n) {
  return `S/ ${Number(n).toLocaleString('es-PE', { minimumFractionDigits: 2 })}`
}

const PASOS = [
  { key: 'pim',           label: 'PIM',          color: '#1B3A6B', bg: '#EFF6FF' },
  { key: 'certificacion', label: 'Certificado',   color: '#6D28D9', bg: '#F5F3FF' },
  { key: 'compromiso',    label: 'Comprom. MEF',  color: '#1D4ED8', bg: '#EFF6FF' },
  { key: 'devengado',     label: 'Devengado',     color: '#0F766E', bg: '#F0FDFA' },
  { key: 'girado',        label: 'Girado MEF',    color: '#15803D', bg: '#F0FDF4' },
]

export default function CadenaPresupuestal({ mef }) {
  if (!mef) return null
  const base = mef.pim

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-5">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h2 className="text-sm font-semibold text-gray-700">Cadena Presupuestal — Flujo del dinero</h2>
          <p className="text-xs text-gray-400 mt-0.5">
            Específica: Locación de Servicios por Persona Natural (Contratación de Servicios) · MEF · Corte: {mef.fecha_corte}
          </p>
        </div>
      </div>

      {/* Funnel horizontal */}
      <div className="space-y-2.5">
        {PASOS.map((paso, i) => {
          const valor = mef[paso.key]
          const pct = base > 0 ? (valor / base) * 100 : 0
          return (
            <div key={paso.key} className="flex items-center gap-3">
              {/* Etiqueta + monto */}
              <div className="w-36 shrink-0 text-right">
                <p className="text-xs font-semibold text-gray-500 uppercase">{paso.label}</p>
                <p className="text-sm font-bold" style={{ color: paso.color }}>{fmt(valor)}</p>
              </div>

              {/* Flecha */}
              {i > 0 && (
                <span className="text-gray-300 text-xs shrink-0">▶</span>
              )}

              {/* Barra */}
              <div className="flex-1 h-8 bg-gray-100 rounded overflow-hidden relative">
                <div
                  className="h-full rounded flex items-center px-2 transition-all"
                  style={{ width: `${Math.max(pct, 2)}%`, backgroundColor: paso.color, opacity: 0.85 }}
                >
                  <span className="text-white text-xs font-bold whitespace-nowrap">
                    {pct.toFixed(1)}%
                  </span>
                </div>
              </div>

              {/* Monto completo en tooltip-like */}
              <div className="w-36 shrink-0 text-left">
                <p className="text-xs text-gray-400 font-mono">{fmtFull(valor)}</p>
              </div>
            </div>
          )
        })}
      </div>

      {/* Interpretación */}
      <div className="mt-4 pt-3 border-t border-gray-100 grid grid-cols-3 gap-3 text-xs text-gray-500">
        <div>
          <span className="font-semibold text-purple-700">Brecha certificación:</span>{' '}
          {fmtFull(mef.pim - mef.certificacion)} sin certificar aún
        </div>
        <div>
          <span className="font-semibold text-blue-700">Brecha compromiso:</span>{' '}
          {fmtFull(mef.certificacion - mef.compromiso)} certificado no comprometido
        </div>
        <div>
          <span className="font-semibold text-amber-700">Pendiente de giro (MEF):</span>{' '}
          {fmtFull(mef.compromiso - mef.girado)} comprometido sin girar
        </div>
      </div>
    </div>
  )
}
