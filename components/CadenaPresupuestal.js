'use client'

function fmt(n) {
  if (n >= 1_000_000) return `S/ ${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000)     return `S/ ${(n / 1_000).toFixed(0)}K`
  return `S/ ${n}`
}
function fmtFull(n) {
  return Number(n).toLocaleString('es-PE', { minimumFractionDigits: 2 })
}

const PASOS = [
  { key: 'pim',           label: 'PIM',          color: '#1B3A6B', esUnete: false },
  { key: 'certificacion', label: 'Certificado',  color: '#6D28D9', esUnete: false },
  { key: 'monto_armado',  label: 'Comprometido', color: '#1D4ED8', esUnete: true  },
  { key: 'devengado',     label: 'Devengado',    color: '#0F766E', esUnete: false },
  { key: 'monto_girado',  label: 'Girado',       color: '#15803D', esUnete: true  },
]

export default function CadenaPresupuestal({ mef, unete }) {
  if (!mef || !unete) return null
  const base = mef.pim

  const valores = {
    pim:           mef.pim,
    certificacion: mef.certificacion,
    monto_armado:  unete.monto_armado,
    devengado:     mef.devengado,
    monto_girado:  unete.monto_girado,
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-3">
      <p className="text-xs font-bold text-gray-700 mb-0.5">Cadena Presupuestal</p>
      <p className="text-[10px] text-gray-400 mb-3">Flujo del dinero — Locadores 2026</p>

      <div className="space-y-3">
        {PASOS.map((paso) => {
          const valor = valores[paso.key]
          const pct = base > 0 ? (valor / base) * 100 : 0
          return (
            <div key={paso.key}>
              {/* Etiqueta + badge fuente + monto */}
              <div className="flex items-baseline justify-between mb-0.5">
                <div className="flex items-center gap-1">
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-tight">{paso.label}</span>
                  <span className={`text-[8px] font-semibold px-1 py-px rounded leading-none ${
                    paso.esUnete ? 'bg-blue-50 text-blue-500' : 'bg-gray-100 text-gray-400'
                  }`}>
                    {paso.esUnete ? 'Únete' : 'MEF'}
                  </span>
                </div>
                <span className="text-[11px] font-bold" style={{ color: paso.color }}>{fmt(valor)}</span>
              </div>

              {/* Barra */}
              <div className="h-5 bg-gray-100 rounded overflow-hidden">
                <div
                  className="h-full flex items-center px-1.5 rounded"
                  style={{
                    width: `${Math.max(pct, 2)}%`,
                    backgroundColor: paso.color,
                    opacity: paso.esUnete ? 1 : 0.8,
                  }}
                >
                  <span className="text-white text-[10px] font-bold whitespace-nowrap">{pct.toFixed(1)}%</span>
                </div>
              </div>

              {/* Monto completo */}
              <p className="text-[9px] text-gray-400 font-mono text-right mt-0.5">S/ {fmtFull(valor)}</p>
            </div>
          )
        })}
      </div>

      {/* Brechas */}
      <div className="mt-3 pt-2 border-t border-gray-100 space-y-1">
        <p className="text-[10px] text-purple-700">
          <span className="font-semibold">Sin certificar:</span>{' '}
          S/ {fmtFull(mef.pim - mef.certificacion)}
        </p>
        <p className="text-[10px] text-amber-700">
          <span className="font-semibold">Comprometido s/girar:</span>{' '}
          S/ {fmtFull(unete.monto_armado - unete.monto_girado)}
        </p>
      </div>
    </div>
  )
}
