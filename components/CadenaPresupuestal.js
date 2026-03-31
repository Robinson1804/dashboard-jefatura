'use client'

function fmt(n) {
  if (n >= 1_000_000) return `S/ ${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000)     return `S/ ${(n / 1_000).toFixed(0)}K`
  return `S/ ${n}`
}
function fmtFull(n) {
  return `S/ ${Number(n).toLocaleString('es-PE', { minimumFractionDigits: 2 })}`
}

// Pasos: los que tienen fuente 'unete' usan datos en tiempo real del dashboard
const PASOS = [
  { key: 'pim',           label: 'PIM',           color: '#1B3A6B', fuente: 'MEF',   fuenteKey: 'mef' },
  { key: 'certificacion', label: 'Certificado',   color: '#6D28D9', fuente: 'MEF',   fuenteKey: 'mef' },
  { key: 'monto_armado',  label: 'Comprometido',  color: '#1D4ED8', fuente: 'Únete', fuenteKey: 'unete' },
  { key: 'devengado',     label: 'Devengado',     color: '#0F766E', fuente: 'MEF',   fuenteKey: 'mef' },
  { key: 'monto_girado',  label: 'Girado',        color: '#15803D', fuente: 'Únete', fuenteKey: 'unete' },
]

export default function CadenaPresupuestal({ mef, unete }) {
  if (!mef || !unete) return null
  const base = mef.pim

  // Fusionar datos: MEF para los campos del MEF, Únete para los de tiempo real
  const valores = {
    pim:           mef.pim,
    certificacion: mef.certificacion,
    monto_armado:  unete.monto_armado,
    devengado:     mef.devengado,
    monto_girado:  unete.monto_girado,
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-5 h-full">
      <div className="mb-4">
        <h2 className="text-sm font-semibold text-gray-700">Cadena Presupuestal</h2>
        <p className="text-xs text-gray-400 mt-0.5">Flujo del dinero — Locadores 2026</p>
      </div>

      {/* Funnel */}
      <div className="space-y-2">
        {PASOS.map((paso) => {
          const valor = valores[paso.key]
          const pct = base > 0 ? (valor / base) * 100 : 0
          const esUnete = paso.fuenteKey === 'unete'
          return (
            <div key={paso.key} className="flex items-center gap-2">
              {/* Etiqueta */}
              <div className="w-28 shrink-0 text-right">
                <p className="text-[11px] font-semibold text-gray-500 uppercase leading-none">{paso.label}</p>
                <p className="text-sm font-bold mt-0.5" style={{ color: paso.color }}>{fmt(valor)}</p>
                <span className={`text-[9px] font-semibold px-1 py-0.5 rounded leading-none inline-block mt-0.5 ${
                  esUnete ? 'bg-blue-50 text-blue-500' : 'bg-gray-100 text-gray-400'
                }`}>
                  {esUnete ? 'Únete' : 'MEF'}
                </span>
              </div>

              {/* Barra */}
              <div className="flex-1 h-7 bg-gray-100 rounded overflow-hidden">
                <div
                  className="h-full rounded flex items-center px-2"
                  style={{ width: `${Math.max(pct, 1.5)}%`, backgroundColor: paso.color, opacity: esUnete ? 1 : 0.75 }}
                >
                  <span className="text-white text-[11px] font-bold whitespace-nowrap">
                    {pct.toFixed(1)}%
                  </span>
                </div>
              </div>

              {/* Monto completo */}
              <div className="w-28 shrink-0">
                <p className="text-[10px] text-gray-400 font-mono">{fmtFull(valor)}</p>
              </div>
            </div>
          )
        })}
      </div>

      {/* Brechas */}
      <div className="mt-4 pt-3 border-t border-gray-100 space-y-1 text-[11px] text-gray-500">
        <div className="flex justify-between">
          <span><span className="font-semibold text-purple-700">Sin certificar:</span> {fmtFull(mef.pim - mef.certificacion)}</span>
          <span><span className="font-semibold text-amber-700">Comprometido s/girar:</span> {fmtFull(unete.monto_armado - unete.monto_girado)}</span>
        </div>
      </div>
    </div>
  )
}
