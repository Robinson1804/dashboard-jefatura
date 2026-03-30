import { NextResponse } from 'next/server'
import { query } from '@/lib/db-pg'
import { getCached, setCached } from '@/lib/cache'
import { warmupCache } from '@/lib/warmup'

export async function GET() {
  const cached = getCached('proyectos_lista')
  if (cached) { warmupCache(); return NextResponse.json(cached) }

  try {
    const rows = await query(`SELECT DISTINCT proyecto, codi_meta FROM detalle_cache ORDER BY proyecto`)
    const data = { proyectos: rows.map(r => ({ PROYECTO: r.proyecto, codi_Meta: r.codi_meta })) }
    setCached('proyectos_lista', data, 30)
    warmupCache()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Error API proyectos:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
