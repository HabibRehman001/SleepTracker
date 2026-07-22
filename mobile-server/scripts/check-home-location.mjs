/**
 * Step 137 — home location API contract (Mongo persistence).
 */
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const appSrc = readFileSync(join(root, 'src/app.ts'), 'utf8')
const model = readFileSync(join(root, 'src/models/HomeLocation.ts'), 'utf8')
const service = readFileSync(
  join(root, 'src/services/homeLocation.service.ts'),
  'utf8'
)
const routes = readFileSync(
  join(root, 'src/routes/homeLocation.routes.ts'),
  'utf8'
)

assert.match(appSrc, /home-location/)
assert.match(model, /latitude/)
assert.match(model, /longitude/)
assert.match(service, /upsertHomeLocation/)
assert.match(service, /getHomeLocationOrNull|getHomeLocation/)
assert.match(routes, /router\.(put|post)/)
assert.match(routes, /router\.get/)
assert.match(routes, /home:\s*null|getHomeLocationOrNull/)

const base = process.env.MOBILE_API_BASE ?? 'http://127.0.0.1:4001'
const lat = 31.52045
const lng = 74.35875

const putRes = await fetch(`${base}/home-location`, {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ latitude: lat, longitude: lng, label: 'home' }),
})
assert.equal(putRes.status, 200, `PUT status ${putRes.status}`)
const saved = await putRes.json()
assert.ok(Math.abs(saved.latitude - lat) < 1e-6)
assert.ok(Math.abs(saved.longitude - lng) < 1e-6)

const getRes = await fetch(`${base}/home-location`)
assert.equal(getRes.status, 200)
const loaded = await getRes.json()
const home = loaded.home ?? loaded
assert.ok(Math.abs(home.latitude - lat) < 1e-6)
assert.ok(Math.abs(home.longitude - lng) < 1e-6)
assert.equal(home.id, saved.id)

console.log('Home location API contract OK — PUT persist + GET { home }')
