/**
 * upload-to-railway.js
 * Lee detalle_cache local y sube a Railway vía HTTPS (puerto 443)
 * Solución cuando el TCP directo a Railway está bloqueado por firewall
 *
 * Uso: node scripts/upload-to-railway.js
 */

const { Pool } = require('pg')
const { ProxyAgent, fetch: undiciFetch } = require('undici')

const RAILWAY_URL  = 'https://dashboard-app-production-c251.up.railway.app'
const ADMIN_SECRET = '979e53fe1bbff1c027605c6aa82b4c418bc0d33c8fd5e98df55c51538673bbf6'
const PROXY        = 'http://mikasa.inei.gob.pe:3128'
const LOTE         = 200

const proxyAgent = new ProxyAgent({ uri: PROXY, requestTls: { rejectUnauthorized: false } })

const pgLocal = new Pool({
  host: 'localhost', port: 5432,
  database: 'dashboard_inei',
  user: 'postgres', password: '1234',
})

async function post(path, body) {
  const res = await undiciFetch(`${RAILWAY_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    dispatcher: proxyAgent,
  })
  return res.json()
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)) }

async function run() {
  const inicio = Date.now()
  console.log(`[${new Date().toLocaleString('es-PE')}] Upload local → Railway via HTTPS`)

  // 1. Crear schema en Railway
  console.log('  1. Creando esquema en Railway...')
  const schema = await post('/api/admin/init', { secret: ADMIN_SECRET })
  if (schema.error) { console.error('Error schema:', schema); process.exit(1) }
  console.log(`     OK — filas actuales: ${schema.filas_actuales}`)

  // 2. Leer datos locales
  let client
  try {
    client = await pgLocal.connect()
    console.log('  2. Leyendo datos locales...')
    const { rows } = await client.query(
      `SELECT proyecto,codi_meta,annio_meta,nro_orden,proveedor,
              monto_armada::text AS monto_armada,
              fec_inicio_ar::text AS fec_inicio_ar,
              fec_fin_ar::text AS fec_fin_ar,
              fecha_inicio::text AS fecha_inicio,
              fecha_fin::text AS fecha_fin,
              fecha_baja::text AS fecha_baja,
              estado_contrato,n_expediente,n_subexpediente,anio_expediente,
              n_entregable,ruc,
              monto_girado::text AS monto_girado,
              flag_girado,
              fecha_girado::text AS fecha_girado,
              codestado
       FROM detalle_cache ORDER BY proyecto, nro_orden`
    )
    console.log(`     Leídas ${rows.length.toLocaleString()} filas`)

    // 3. Truncar en Railway
    console.log('  3. Truncando tabla en Railway...')
    const trunc = await post('/api/admin/import', { secret: ADMIN_SECRET, action: 'truncate' })
    if (trunc.error) { console.error('Error truncate:', trunc); process.exit(1) }
    console.log(`     OK`)

    // 4. Subir en lotes
    console.log(`  4. Subiendo ${rows.length.toLocaleString()} filas en lotes de ${LOTE}...`)
    let subidos = 0
    for (let i = 0; i < rows.length; i += LOTE) {
      const lote = rows.slice(i, i + LOTE)
      const res = await post('/api/admin/import', { secret: ADMIN_SECRET, action: 'insert', rows: lote })
      if (res.error) {
        console.error(`\nError en lote ${i}-${i+LOTE}:`, res)
        process.exit(1)
      }
      subidos += lote.length
      process.stdout.write(`\r     ${subidos.toLocaleString()}/${rows.length.toLocaleString()} (${Math.round(subidos/rows.length*100)}%)`)
      await sleep(100) // pequeña pausa entre requests
    }

    const total = Date.now() - inicio
    console.log(`\n\n[COMPLETADO] ${subidos.toLocaleString()} filas en ${(total/1000).toFixed(1)}s`)
    console.log(`Dashboard en: ${RAILWAY_URL}`)

  } finally {
    if (client) client.release()
    await pgLocal.end()
  }
}

run().catch(e => { console.error(e); process.exit(1) })
