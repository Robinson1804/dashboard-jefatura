// Caché en memoria con TTL para las API routes
// Persiste entre requests en el proceso Node.js (singleton)

const store = new Map()

export function getCached(key) {
  const entry = store.get(key)
  if (!entry) return null
  if (Date.now() > entry.expires) {
    store.delete(key)
    return null
  }
  return entry.data
}

export function setCached(key, data, ttlMinutes = 10) {
  store.set(key, { data, expires: Date.now() + ttlMinutes * 60 * 1000 })
}

export function invalidarCache() {
  store.clear()
}
