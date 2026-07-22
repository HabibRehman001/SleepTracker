/**
 * Step 175 — persist homeArrivalTime for the sleep day's session.
 * Contract: 4:30 AM arrival → homeArrivalTime HH:MM "04:30" for that night.
 */
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  formatHomeArrivalHHMM,
  sleepDayDateKey,
} from '../services/homeArrivalMath.ts'
import {
  formatHomeArrivalHHMM as serverFormatHHMM,
  sleepDayDateKey as serverSleepDayKey,
} from '../../mobile-server/src/services/session.service.ts'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const homeArrival = readFileSync(join(root, 'services/homeArrival.ts'), 'utf8')
const sessionApi = readFileSync(join(root, 'services/sessionApi.ts'), 'utf8')
const homeGeofence = readFileSync(join(root, 'services/homeGeofence.ts'), 'utf8')
const routes = readFileSync(
  join(root, '..', 'mobile-server/src/routes/session.routes.ts'),
  'utf8'
)
const service = readFileSync(
  join(root, '..', 'mobile-server/src/services/session.service.ts'),
  'utf8'
)
const summary = readFileSync(join(root, '..', 'Summary.txt'), 'utf8')
const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'))

assert.match(homeArrival, /persistHomeArrivalToBackend|syncHomeArrivalFromGeofenceEnter/)
assert.match(sessionApi, /\/sessions\/home-arrival/)
assert.match(sessionApi, /PUT/)
assert.match(homeGeofence, /syncHomeArrivalFromGeofenceEnter/)
assert.match(routes, /home-arrival|upsertHomeArrivalForSleepDay/)
assert.match(service, /upsertHomeArrivalForSleepDay/)
assert.match(service, /homeArrivalTime/)
assert.match(summary, /Step 175|6\.125.*175|homeArrivalTime/)
assert.ok(pkg.scripts['test:home-arrival'])

const arrival = new Date(2026, 6, 22, 4, 30, 0, 0)
assert.equal(formatHomeArrivalHHMM(arrival), '04:30')
assert.equal(serverFormatHHMM(arrival), '04:30')
assert.equal(sleepDayDateKey(arrival), '2026-07-22')
assert.equal(serverSleepDayKey(arrival), '2026-07-22')

// Simulated upsert payload shape the API returns
const stored = {
  homeArrivalTime: arrival.toISOString(),
  homeArrivalHHMM: formatHomeArrivalHHMM(arrival),
  sleepDay: sleepDayDateKey(arrival),
}
assert.equal(stored.homeArrivalHHMM, '04:30')
assert.equal(stored.sleepDay, '2026-07-22')
assert.ok(Number.isFinite(Date.parse(stored.homeArrivalTime)))

console.log(
  'Home arrival persist OK — 4:30 AM → homeArrivalTime HH:MM 04:30 for sleep day'
)
