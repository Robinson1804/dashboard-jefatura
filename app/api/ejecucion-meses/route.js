import { NextResponse } from 'next/server'
import { query } from '@/lib/db-pg'
import { getCached, setCached } from '@/lib/cache'

const NOMBRES = ['', 'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
                 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']

export async function GET() {
  const cached = getCached('ejecucion_meses')
  if (cached) return NextResponse.json(cached)

  try {
    const rows = await query(`
      SELECT
        EXTRACT(MONTH FROM fec_inicio_ar)::int                              AS mes,
        SUM(monto_armada)                                                   AS acm,
        SUM(CASE WHEN flag_girado = 1 THEN monto_girado ELSE 0 END)        AS girado,
        COUNT(*)                                                            AS entregables_acm,
        COUNT(CASE WHEN flag_girado = 1 THEN 1 END)                        AS entregables_girados,
        COUNT(CASE WHEN flag_girado IS NULL THEN 1 END)                     AS entregables_pendientes
      FROM detalle_cache
      WHERE fec_inicio_ar IS NOT NULL
      GROUP BY EXTRACT(MONTH FROM fec_inicio_ar)
      ORDER BY mes
    `)

    // Crear array de 12 meses, rellenando con 0 los que no tienen datos
    const porMes = {}
    for (const r of rows) {
      porMes[r.mes] = {
        mes:                    r.mes,
        nombre:                 NOMBRES[r.mes],
        acm:                    Number(r.acm),
        girado:                 Number(r.girado),
        entregables_acm:        Number(r.entregables_acm),
        entregables_girados:    Number(r.entregables_girados),
        entregables_pendientes: Number(r.entregables_pendientes),
        avance_pct:             Number(r.acm) > 0
                                  ? Number(((Number(r.girado) / Number(r.acm)) * 100).toFixed(1))
                                  : null,
      }
    }

    const meses = Array.from({ length: 12 }, (_, i) => {
      const m = i + 1
      return porMes[m] ?? {
        mes: m, nombre: NOMBRES[m],
        acm: 0, girado: 0,
        entregables_acm: 0, entregables_girados: 0, entregables_pendientes: 0,
        avance_pct: null,
      }
    })

    const result = { meses }
    setCached('ejecucion_meses', result)
    return NextResponse.json(result)
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
