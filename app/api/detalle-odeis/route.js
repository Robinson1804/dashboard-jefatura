import { NextResponse } from 'next/server'
import { query } from '@/lib/db-pg'
import { getCached, setCached } from '@/lib/cache'

/**
 * GET /api/detalle-odeis
 *
 * Devuelve todos los sub-proyectos "ESTADISTICAS DEPARTAMENTAL *"
 * agrupados por proyecto/ODEI, junto con sus órdenes y entregables.
 * Usado cuando el usuario expande el proyecto paraguas en la vista de detalle.
 */
export async function GET() {
  const cacheKey = 'detalle-odeis'
  const cached = getCached(cacheKey)
  if (cached) return NextResponse.json(cached)

  try {
    // Trae todos los registros de proyectos departamentales (todos los codi_meta 0013-0039)
    const rows = await query(`
      SELECT
        proyecto,
        codi_meta,
        nro_orden,
        proveedor,
        ruc,
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
      WHERE proyecto ILIKE '%estadisticas%departamental%'
      ORDER BY codi_meta, proveedor, nro_orden, CAST(n_entregable AS INT)
    `)

    // Estructura: { [proyecto]: { meta, ordenes: Map, entregablesPorOrden: {} } }
    const odeiMap = new Map()

    for (const r of rows) {
      const proyKey = r.proyecto

      if (!odeiMap.has(proyKey)) {
        odeiMap.set(proyKey, {
          proyecto: proyKey,
          codi_meta: r.codi_meta,
          ordenes: new Map(),
          entregables_por_orden: {},
          monto_total: 0,
          monto_girado: 0,
          num_entregables: 0,
          entregables_girados: 0,
        })
      }

      const odei = odeiMap.get(proyKey)
      const key = r.nro_orden

      if (!odei.ordenes.has(key)) {
        odei.ordenes.set(key, {
          NRO_ORDEN: key,
          PROVEEDOR: r.proveedor,
          RUC: r.ruc,
          fecha_inicio: r.fecha_inicio,
          fecha_fin: r.fecha_fin,
          ESTADO_CONTRATO: r.ESTADO_CONTRATO,
          dias_fin: r.dias_fin,
          monto_total: 0,
          num_entregables: 0,
          entregables_girados: 0,
          monto_girado: 0,
        })
        odei.entregables_por_orden[key] = []
      }

      const o = odei.ordenes.get(key)
      o.monto_total    += Number(r.monto_armada)
      o.num_entregables += 1
      odei.monto_total  += Number(r.monto_armada)
      odei.num_entregables += 1

      if (r.FLAG_GIRADO === 1) {
        o.entregables_girados  += 1
        o.monto_girado         += Number(r.monto_girado_ent)
        odei.entregables_girados += 1
        odei.monto_girado       += Number(r.monto_girado_ent)
      }

      odei.entregables_por_orden[key].push({
        N_ENTREGABLE:    r.n_entregable,
        fecha_inicio_ar: r.fecha_inicio_ar,
        fecha_fin_ar:    r.fecha_fin_ar,
        monto_armada:    Number(r.monto_armada),
        FLAG_GIRADO:     r.FLAG_GIRADO,
        monto_girado:    Number(r.monto_girado_ent),
        fecha_girado:    r.fecha_girado,
      })
    }

    // Serializar: convertir Maps a arrays y redondear
    const odeis = Array.from(odeiMap.values()).map(odei => ({
      proyecto:      odei.proyecto,
      codi_meta:     odei.codi_meta,
      monto_total:   Math.round(odei.monto_total   * 100) / 100,
      monto_girado:  Math.round(odei.monto_girado  * 100) / 100,
      num_ordenes:   odei.ordenes.size,
      num_entregables:    odei.num_entregables,
      entregables_girados: odei.entregables_girados,
      ordenes: Array.from(odei.ordenes.values()).map(o => ({
        ...o,
        monto_total:  Math.round(o.monto_total  * 100) / 100,
        monto_girado: Math.round(o.monto_girado * 100) / 100,
      })),
      entregables_por_orden: odei.entregables_por_orden,
    }))

    const responseData = { odeis }
    setCached(cacheKey, responseData, 10) // cache 10 min
    return NextResponse.json(responseData)
  } catch (error) {
    console.error('Error API detalle-odeis:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
