import { NextResponse } from 'next/server'
import { query } from '@/lib/db-pg'
import { getCached, setCached } from '@/lib/cache'

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const proyecto = searchParams.get('proyecto')

  if (!proyecto) return NextResponse.json({ error: 'Parámetro proyecto requerido' }, { status: 400 })

  const cacheKey = `detalle:${proyecto}`
  const cached = getCached(cacheKey)
  if (cached) return NextResponse.json(cached)

  try {
    const rows = await query(`
      SELECT nro_orden, proveedor, ruc,
        TO_CHAR(fecha_inicio, 'DD/MM/YYYY') AS fecha_inicio,
        TO_CHAR(fecha_fin,    'DD/MM/YYYY') AS fecha_fin,
        estado_contrato AS "ESTADO_CONTRATO",
        (fecha_fin::date - CURRENT_DATE)    AS dias_fin,
        n_entregable,
        TO_CHAR(fec_inicio_ar, 'DD/MM/YYYY') AS fecha_inicio_ar,
        TO_CHAR(fec_fin_ar,    'DD/MM/YYYY') AS fecha_fin_ar,
        monto_armada,
        flag_girado  AS "FLAG_GIRADO",
        monto_girado AS monto_girado_ent,
        TO_CHAR(fecha_girado, 'DD/MM/YYYY') AS fecha_girado
      FROM detalle_cache
      WHERE proyecto = $1
      ORDER BY proveedor, nro_orden, CAST(n_entregable AS INT)
    `, [proyecto])

    const ordenesMap = new Map()
    const entregablesPorOrden = {}

    for (const r of rows) {
      const key = r.nro_orden
      if (!ordenesMap.has(key)) {
        ordenesMap.set(key, {
          NRO_ORDEN: key, PROVEEDOR: r.proveedor, RUC: r.ruc,
          fecha_inicio: r.fecha_inicio, fecha_fin: r.fecha_fin,
          ESTADO_CONTRATO: r.ESTADO_CONTRATO, dias_fin: r.dias_fin,
          monto_total: 0, num_entregables: 0, entregables_girados: 0, monto_girado: 0,
        })
        entregablesPorOrden[key] = []
      }
      const o = ordenesMap.get(key)
      o.monto_total += Number(r.monto_armada)
      o.num_entregables += 1
      if (r.FLAG_GIRADO === 1) { o.entregables_girados += 1; o.monto_girado += Number(r.monto_girado_ent) }
      entregablesPorOrden[key].push({
        N_ENTREGABLE: r.n_entregable,
        fecha_inicio_ar: r.fecha_inicio_ar, fecha_fin_ar: r.fecha_fin_ar,
        monto_armada: Number(r.monto_armada),
        FLAG_GIRADO: r.FLAG_GIRADO,
        monto_girado: Number(r.monto_girado_ent),
        fecha_girado: r.fecha_girado,
      })
    }

    const ordenes = Array.from(ordenesMap.values()).map(o => ({
      ...o,
      monto_total:  Math.round(o.monto_total  * 100) / 100,
      monto_girado: Math.round(o.monto_girado * 100) / 100,
    }))

    const responseData = { proyecto, ordenes, entregables_por_orden: entregablesPorOrden }
    setCached(cacheKey, responseData)
    return NextResponse.json(responseData)
  } catch (error) {
    console.error('Error API detalle:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
