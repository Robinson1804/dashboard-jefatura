import { query } from '@/lib/db-pg'
import { getCached, setCached } from '@/lib/cache'

let warmupInProgress = false

const NOMBRES_MES = ['','Enero','Febrero','Marzo','Abril','Mayo','Junio',
  'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']

async function cargarMes(mes, t) {
  const key = `mensual_detalle:${mes}:todos`
  if (getCached(key)) return
  const rows = await query(`
    SELECT proyecto, codi_meta, nro_orden, proveedor, ruc,
      n_entregable, monto_armada AS monto, flag_girado,
      TO_CHAR(fecha_girado,  'DD/MM/YYYY') AS fecha_girado,
      TO_CHAR(fec_inicio_ar, 'DD/MM/YYYY') AS fecha_inicio_ar,
      TO_CHAR(fec_fin_ar,    'DD/MM/YYYY') AS fecha_fin_ar
    FROM detalle_cache
    WHERE EXTRACT(MONTH FROM fec_inicio_ar) = $1
    ORDER BY proyecto, proveedor
  `, [mes])
  const map = {}
  for (const r of rows) {
    const k = r.codi_meta
    if (!map[k]) map[k] = { proyecto: r.proyecto, codi_Meta: r.codi_meta, locadores: [], total_monto: 0, total_girado: 0, total_pendientes: 0 }
    map[k].locadores.push({ ...r, FLAG_GIRADO: r.flag_girado, N_ENTREGABLE: r.n_entregable, PROVEEDOR: r.proveedor, RUC: r.ruc, monto: Number(r.monto) })
    map[k].total_monto += Number(r.monto)
    if (r.flag_girado === 1) map[k].total_girado += Number(r.monto)
    else map[k].total_pendientes += Number(r.monto)
  }
  setCached(key, {
    mes,
    proyectos: Object.values(map).sort((a, b) => b.total_monto - a.total_monto),
    totales: {
      locadores: rows.length,
      monto:     rows.reduce((a, r) => a + Number(r.monto), 0),
      girado:    rows.filter(r => r.flag_girado === 1).reduce((a, r) => a + Number(r.monto), 0),
      pendientes:rows.filter(r => r.flag_girado !== 1).length,
    }
  })
  console.log(`[warmup] ${NOMBRES_MES[mes]} listo (${Date.now() - t}ms)`)
}

export async function warmupCache() {
  if (warmupInProgress) return
  warmupInProgress = true
  const t = Date.now()
  console.log('[warmup] Iniciando...')

  try {
    // Paso 1: proyectos_lista + mensual:todos en paralelo
    await Promise.all([
      getCached('proyectos_lista') ? null :
        query(`SELECT DISTINCT proyecto, codi_meta FROM detalle_cache ORDER BY proyecto`)
          .then(rows => setCached('proyectos_lista', { proyectos: rows.map(r => ({ PROYECTO: r.proyecto, codi_Meta: r.codi_meta })) }, 30))
          .then(() => console.log(`[warmup] proyectos_lista (${Date.now() - t}ms)`)),

      getCached('mensual:todos') ? null :
        query(`SELECT EXTRACT(MONTH FROM fec_inicio_ar)::int AS mes,
            COUNT(*) AS total_entregables,
            ROUND(SUM(monto_armada)::numeric,2) AS monto_armado,
            COUNT(CASE WHEN flag_girado=1 THEN 1 END) AS entregables_girados,
            ROUND(SUM(CASE WHEN flag_girado=1 THEN monto_girado ELSE 0 END)::numeric,2) AS monto_girado,
            COUNT(CASE WHEN flag_girado IS NULL THEN 1 END) AS entregables_pendientes
          FROM detalle_cache WHERE fec_inicio_ar IS NOT NULL GROUP BY 1 ORDER BY 1`)
          .then(rows => setCached('mensual:todos', { meses: rows.map(r => ({
            ...r, mes: Number(r.mes), nombre_mes: NOMBRES_MES[Number(r.mes)],
            monto_pendiente: Number(r.monto_armado) - Number(r.monto_girado),
            pct_avance: r.total_entregables > 0 ? ((Number(r.entregables_girados) / Number(r.total_entregables)) * 100).toFixed(1) : '0.0',
          }))}))
          .then(() => console.log(`[warmup] mensual:todos (${Date.now() - t}ms)`)),
    ])

    // Paso 2: 12 meses en lotes de 3
    for (let i = 1; i <= 12; i += 3) {
      await Promise.all([i, i+1, i+2].filter(m => m <= 12).map(m => cargarMes(m, t).catch(e => console.error(`[warmup] Error mes ${m}:`, e.message))))
    }
    console.log(`[warmup] Meses listos (${Date.now() - t}ms)`)

    // Paso 3: resumen (pesado, al final)
    if (!getCached('resumen')) {
      const proyectos = await query(`
        SELECT proyecto, codi_meta,
          COUNT(DISTINCT nro_orden)::int AS ordenes, COUNT(DISTINCT ruc)::int AS proveedores,
          ROUND(SUM(monto_armada)::numeric,2) AS monto_armado,
          ROUND(SUM(monto_girado)::numeric,2) AS monto_girado,
          COUNT(*)::int AS total_entregables,
          COUNT(CASE WHEN flag_girado=1 THEN 1 END)::int AS entregables_girados,
          COUNT(CASE WHEN flag_girado IS NULL THEN 1 END)::int AS entregables_pendientes
        FROM detalle_cache GROUP BY proyecto, codi_meta ORDER BY SUM(monto_armada) DESC
      `)
      const totales = proyectos.reduce((acc, p) => ({
        monto_armado: acc.monto_armado + Number(p.monto_armado),
        monto_girado: acc.monto_girado + Number(p.monto_girado),
        total_entregables: acc.total_entregables + Number(p.total_entregables),
        entregables_girados: acc.entregables_girados + Number(p.entregables_girados),
        entregables_pendientes: acc.entregables_pendientes + Number(p.entregables_pendientes),
        ordenes: acc.ordenes + Number(p.ordenes),
        proveedores: acc.proveedores + Number(p.proveedores),
      }), { monto_armado:0, monto_girado:0, total_entregables:0, entregables_girados:0, entregables_pendientes:0, ordenes:0, proveedores:0 })
      setCached('resumen', {
        kpis: {
          pim_total: Number(process.env.PIM_TOTAL), pia_total: Number(process.env.PIA_TOTAL),
          devengado_mef: Number(process.env.DEVENGADO_MEF), girado_mef: Number(process.env.GIRADO_MEF),
          avance_mef: Number(process.env.AVANCE_MEF), fecha_consulta_mef: process.env.FECHA_CONSULTA_MEF,
          ...totales,
          pct_avance_locadores: totales.monto_armado > 0 ? ((totales.monto_girado / totales.monto_armado) * 100).toFixed(1) : '0.0',
        },
        proyectos: proyectos.map(p => ({ PROYECTO: p.proyecto, codi_Meta: p.codi_meta, ...p })),
      })
      console.log(`[warmup] resumen listo (${Date.now() - t}ms)`)
    }
    console.log(`[warmup] Completo en ${Date.now() - t}ms`)
  } catch (e) {
    console.error('[warmup] Error:', e.message)
  } finally {
    warmupInProgress = false
  }
}
