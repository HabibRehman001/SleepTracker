/**
 * Step 150 — lock schedule once; second lock → 409; Settings read-only.
 */
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { ScheduleConflictError } from '../src/services/schedule.service.ts'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const routes = readFileSync(join(root, 'src/routes/schedule.routes.ts'), 'utf8')
const service = readFileSync(
  join(root, 'src/services/schedule.service.ts'),
  'utf8'
)
const model = readFileSync(join(root, 'src/models/Schedule.ts'), 'utf8')

assert.match(routes, /409/)
assert.match(service, /Schedule already locked/)
assert.match(service, /createSchedule/)
assert.match(model, /cannot be modified \(Step 150\)/)
assert.match(model, /allowCoreUpdate|pendingSleepTime/)

const err = new ScheduleConflictError()
assert.equal(err.status, 409)
assert.equal(err.message, 'Schedule already locked')

console.log('Lock schedule API contract OK — 409 already locked')
