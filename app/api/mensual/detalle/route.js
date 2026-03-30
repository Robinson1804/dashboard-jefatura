import { NextResponse } from 'next/server'
import { query } from '@/lib/db-pg'
import { getCached, setCached } from '@/lib/cache'

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const mes = searchParams.get('mes')
  const proyecto = searchParams.get('proyecto')

  if (!mes) return NextResponse.json({ error: 'Parámetro mes requerido' }, { status: 400 })

  const cacheKey = `mensual_detalle:${mes}:${proyecto || 'todos'}`
  const cached = getCached(cacheKey)
  if (cached) return NextResponse.json(cached)

  try {
    const sql = proyecto
      ? `SELECT proyecto, codi_meta, nro_orden, proveedor, ruc,
           n_entregable, monto_armada AS monto,
           flag_girado,
           TO_CHAR(fecha_girado, 'DD/MM/YYYY') AS fecha_girado,
           TO_CHAR(fec_inicio_ar, 'DD/MM/YYYY') AS fecha_inicio_ar,
           TO_CHAR(fec_fin_ar, 'DD/MM/YYYY')    AS fecha_fin_ar
         FROM detalle_cache
         WHERE EXTRACT(MONTH FROM fec_inicio_ar) = $1 AND proyecto = $2
         ORDER BY proyecto, proveedor`
      : `SELECT proyecto, codi_meta, nro_orden, proveedor, ruc,
           n_entregable, monto_armada AS monto,
           flag_girado,
           TO_CHAR(fecha_girado, 'DD/MM/YYYY') AS fecha_girado,
           TO_CHAR(fec_inicio_ar, 'DD/MM/YYYY') AS fecha_inicio_ar,
           TO_CHAR(fec_fin_ar, 'DD/MM/YYYY')    AS fecha_fin_ar
         FROM detalle_cache
         WHERE EXTRACT(MONTH FROM fec_inicio_ar) = $1
         ORDER BY proyecto, proveedor`

    const rows = proyecto ? await query(sql, [mes, proyecto]) : await query(sql, [mes])

    const proyectosMap = {}
    for (const r of rows) {
      const k = r.codi_meta
      if (!proyectosMap[k]) {
        proyectosMap[k] = { proyecto: r.proyecto, codi_Meta: r.codi_meta, locadores: [], total_monto: 0, total_girado: 0, total_pendientes: 0 }
      }
      proyectosMap[k].locadores.push({ ...r, FLAG_GIRADO: r.flag_girado, N_ENTREGABLE: r.n_entregable, PROVEEDOR: r.proveedor, RUC: r.ruc, monto: Number(r.monto) })
      proyectosMap[k].total_monto += Number(r.monto)
      if (r.flag_girado === 1) proyectosMap[k].total_girado += Number(r.monto)
      else proyectosMap[k].total_pendientes += Number(r.monto)
    }

    const responseData = {
      mes: Number(mes),
      proyectos: Object.values(proyectosMap).sort((a, b) => b.total_monto - a.total_monto),
      totales: {
        locadores: rows.length,
        monto: rows.reduce((a, r) => a + Number(r.monto), 0),
        girado: rows.filter(r => r.flag_girado === 1).reduce((a, r) => a + Number(r.monto), 0),
        pendientes: rows.filter(r => r.flag_girado !== 1).length,
      }
    }
    setCached(cacheKey, responseData)
    return NextResponse.json(responseData)
  } catch (error) {
    console.error('Error API mensual/detalle:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
