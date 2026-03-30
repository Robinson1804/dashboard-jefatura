export default function KpiCard({ titulo, valor, subtitulo, color = 'blue', prefijo = '' }) {
  const colores = {
    blue: 'border-blue-500 text-blue-700',
    green: 'border-green-500 text-green-700',
    amber: 'border-amber-500 text-amber-700',
    red: 'border-red-500 text-red-700',
    gray: 'border-gray-400 text-gray-600',
  }

  return (
    <div className={`bg-white rounded-lg shadow-sm border-l-4 p-5 ${colores[color]}`}>
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1">{titulo}</p>
      <p className={`text-2xl font-bold money ${colores[color].split(' ')[1]}`}>
        {prefijo}{valor}
      </p>
      {subtitulo && <p className="text-xs text-gray-400 mt-1">{subtitulo}</p>}
    </div>
  )
}
