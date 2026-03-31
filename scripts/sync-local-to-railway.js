/**
 * sync-local-to-railway.js
 * Copia detalle_cache desde PostgreSQL local → Railway PostgreSQL
 *
 * Uso: node scripts/sync-local-to-railway.js
 */

const { Pool } = require('pg')

const pgLocal = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'dashboard_inei',
  user: 'postgres',
  password: '1234',
})

const pgRailway = new Pool({
  connectionString: 'postgresql://postgres:MfPQwwsCHgLfPYIomrQNjybYtsiAQVNc@hopper.proxy.rlwy.net:52998/railway',
  ssl: { rejectUnauthorized: false },
})

const CREATE_TABLE_SQL = `
CREATE TABLE IF NOT EXISTS detalle_cache (
  id               SERIAL PRIMARY KEY,
  proyecto         TEXT NOT NULL,
  codi_meta        VARCHAR(4),
  annio_meta       VARCHAR(4),
  nro_orden        VARCHAR(31),
  proveedor        TEXT,
  monto_armada     NUMERIC(18,2),
  fec_inicio_ar    DATE,
  fec_fin_ar       DATE,
  fecha_inicio     TIMESTAMP,
  fecha_fin        TIMESTAMP,
  fecha_baja       TIMESTAMP,
  estado_contrato  INTEGER,
  n_expediente     VARCHAR(5),
  n_subexpediente  VARCHAR(4),
  anio_expediente  VARCHAR(4),
  n_entregable     VARCHAR(2),
  ruc              VARCHAR(11),
  monto_girado     NUMERIC(18,2),
  flag_girado      SMALLINT,
  fecha_girado     DATE,
  sincronizado_en  TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_dc_proyecto     ON detalle_cache(proyecto);
CREATE INDEX IF NOT EXISTS idx_dc_mes          ON detalle_cache(EXTRACT(MONTH FROM fec_inicio_ar));
CREATE INDEX IF NOT EXISTS idx_dc_codi_meta    ON detalle_cache(codi_meta);
CREATE INDEX IF NOT EXISTS idx_dc_ruc          ON detalle_cache(ruc);
CREATE INDEX IF NOT EXISTS idx_dc_flag_girado  ON detalle_cache(flag_girado);
CREATE INDEX IF NOT EXISTS idx_dc_fecha_fin    ON detalle_cache(fecha_fin);
`

async function sync() {
  const inicio = Date.now()
  console.log(`[${new Date().toLocaleString('es-PE')}] Iniciando sync local → Railway...`)

  let localClient, railClient
  try {
    localClient  = await pgLocal.connect()
    railClient   = await pgRailway.connect()
    console.log('  Conexiones OK')

    // Crear tabla e índices si no existen en Railway
    console.log('  Creando esquema en Railway...')
    await railClient.query(CREATE_TABLE_SQL)
    console.log('  Esquema listo')

    // Leer todos los datos locales
    console.log('  Leyendo datos locales...')
    const { rows } = await localClient.query(
      `SELECT proyecto,codi_meta,annio_meta,nro_orden,proveedor,monto_armada,
              fec_inicio_ar,fec_fin_ar,fecha_inicio,fecha_fin,fecha_baja,
              estado_contrato,n_expediente,n_subexpediente,anio_expediente,
              n_entregable,ruc,monto_girado,flag_girado,fecha_girado
       FROM detalle_cache
       ORDER BY proyecto, nro_orden`
    )
    console.log(`  Leídas ${rows.length.toLocaleString()} filas locales (${Date.now()-inicio}ms)`)

    // Truncar Railway y recargar
    await railClient.query('BEGIN')
    await railClient.query('TRUNCATE TABLE detalle_cache RESTART IDENTITY')

    const LOTE = 500
    let insertados = 0
    for (let i = 0; i < rows.length; i += LOTE) {
      const lote = rows.slice(i, i + LOTE)
      const valores = []
      const params  = []
      let p = 1
      for (const r of lote) {
        valores.push(`($${p},$${p+1},$${p+2},$${p+3},$${p+4},$${p+5},$${p+6},$${p+7},$${p+8},$${p+9},$${p+10},$${p+11},$${p+12},$${p+13},$${p+14},$${p+15},$${p+16},$${p+17},$${p+18},$${p+19})`)
        params.push(
          r.proyecto, r.codi_meta||null, r.annio_meta||null, r.nro_orden||null,
          r.proveedor||null, r.monto_armada||0,
          r.fec_inicio_ar||null, r.fec_fin_ar||null,
          r.fecha_inicio||null, r.fecha_fin||null, r.fecha_baja||null,
          r.estado_contrato??null,
          r.n_expediente||null, r.n_subexpediente||null, r.anio_expediente||null,
          r.n_entregable||null, r.ruc||null,
          r.monto_girado||0, r.flag_girado??null, r.fecha_girado||null,
        )
        p += 20
      }
      await railClient.query(
        `INSERT INTO detalle_cache
           (proyecto,codi_meta,annio_meta,nro_orden,proveedor,monto_armada,
            fec_inicio_ar,fec_fin_ar,fecha_inicio,fecha_fin,fecha_baja,
            estado_contrato,n_expediente,n_subexpediente,anio_expediente,
            n_entregable,ruc,monto_girado,flag_girado,fecha_girado)
         VALUES ${valores.join(',')}`,
        params
      )
      insertados += lote.length
      process.stdout.write(`\r  Insertando en Railway... ${insertados.toLocaleString()}/${rows.length.toLocaleString()}`)
    }

    await railClient.query('COMMIT')
    const total = Date.now() - inicio
    console.log(`\n  Commit OK`)

    const check = await railClient.query('SELECT COUNT(*) AS total FROM detalle_cache')
    console.log(`[SYNC COMPLETO] ${check.rows[0].total} filas en Railway en ${(total/1000).toFixed(1)}s`)

  } catch (err) {
    if (railClient) await railClient.query('ROLLBACK').catch(()=>{})
    console.error('[ERROR]', err.message)
    process.exit(1)
  } finally {
    if (localClient)  localClient.release()
    if (railClient)   railClient.release()
    await pgLocal.end()
    await pgRailway.end()
  }
}

sync()
