import { NextResponse } from 'next/server'
import { query } from '@/lib/db-pg'

const SECRET = process.env.ADMIN_SECRET

export async function POST(req) {
  const { secret } = await req.json()
  if (!SECRET || secret !== SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    await query(`
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
      )
    `)
    await query(`CREATE INDEX IF NOT EXISTS idx_dc_proyecto    ON detalle_cache(proyecto)`)
    await query(`CREATE INDEX IF NOT EXISTS idx_dc_mes         ON detalle_cache(EXTRACT(MONTH FROM fec_inicio_ar))`)
    await query(`CREATE INDEX IF NOT EXISTS idx_dc_codi_meta   ON detalle_cache(codi_meta)`)
    await query(`CREATE INDEX IF NOT EXISTS idx_dc_ruc         ON detalle_cache(ruc)`)
    await query(`CREATE INDEX IF NOT EXISTS idx_dc_flag_girado ON detalle_cache(flag_girado)`)
    await query(`CREATE INDEX IF NOT EXISTS idx_dc_fecha_fin   ON detalle_cache(fecha_fin)`)

    const [{ count }] = await query(`SELECT COUNT(*) AS count FROM detalle_cache`)
    return NextResponse.json({ ok: true, filas_actuales: Number(count) })
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
