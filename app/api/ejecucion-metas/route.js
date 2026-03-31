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
        -- Compromiso anual: todos los entregables del año
        SUM(monto_armada)                                                                       AS certificacion,
        -- ACM: entregables cuyo inicio cae en el mes seleccionado
        SUM(CASE WHEN EXTRACT(MONTH FROM fec_inicio_ar) = $1 THEN monto_armada ELSE 0 END)     AS acm,
        -- Devengado: en tesorería CODESTADO=88, aún no girado
        SUM(CASE WHEN codestado = 88 AND flag_girado IS NULL THEN monto_armada ELSE 0 END)      AS devengado,
        -- Girado del mes: solo ACM de ese mes que ya fueron girados
        SUM(CASE WHEN EXTRACT(MONTH FROM fec_inicio_ar) = $1
                  AND flag_girado = 1 THEN monto_girado ELSE 0 END)                             AS girado,
        -- Girado anual acumulado (para KPI resumen)
        SUM(CASE WHEN flag_girado = 1 THEN monto_girado ELSE 0 END)                             AS girado_anual,
        COUNT(*)                                                                                 AS total_entregables,
        -- Conteos del mes
        COUNT(CASE WHEN EXTRACT(MONTH FROM fec_inicio_ar) = $1 THEN 1 END)                     AS entregables_acm,
        COUNT(CASE WHEN EXTRACT(MONTH FROM fec_inicio_ar) = $1
                    AND flag_girado = 1 THEN 1 END)                                             AS entregables_girados,
        COUNT(CASE WHEN EXTRACT(MONTH FROM fec_inicio_ar) = $1
                    AND flag_girado IS NULL THEN 1 END)                                         AS entregables_pendientes,
        COUNT(CASE WHEN codestado = 88 AND flag_girado IS NULL THEN 1 END)                      AS entregables_devengados
      FROM detalle_cache
      GROUP BY proyecto, codi_meta
      ORDER BY codi_meta, proyecto
    `, [mes])

    const metas = rows.map(r => {
      const piaPim = getPiaPim(r.proyecto)
      return {
        proyecto:               r.proyecto,
        codi_meta:              r.codi_meta,
        pia:                    piaPim?.pia ?? null,
        pim:                    piaPim?.pim ?? null,
        certificacion:          Number(r.certificacion),
        acm:                    Number(r.acm),
        devengado:              Number(r.devengado),
        girado:                 Number(r.girado),       // solo del mes
        girado_anual:           Number(r.girado_anual), // acumulado año
        total_entregables:      Number(r.total_entregables),
        entregables_acm:        Number(r.entregables_acm),
        entregables_girados:    Number(r.entregables_girados),    // girados del mes
        entregables_pendientes: Number(r.entregables_pendientes), // pendientes del mes
        entregables_devengados: Number(r.entregables_devengados),
      }
    })

    const totales = metas.reduce((acc, m) => ({
      certificacion: acc.certificacion + m.certificacion,
      acm:           acc.acm           + m.acm,
      devengado:     acc.devengado      + m.devengado,
      girado:        acc.girado         + m.girado,
      girado_anual:  acc.girado_anual   + m.girado_anual,
    }), { certificacion: 0, acm: 0, devengado: 0, girado: 0, girado_anual: 0 })

    const result = { mes, metas, totales }
    setCached(cacheKey, result)
    return NextResponse.json(result)
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
