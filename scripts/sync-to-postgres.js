/**
 * sync-to-postgres.js
 * Lee VISTA_DASHBOARD_DETALLE de SQL Server remoto
 * y copia todo a PostgreSQL local en detalle_cache
 *
 * Uso: node scripts/sync-to-postgres.js
 * Programar con Windows Task Scheduler cada 2 horas
 */

const sql = require('msnodesqlv8')
const { Pool } = require('pg')

const MSSQL_CONN = `Driver={ODBC Driver 17 for SQL Server};Server=192.168.202.217;Database=INEI_BDRRHH_SERVICIOS;Trusted_Connection=yes;TrustServerCertificate=yes;`

const pgPool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'dashboard_inei',
  user: 'postgres',
  password: '1234',
})

function queryMSSQL(connStr, sqlText) {
  return new Promise((resolve, reject) => {
    sql.query(connStr, sqlText, (err, rows) => {
      if (err) reject(err)
      else resolve(rows)
    })
  })
}

async function sync() {
  const inicio = Date.now()
  console.log(`[${new Date().toLocaleString('es-PE')}] Iniciando sincronización...`)

  let pgClient
  try {
    // 1. Leer toda la vista desde SQL Server remoto
    console.log('  Leyendo vista remota...')
    const rows = await queryMSSQL(MSSQL_CONN, `
      SELECT
        RTRIM(d.PROYECTO)       AS proyecto,
        RTRIM(d.codi_Meta)      AS codi_meta,
        RTRIM(d.annio_Meta)     AS annio_meta,
        RTRIM(d.NRO_ORDEN)      AS nro_orden,
        RTRIM(d.PROVEEDOR)      AS proveedor,
        CAST(ISNULL(d.MONTOARMADA, 0) AS FLOAT)                    AS monto_armada,
        CONVERT(varchar, d.FEC_INICIO_AR, 23)                      AS fec_inicio_ar,
        CONVERT(varchar, d.FEC_FIN_AR, 23)                         AS fec_fin_ar,
        CONVERT(varchar, d.FECHA_INICIO, 23)                       AS fecha_inicio,
        CONVERT(varchar, d.FECHA_FIN, 23)                          AS fecha_fin,
        CONVERT(varchar, d.FECHA_BAJA, 23)                         AS fecha_baja,
        d.ESTADO_CONTRATO,
        RTRIM(ISNULL(d.N_EXPEDIENTE,''))                           AS n_expediente,
        RTRIM(ISNULL(d.N_SUBEXPEDIENTE,''))                        AS n_subexpediente,
        RTRIM(ISNULL(d.ANIO_EXPEDIENTE,''))                        AS anio_expediente,
        RTRIM(ISNULL(d.N_ENTREGABLE,''))                           AS n_entregable,
        RTRIM(ISNULL(d.RUC,''))                                    AS ruc,
        CAST(ISNULL(d.MONTO_GIRADO, '0') AS FLOAT)                 AS monto_girado,
        d.FLAG_GIRADO,
        CONVERT(varchar, d.FECHA_GIRADO, 23)                       AS fecha_girado,
        g.CODESTADO                                                AS codestado
      FROM [dbo].[VISTA_DASHBOARD_DETALLE] d
      LEFT JOIN (
        SELECT
          RTRIM(N_EXPEDIENTE)    ne,
          RTRIM(N_SUBEXPEDIENTE) ns,
          RTRIM(ANIO_EXPEDIENTE) ae,
          RTRIM(N_ENTREGABLE)    ent,
          RTRIM(RUC)             ruc,
          CODESTADO,
          ROW_NUMBER() OVER (
            PARTITION BY RTRIM(N_EXPEDIENTE),RTRIM(N_SUBEXPEDIENTE),
                         RTRIM(ANIO_EXPEDIENTE),RTRIM(N_ENTREGABLE),RTRIM(RUC)
            ORDER BY CODESTADO DESC
          ) rn
        FROM [BDSACD].[dbo].[VISTA_GIRADO_CONTRATACIONES]
        WHERE RTRIM(ANIO_EXPEDIENTE) = '2026'
      ) g
        ON  RTRIM(d.N_EXPEDIENTE)    = g.ne
        AND RTRIM(d.N_SUBEXPEDIENTE) = g.ns
        AND RTRIM(d.ANIO_EXPEDIENTE) = g.ae
        AND RTRIM(d.N_ENTREGABLE)    = g.ent
        AND RTRIM(d.RUC)             = g.ruc
        AND (g.rn = 1 OR g.rn IS NULL)
      ORDER BY d.proyecto, d.nro_orden, CAST(d.n_entregable AS INT)
    `)
    console.log(`  Leídas ${rows.length.toLocaleString()} filas (${Date.now() - inicio}ms)`)

    // 2. Conectar a PostgreSQL e insertar en lotes
    pgClient = await pgPool.connect()
    await pgClient.query('BEGIN')

    // Truncar tabla antes de recargar
    await pgClient.query('TRUNCATE TABLE detalle_cache RESTART IDENTITY')

    // Insertar en lotes de 500 para no saturar memoria
    const LOTE = 500
    let insertados = 0
    for (let i = 0; i < rows.length; i += LOTE) {
      const lote = rows.slice(i, i + LOTE)

      const valores = []
      const params = []
      let p = 1
      for (const r of lote) {
        valores.push(`($${p},$${p+1},$${p+2},$${p+3},$${p+4},$${p+5},$${p+6},$${p+7},$${p+8},$${p+9},$${p+10},$${p+11},$${p+12},$${p+13},$${p+14},$${p+15},$${p+16},$${p+17},$${p+18},$${p+19},$${p+20})`)
        params.push(
          r.proyecto,
          r.codi_meta || null,
          r.annio_meta || null,
          r.nro_orden || null,
          r.proveedor || null,
          r.monto_armada || 0,
          r.fec_inicio_ar || null,
          r.fec_fin_ar || null,
          r.fecha_inicio || null,
          r.fecha_fin || null,
          r.fecha_baja || null,
          r.ESTADO_CONTRATO ?? null,
          r.n_expediente || null,
          r.n_subexpediente || null,
          r.anio_expediente || null,
          r.n_entregable || null,
          r.ruc || null,
          r.monto_girado || 0,
          r.FLAG_GIRADO ?? null,
          r.fecha_girado || null,
          r.codestado ?? null,
        )
        p += 21
      }

      await pgClient.query(
        `INSERT INTO detalle_cache
          (proyecto,codi_meta,annio_meta,nro_orden,proveedor,monto_armada,
           fec_inicio_ar,fec_fin_ar,fecha_inicio,fecha_fin,fecha_baja,
           estado_contrato,n_expediente,n_subexpediente,anio_expediente,
           n_entregable,ruc,monto_girado,flag_girado,fecha_girado,codestado)
         VALUES ${valores.join(',')}`,
        params
      )
      insertados += lote.length
      process.stdout.write(`\r  Insertando... ${insertados.toLocaleString()}/${rows.length.toLocaleString()}`)
    }

    await pgClient.query('COMMIT')
    console.log(`\n  Commit OK — ${insertados.toLocaleString()} filas`)

    // 3. Actualizar timestamp de última sincronización
    const total = Date.now() - inicio
    console.log(`[SYNC COMPLETO] ${insertados.toLocaleString()} filas en ${(total/1000).toFixed(1)}s`)

    // Verificación rápida
    const check = await pgClient.query('SELECT COUNT(*) AS total FROM detalle_cache')
    console.log(`  Verificación PostgreSQL: ${check.rows[0].total} filas en tabla`)

  } catch (err) {
    if (pgClient) await pgClient.query('ROLLBACK').catch(() => {})
    console.error('[ERROR SYNC]', err.message)
    process.exit(1)
  } finally {
    if (pgClient) pgClient.release()
    await pgPool.end()
  }
}

sync()
