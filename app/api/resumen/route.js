import { NextResponse } from 'next/server'
import { query } from '@/lib/db-pg'
import { getCached, setCached, invalidarCache } from '@/lib/cache'

// Datos MEF — Específica 1: Locación de Servicios por Persona Natural
// Fuente: Consulta Amigable MEF · Corte: 28/02/2026
// Actualizar estas env vars cuando el MEF publique el siguiente corte mensual
const MEF = {
  pia:            Number(process.env.PIA_LOCADORES       || '113219885'),
  pim:            Number(process.env.PIM_LOCADORES       || '114458960'),
  certificacion:  Number(process.env.CERTIFICACION_MEF   || '63587014'),
  compromiso:     Number(process.env.COMPROMISO_MEF      || '62228551'),
  acm:            Number(process.env.ACM_MEF             || '62027351'),
  devengado:      Number(process.env.DEVENGADO_MEF       || '4851329'),
  girado:         Number(process.env.GIRADO_MEF          || '4696602'),
  fecha_corte:    process.env.FECHA_CONSULTA_MEF         || '31/03/2026',
}

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
        monto_armado:           acc.monto_armado           + Number(p.monto_armado),
        monto_girado:           acc.monto_girado           + Number(p.monto_girado),
        total_entregables:      acc.total_entregables      + Number(p.total_entregables),
        entregables_girados:    acc.entregables_girados    + Number(p.entregables_girados),
        entregables_pendientes: acc.entregables_pendientes + Number(p.entregables_pendientes),
        ordenes:                acc.ordenes                + Number(p.ordenes),
        proveedores:            acc.proveedores            + Number(p.proveedores),
      }),
      { monto_armado:0, monto_girado:0, total_entregables:0, entregables_girados:0, entregables_pendientes:0, ordenes:0, proveedores:0 }
    )

    const proyectosNorm = proyectos.map(p => ({
      PROYECTO: p.proyecto, codi_Meta: p.codi_meta,
      ordenes: Number(p.ordenes), proveedores: Number(p.proveedores),
      monto_armado: Number(p.monto_armado), monto_girado: Number(p.monto_girado),
      total_entregables: Number(p.total_entregables),
      entregables_girados: Number(p.entregables_girados),
      entregables_pendientes: Number(p.entregables_pendientes),
    }))

    // KPIs cruzados (Únete vs MEF)
    const pct_ejecucion = MEF.pim > 0
      ? ((totales.monto_girado / MEF.pim) * 100).toFixed(1)
      : '0.0'
    const pct_compromiso_pim = MEF.pim > 0
      ? ((totales.monto_armado / MEF.pim) * 100).toFixed(1)
      : '0.0'
    const saldo_libre = MEF.pim - totales.monto_armado

    const responseData = {
      kpis: {
        // Datos MEF (Específica Locadores — corte mensual)
        mef: MEF,
        // Datos Únete (tiempo real desde detalle_cache)
        ...totales,
        pct_avance_locadores: totales.monto_armado > 0
          ? ((totales.monto_girado / totales.monto_armado) * 100).toFixed(1)
          : '0.0',
        // KPIs cruzados
        pct_ejecucion,          // Girado Únete / PIM MEF
        pct_compromiso_pim,     // Comprometido Únete / PIM MEF
        saldo_libre,            // PIM MEF - Comprometido Únete
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
