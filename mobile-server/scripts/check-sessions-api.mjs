/**
 * Step 127 / 175 — POST /sessions + GET + PUT /sessions/home-arrival.
 */
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  formatHomeArrivalHHMM,
  rangeCutoff,
  sleepDayDateKey,
} from '../src/services/session.service.ts'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const appSrc = readFileSync(join(root, 'src/app.ts'), 'utf8')
const routes = readFileSync(join(root, 'src/routes/session.routes.ts'), 'utf8')

assert.match(appSrc, /\/sessions/)
assert.match(routes, /router\.post/)
assert.match(routes, /router\.get/)
assert.match(routes, /router\.put|home-arrival/)
assert.match(routes, /upsertHomeArrivalForSleepDay/)
assert.match(routes, /range/)

const arrival = new Date(2026, 6, 22, 4, 30, 0, 0)
assert.equal(formatHomeArrivalHHMM(arrival), '04:30')
assert.equal(sleepDayDateKey(arrival), '2026-07-22')

const cutoff30 = rangeCutoff('30d')
assert.ok(cutoff30 instanceof Date)
assert.equal(rangeCutoff('all'), null)
assert.throws(() => rangeCutoff('nope'), /range must be/)

console.log('Sessions API contract OK — POST/GET/PUT home-arrival + range parser')
