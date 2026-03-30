import { NextResponse } from 'next/server'
import { query } from '@/lib/db-pg'
import { getCached, setCached, invalidarCache } from '@/lib/cache'

export async function GET(request) {
  const refresh = new URL(request.url).searchParams.get('refresh')
  if (refresh) invalidarCache()

  const cached = getCached('resumen')
  if (cached) return NextResponse.json(cached)

  try {
    const proyectos = await query(`
      SELECT proyecto, codi_meta,
        COUNT(DISTINCT nro_orden)   AS ordenes,
        COUNT(DISTINCT ruc)         AS proveedores,
        ROUND(SUM(monto_armada)::numeric, 2)  AS monto_armado,
        ROUND(SUM(monto_girado)::numeric, 2)  AS monto_girado,
        COUNT(*)                              AS total_entregables,
        COUNT(CASE WHEN flag_girado = 1 THEN 1 END)      AS entregables_girados,
        COUNT(CASE WHEN flag_girado IS NULL THEN 1 END)  AS entregables_pendientes
      FROM detalle_cache
      GROUP BY proyecto, codi_meta
      ORDER BY SUM(monto_armada) DESC
    `)

    const totales = proyectos.reduce(
      (acc, p) => ({
        monto_armado:          acc.monto_armado          + Number(p.monto_armado),
        monto_girado:          acc.monto_girado          + Number(p.monto_girado),
        total_entregables:     acc.total_entregables     + Number(p.total_entregables),
        entregables_girados:   acc.entregables_girados   + Number(p.entregables_girados),
        entregables_pendientes:acc.entregables_pendientes+ Number(p.entregables_pendientes),
        ordenes:               acc.ordenes               + Number(p.ordenes),
        proveedores:           acc.proveedores           + Number(p.proveedores),
      }),
      { monto_armado:0, monto_girado:0, total_entregables:0, entregables_girados:0, entregables_pendientes:0, ordenes:0, proveedores:0 }
    )

    // Normalizar nombres a mayúsculas para compatibilidad con componentes existentes
    const proyectosNorm = proyectos.map(p => ({
      PROYECTO: p.proyecto, codi_Meta: p.codi_meta,
      ordenes: Number(p.ordenes), proveedores: Number(p.proveedores),
      monto_armado: Number(p.monto_armado), monto_girado: Number(p.monto_girado),
      total_entregables: Number(p.total_entregables),
      entregables_girados: Number(p.entregables_girados),
      entregables_pendientes: Number(p.entregables_pendientes),
    }))

    const responseData = {
      kpis: {
        pim_total: Number(process.env.PIM_TOTAL),
        pia_total: Number(process.env.PIA_TOTAL),
        devengado_mef: Number(process.env.DEVENGADO_MEF),
        girado_mef: Number(process.env.GIRADO_MEF),
        avance_mef: Number(process.env.AVANCE_MEF),
        fecha_consulta_mef: process.env.FECHA_CONSULTA_MEF,
        ...totales,
        pct_avance_locadores: totales.monto_armado > 0
          ? ((totales.monto_girado / totales.monto_armado) * 100).toFixed(1)
          : '0.0',
      },
      proyectos: proyectosNorm,
    }
    setCached('resumen', responseData)
    return NextResponse.json(responseData)
  } catch (error) {
    console.error('Error API resumen:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
