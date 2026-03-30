export default function AlertasBadge({ conteos }) {
  if (!conteos) return null
  return (
    <div className="flex flex-wrap gap-3">
      <span className="inline-flex items-center gap-2 bg-red-100 text-red-700 text-sm font-semibold px-4 py-2 rounded-full">
        <span className="w-2 h-2 bg-red-600 rounded-full" />
        {conteos.vencidos} contratos vencidos
      </span>
      <span className="inline-flex items-center gap-2 bg-amber-100 text-amber-700 text-sm font-semibold px-4 py-2 rounded-full">
        <span className="w-2 h-2 bg-amber-500 rounded-full" />
        {conteos.vencen_30} vencen en 30 días
      </span>
      <span className="inline-flex items-center gap-2 bg-yellow-100 text-yellow-700 text-sm font-semibold px-4 py-2 rounded-full">
        <span className="w-2 h-2 bg-yellow-400 rounded-full" />
        {conteos.vencen_60} vencen en 31-60 días
      </span>
    </div>
  )
}
