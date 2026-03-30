import { NextResponse } from 'next/server'
import { query } from '@/lib/db-pg'
import { getCached, setCached } from '@/lib/cache'

export async function GET() {
  const cached = getCached('alertas')
  if (cached) return NextResponse.json(cached)

  try {
    const conteos = await query(`
      SELECT
        COUNT(CASE WHEN (fecha_fin::date - CURRENT_DATE) < 0  AND flag_girado IS NULL THEN 1 END) AS vencidos,
        COUNT(CASE WHEN (fecha_fin::date - CURRENT_DATE) BETWEEN 0 AND 30  AND flag_girado IS NULL THEN 1 END) AS proximos_30,
        COUNT(CASE WHEN (fecha_fin::date - CURRENT_DATE) BETWEEN 31 AND 60 AND flag_girado IS NULL THEN 1 END) AS proximos_60
      FROM detalle_cache
      WHERE fecha_fin IS NOT NULL
    `)

    const detalle30 = await query(`
      SELECT proyecto, codi_meta, nro_orden, proveedor,
        TO_CHAR(fecha_fin, 'DD/MM/YYYY') AS fecha_fin,
        (fecha_fin::date - CURRENT_DATE) AS dias_restantes
      FROM detalle_cache
      WHERE (fecha_fin::date - CURRENT_DATE) BETWEEN 0 AND 30
        AND flag_girado IS NULL
      ORDER BY fecha_fin LIMIT 50
    `)

    const responseData = { conteos: conteos[0], detalle_30dias: detalle30 }
    setCached('alertas', responseData, 30)
    return NextResponse.json(responseData)
  } catch (error) {
    console.error('Error API alertas:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
