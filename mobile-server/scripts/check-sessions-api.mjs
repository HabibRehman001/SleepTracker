/**
 * Step 127 — POST /sessions + GET /sessions?range=30d wired.
 */
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { rangeCutoff } from '../src/services/session.service.ts'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const appSrc = readFileSync(join(root, 'src/app.ts'), 'utf8')
const routes = readFileSync(join(root, 'src/routes/session.routes.ts'), 'utf8')

assert.match(appSrc, /\/sessions/)
assert.match(routes, /router\.post/)
assert.match(routes, /router\.get/)
assert.match(routes, /range/)

const cutoff30 = rangeCutoff('30d')
assert.ok(cutoff30 instanceof Date)
assert.equal(rangeCutoff('all'), null)
assert.throws(() => rangeCutoff('nope'), /range must be/)

console.log('Sessions API contract OK — POST/GET + range parser')
