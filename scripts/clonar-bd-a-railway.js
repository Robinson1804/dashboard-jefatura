/**
 * clonar-bd-a-railway.js
 * ─────────────────────────────────────────────────────────────
 * Copia la BD local (dashboard_inei) a Railway PostgreSQL
 *
 * REQUISITO: Correr conectado a internet sin proxy corporativo
 *            (usa tu celular como hotspot si estás en INEI)
 *
 * Uso:
 *   node scripts/clonar-bd-a-railway.js
 * ─────────────────────────────────────────────────────────────
 */

const { Pool } = require('pg')

// ── Configuración ────────────────────────────────────────────
const LOCAL = {
  host: 'localhost',
  port: 5432,
  database: 'dashboard_inei',
  user: 'postgres',
  password: '1234',
}

const RAILWAY = {
  connectionString: 'postgresql://postgres:MfPQwwsCHgLfPYIomrQNjybYtsiAQVNc@hopper.proxy.rlwy.net:52998/railway',
  ssl: { rejectUnauthorized: false },
}
// ─────────────────────────────────────────────────────────────

const pgLocal   = new Pool(LOCAL)
const pgRailway = new Pool(RAILWAY)

const SCHEMA = `
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
CREATE INDEX IF NOT EXISTS idx_dc_proyecto    ON detalle_cache(proyecto);
CREATE INDEX IF NOT EXISTS idx_dc_mes         ON detalle_cache(EXTRACT(MONTH FROM fec_inicio_ar));
CREATE INDEX IF NOT EXISTS idx_dc_codi_meta   ON detalle_cache(codi_meta);
CREATE INDEX IF NOT EXISTS idx_dc_ruc         ON detalle_cache(ruc);
CREATE INDEX IF NOT EXISTS idx_dc_flag_girado ON detalle_cache(flag_girado);
CREATE INDEX IF NOT EXISTS idx_dc_fecha_fin   ON detalle_cache(fecha_fin);
`

async function main() {
  const t0 = Date.now()
  console.log('═══════════════════════════════════════════')
  console.log('  Clonación BD local → Railway PostgreSQL')
  console.log('═══════════════════════════════════════════')

  let local, rail

  try {
    // 1. Conectar
    console.log('\n[1/4] Conectando...')
    local = await pgLocal.connect()
    rail  = await pgRailway.connect()
    console.log('      Local:   OK (dashboard_inei@localhost)')
    console.log('      Railway: OK (railway@hopper.proxy.rlwy.net)')

    // 2. Crear esquema en Railway
    console.log('\n[2/4] Creando esquema en Railway...')
    for (const stmt of SCHEMA.split(';').map(s => s.trim()).filter(Boolean)) {
      await rail.query(stmt)
    }
    console.log('      Tabla e índices: OK')

    // 3. Leer datos locales
    console.log('\n[3/4] Leyendo datos locales...')
    const { rows } = await local.query(`
      SELECT proyecto, codi_meta, annio_meta, nro_orden, proveedor,
             monto_armada, fec_inicio_ar, fec_fin_ar,
             fecha_inicio, fecha_fin, fecha_baja,
             estado_contrato, n_expediente, n_subexpediente, anio_expediente,
             n_entregable, ruc, monto_girado, flag_girado, fecha_girado
      FROM detalle_cache
      ORDER BY proyecto, nro_orden
    `)
    console.log(`      ${rows.length.toLocaleString('es-PE')} filas leídas`)

    // 4. Cargar en Railway
    console.log('\n[4/4] Cargando en Railway...')
    await rail.query('BEGIN')
    await rail.query('TRUNCATE TABLE detalle_cache RESTART IDENTITY')

    const LOTE = 500
    let ok = 0
    for (let i = 0; i < rows.length; i += LOTE) {
      const lote = rows.slice(i, i + LOTE)
      const vals = [], params = []
      let p = 1
      for (const r of lote) {
        vals.push(
          `($${p},$${p+1},$${p+2},$${p+3},$${p+4},$${p+5},` +
          `$${p+6},$${p+7},$${p+8},$${p+9},$${p+10},$${p+11},` +
          `$${p+12},$${p+13},$${p+14},$${p+15},$${p+16},$${p+17},$${p+18},$${p+19})`
        )
        params.push(
          r.proyecto,        r.codi_meta     || null,
          r.annio_meta       || null,         r.nro_orden    || null,
          r.proveedor        || null,         r.monto_armada || 0,
          r.fec_inicio_ar    || null,         r.fec_fin_ar   || null,
          r.fecha_inicio     || null,         r.fecha_fin    || null,
          r.fecha_baja       || null,         r.estado_contrato ?? null,
          r.n_expediente     || null,         r.n_subexpediente || null,
          r.anio_expediente  || null,         r.n_entregable || null,
          r.ruc              || null,         r.monto_girado || 0,
          r.flag_girado      ?? null,         r.fecha_girado || null,
        )
        p += 20
      }
      await rail.query(
        `INSERT INTO detalle_cache
           (proyecto,codi_meta,annio_meta,nro_orden,proveedor,monto_armada,
            fec_inicio_ar,fec_fin_ar,fecha_inicio,fecha_fin,fecha_baja,
            estado_contrato,n_expediente,n_subexpediente,anio_expediente,
            n_entregable,ruc,monto_girado,flag_girado,fecha_girado)
         VALUES ${vals.join(',')}`,
        params
      )
      ok += lote.length
      process.stdout.write(
        `\r      ${ok.toLocaleString('es-PE')} / ${rows.length.toLocaleString('es-PE')} filas` +
        `  (${Math.round(ok / rows.length * 100)}%)`
      )
    }

    await rail.query('COMMIT')

    // Verificación
    const [{ count }] = (await rail.query('SELECT COUNT(*) AS count FROM detalle_cache')).rows
    const seg = ((Date.now() - t0) / 1000).toFixed(1)

    console.log(`\n\n═══════════════════════════════════════════`)
    console.log(`  COMPLETADO en ${seg}s`)
    console.log(`  ${Number(count).toLocaleString('es-PE')} filas en Railway`)
    console.log(`  Dashboard: https://dashboard-app-production-c251.up.railway.app`)
    console.log('═══════════════════════════════════════════')

  } catch (err) {
    if (rail) await rail.query('ROLLBACK').catch(() => {})
    console.error('\n\n[ERROR]', err.message)
    if (err.message.includes('ECONNREFUSED') || err.message.includes('ETIMEDOUT') ||
        err.message.includes('ENOTFOUND')    || err.message.includes('certificate')) {
      console.error('\n⚠  No se pudo conectar a Railway.')
      console.error('   La red de INEI bloquea las conexiones externas.')
      console.error('   Solución: conecta tu laptop al hotspot de tu celular (4G/5G)')
      console.error('   y vuelve a correr: node scripts/clonar-bd-a-railway.js')
    }
    process.exit(1)
  } finally {
    if (local) local.release()
    if (rail)  rail.release()
    await pgLocal.end().catch(() => {})
    await pgRailway.end().catch(() => {})
  }
}

main()
