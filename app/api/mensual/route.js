import { NextResponse } from 'next/server'
import { query } from '@/lib/db-pg'
import { getCached, setCached } from '@/lib/cache'

const NOMBRES_MES = ['','Enero','Febrero','Marzo','Abril','Mayo','Junio',
  'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const proyecto = searchParams.get('proyecto')

  const cacheKey = `mensual:${proyecto || 'todos'}`
  const cached = getCached(cacheKey)
  if (cached) return NextResponse.json(cached)

  try {
    const sql = proyecto
      ? `SELECT EXTRACT(MONTH FROM fec_inicio_ar)::int AS mes,
           COUNT(*) AS total_entregables,
           ROUND(SUM(monto_armada)::numeric,2) AS monto_armado,
           COUNT(CASE WHEN flag_girado=1 THEN 1 END) AS entregables_girados,
           ROUND(SUM(CASE WHEN flag_girado=1 THEN monto_girado ELSE 0 END)::numeric,2) AS monto_girado,
           COUNT(CASE WHEN flag_girado IS NULL THEN 1 END) AS entregables_pendientes
         FROM detalle_cache
         WHERE fec_inicio_ar IS NOT NULL AND proyecto = $1
         GROUP BY 1 ORDER BY 1`
      : `SELECT EXTRACT(MONTH FROM fec_inicio_ar)::int AS mes,
           COUNT(*) AS total_entregables,
           ROUND(SUM(monto_armada)::numeric,2) AS monto_armado,
           COUNT(CASE WHEN flag_girado=1 THEN 1 END) AS entregables_girados,
           ROUND(SUM(CASE WHEN flag_girado=1 THEN monto_girado ELSE 0 END)::numeric,2) AS monto_girado,
           COUNT(CASE WHEN flag_girado IS NULL THEN 1 END) AS entregables_pendientes
         FROM detalle_cache
         WHERE fec_inicio_ar IS NOT NULL
         GROUP BY 1 ORDER BY 1`

    const rows = proyecto ? await query(sql, [proyecto]) : await query(sql)
    const meses = rows.map(r => ({
      ...r,
      mes: Number(r.mes),
      nombre_mes: NOMBRES_MES[Number(r.mes)],
      monto_pendiente: Number(r.monto_armado) - Number(r.monto_girado),
      pct_avance: r.total_entregables > 0
        ? ((Number(r.entregables_girados) / Number(r.total_entregables)) * 100).toFixed(1)
        : '0.0',
    }))

    setCached(cacheKey, { meses })
    return NextResponse.json({ meses })
  } catch (error) {
    console.error('Error API mensual:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
