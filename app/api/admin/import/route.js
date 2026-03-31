import { NextResponse } from 'next/server'
import { Pool } from 'pg'

const SECRET = process.env.ADMIN_SECRET

// Pool directo para poder hacer TRUNCATE + bulk insert sin el wrapper de query()
const pool = process.env.DATABASE_URL
  ? new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false }, max: 5 })
  : new Pool({ host: process.env.PG_HOST||'localhost', port: Number(process.env.PG_PORT)||5432,
               database: process.env.PG_DATABASE||'dashboard_inei', user: process.env.PG_USER||'postgres',
               password: process.env.PG_PASSWORD||'1234', max: 5 })

export async function POST(req) {
  const body = await req.json()
  const { secret, action, rows } = body

  if (!SECRET || secret !== SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const client = await pool.connect()
  try {
    if (action === 'truncate') {
      await client.query('TRUNCATE TABLE detalle_cache RESTART IDENTITY')
      return NextResponse.json({ ok: true, action: 'truncated' })
    }

    if (action === 'insert' && Array.isArray(rows) && rows.length > 0) {
      const valores = []
      const params  = []
      let p = 1
      for (const r of rows) {
        valores.push(`($${p},$${p+1},$${p+2},$${p+3},$${p+4},$${p+5},$${p+6},$${p+7},$${p+8},$${p+9},$${p+10},$${p+11},$${p+12},$${p+13},$${p+14},$${p+15},$${p+16},$${p+17},$${p+18},$${p+19},$${p+20})`)
        params.push(
          r.proyecto, r.codi_meta||null, r.annio_meta||null, r.nro_orden||null,
          r.proveedor||null, r.monto_armada||0,
          r.fec_inicio_ar||null, r.fec_fin_ar||null,
          r.fecha_inicio||null, r.fecha_fin||null, r.fecha_baja||null,
          r.estado_contrato??null,
          r.n_expediente||null, r.n_subexpediente||null, r.anio_expediente||null,
          r.n_entregable||null, r.ruc||null,
          r.monto_girado||0, r.flag_girado??null, r.fecha_girado||null,
          r.codestado??null,
        )
        p += 21
      }
      await client.query(
        `INSERT INTO detalle_cache
           (proyecto,codi_meta,annio_meta,nro_orden,proveedor,monto_armada,
            fec_inicio_ar,fec_fin_ar,fecha_inicio,fecha_fin,fecha_baja,
            estado_contrato,n_expediente,n_subexpediente,anio_expediente,
            n_entregable,ruc,monto_girado,flag_girado,fecha_girado,codestado)
         VALUES ${valores.join(',')}`,
        params
      )
      return NextResponse.json({ ok: true, insertados: rows.length })
    }

    return NextResponse.json({ error: 'action no reconocida' }, { status: 400 })
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  } finally {
    client.release()
  }
}
