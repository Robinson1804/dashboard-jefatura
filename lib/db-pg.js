// Driver PostgreSQL para Next.js
// En Railway usa DATABASE_URL (inyectado automáticamente por el servicio Postgres)
// En local usa las variables PG_* de .env.local
import { Pool } from 'pg'

const pool = process.env.DATABASE_URL
  ? new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
      max: 10,
      idleTimeoutMillis: 30000,
    })
  : new Pool({
      host: process.env.PG_HOST || 'localhost',
      port: Number(process.env.PG_PORT) || 5432,
      database: process.env.PG_DATABASE || 'dashboard_inei',
      user: process.env.PG_USER || 'postgres',
      password: process.env.PG_PASSWORD || '1234',
      max: 10,
      idleTimeoutMillis: 30000,
    })

export async function query(sql, params = []) {
  const client = await pool.connect()
  try {
    const res = await client.query(sql, params)
    return res.rows
  } finally {
    client.release()
  }
}
