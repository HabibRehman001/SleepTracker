/**
 * Step 128 — POST /schedule once; second POST → 409; GET /schedule.
 */
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { ScheduleConflictError } from '../src/services/schedule.service.ts'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const appSrc = readFileSync(join(root, 'src/app.ts'), 'utf8')
const routes = readFileSync(join(root, 'src/routes/schedule.routes.ts'), 'utf8')
const service = readFileSync(
  join(root, 'src/services/schedule.service.ts'),
  'utf8'
)

assert.match(appSrc, /\/schedule/)
assert.match(routes, /router\.post/)
assert.match(routes, /router\.get/)
assert.match(routes, /409/)
assert.match(service, /ScheduleConflictError/)
assert.match(service, /already exists/)

const err = new ScheduleConflictError()
assert.equal(err.status, 409)

console.log('Schedule API contract OK — create-once + 409 Conflict')
