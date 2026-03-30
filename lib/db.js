import { Pool } from 'msnodesqlv8'

const connStr = `Driver={ODBC Driver 17 for SQL Server};Server=${process.env.DB_SERVER};Database=${process.env.DB_DATABASE};Trusted_Connection=yes;TrustServerCertificate=yes;`

let pool = null

async function getPool() {
  if (!pool) {
    pool = new Pool({ connectionString: connStr })
    await pool.promises.open()
  }
  return pool
}

// Ejecuta una query y devuelve el array de filas
export async function query(sql, params = []) {
  const p = await getPool()
  const res = params.length > 0
    ? await p.promises.query(sql, params)
    : await p.promises.query(sql)
  return res.results[0] ?? []
}
