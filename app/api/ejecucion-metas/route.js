import { NextResponse } from 'next/server'
import { query } from '@/lib/db-pg'
import { getCached, setCached } from '@/lib/cache'
import { getPiaPim } from '@/lib/pia-pim'

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const mes = Number(searchParams.get('mes') || new Date().getMonth() + 1)

  const cacheKey = `ejecucion_metas:${mes}`
  const cached = getCached(cacheKey)
  if (cached) return NextResponse.json(cached)

  try {
    const rows = await query(`
      SELECT
        proyecto,
        codi_meta,
        SUM(monto_armada)                                                              AS certificacion,
        SUM(CASE WHEN EXTRACT(MONTH FROM fec_inicio_ar) = $1 THEN monto_armada ELSE 0 END) AS acm,
        SUM(CASE WHEN codestado = 88 AND flag_girado IS NULL THEN monto_armada ELSE 0 END)  AS devengado,
        SUM(CASE WHEN flag_girado = 1 THEN monto_girado ELSE 0 END)                    AS girado,
        COUNT(*)                                                                        AS total_entregables,
        COUNT(CASE WHEN flag_girado = 1 THEN 1 END)                                    AS entregables_girados,
        COUNT(CASE WHEN codestado = 88 AND flag_girado IS NULL THEN 1 END)              AS entregables_devengados,
        COUNT(CASE WHEN EXTRACT(MONTH FROM fec_inicio_ar) = $1 THEN 1 END)             AS entregables_acm
      FROM detalle_cache
      GROUP BY proyecto, codi_meta
      ORDER BY codi_meta, proyecto
    `, [mes])

    const metas = rows.map(r => {
      const piaPim = getPiaPim(r.proyecto)
      return {
        proyecto:              r.proyecto,
        codi_meta:             r.codi_meta,
        pia:                   piaPim?.pia ?? null,
        pim:                   piaPim?.pim ?? null,
        certificacion:         Number(r.certificacion),
        acm:                   Number(r.acm),
        devengado:             Number(r.devengado),
        girado:                Number(r.girado),
        total_entregables:     Number(r.total_entregables),
        entregables_girados:   Number(r.entregables_girados),
        entregables_devengados:Number(r.entregables_devengados),
        entregables_acm:       Number(r.entregables_acm),
      }
    })

    const totales = metas.reduce((acc, m) => ({
      certificacion: acc.certificacion + m.certificacion,
      acm:           acc.acm           + m.acm,
      devengado:     acc.devengado      + m.devengado,
      girado:        acc.girado         + m.girado,
    }), { certificacion: 0, acm: 0, devengado: 0, girado: 0 })

    const result = { mes, metas, totales }
    setCached(cacheKey, result)
    return NextResponse.json(result)
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
