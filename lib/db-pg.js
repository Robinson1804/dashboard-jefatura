// Driver PostgreSQL para Next.js
// Reemplaza lib/db.js cuando la tabla detalle_cache esté lista
import { Pool } from 'pg'

const pool = new Pool({
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
