/**
 * Step 189 — Phase 1 Step 105 JSON export contract.
 * Mobile ActivitySessions → { format, exportedAt, entryCount, entries[] }.
 */
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  activitySessionToPhase1Entry,
  collapseSessionsByDate,
  filterSessionsByMonth,
  sessionsToPhase1JsonExport,
  utcDateKey,
  utcMonthKeyFromDate,
} from '../src/services/phase1JsonExport.ts'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const appSrc = readFileSync(join(root, 'src/app.ts'), 'utf8')
const routes = readFileSync(join(root, 'src/routes/export.routes.ts'), 'utf8')
const service = readFileSync(
  join(root, 'src/services/export.service.ts'),
  'utf8'
)
const math = readFileSync(
  join(root, 'src/services/phase1JsonExport.ts'),
  'utf8'
)
const summary = readFileSync(join(root, '..', 'Summary.txt'), 'utf8')
const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'))

assert.match(appSrc, /\/export/)
assert.match(routes, /\/json/)
assert.match(service, /exportPhase1Json|sessionsToPhase1JsonExport/)
assert.match(math, /format: 'json'|Phase1JsonExport|activitySessionToPhase1Entry/)
assert.match(summary, /Step 189|6\.137.*189|export\/json/)
assert.ok(pkg.scripts['test:phase1-export'])

const bed = new Date('2026-06-15T22:30:00.000Z')
const wake = new Date('2026-06-16T06:30:00.000Z')
const date = new Date('2026-06-15T00:00:00.000Z')

assert.equal(utcMonthKeyFromDate(date), '2026-06')
assert.equal(utcDateKey(date), '2026-06-15')

const entry = activitySessionToPhase1Entry({
  _id: 'abc123',
  date,
  bedTime: bed,
  wakeTime: wake,
  source: 'locked-schedule',
  stepsCount: 8200,
})

assert.equal(entry.id, 'abc123')
assert.equal(entry.bedTime?.toISOString(), bed.toISOString())
assert.equal(entry.wakeTime?.toISOString(), wake.toISOString())
assert.equal(entry.attemptSleepTime?.toISOString(), bed.toISOString())
assert.equal(entry.outOfBedTime?.toISOString(), wake.toISOString())
assert.equal(entry.sleepQuality, null)
assert.equal(entry.mood, null)
assert.equal(entry.food, null)
assert.equal(entry.exercise, null)
assert.equal(entry.environment, null)
assert.equal(entry.health, null)
assert.match(entry.notes ?? '', /Sleep Lock export/)
assert.match(entry.notes ?? '', /stepsCount=8200/)
assert.match(entry.notes ?? '', /locked-schedule/)

// Prefer locked-schedule when collapsing same day
const collapsed = collapseSessionsByDate([
  {
    _id: 'base',
    date,
    bedTime: bed,
    wakeTime: wake,
    source: 'baseline-auto',
    stepsCount: 100,
    updatedAt: new Date('2026-06-16T12:00:00.000Z'),
  },
  {
    _id: 'lock',
    date,
    bedTime: bed,
    wakeTime: wake,
    source: 'locked-schedule',
    stepsCount: 8200,
    updatedAt: new Date('2026-06-16T08:00:00.000Z'),
  },
])
assert.equal(collapsed.length, 1)
assert.equal(String(collapsed[0]._id), 'lock')

const otherMonth = new Date('2026-07-01T00:00:00.000Z')
const filtered = filterSessionsByMonth(
  [
    { date, bedTime: bed, wakeTime: wake },
    {
      date: otherMonth,
      bedTime: otherMonth,
      wakeTime: new Date('2026-07-01T08:00:00.000Z'),
    },
  ],
  '2026-06'
)
assert.equal(filtered.length, 1)

const fixedNow = new Date('2026-07-22T12:00:00.000Z')
const payload = sessionsToPhase1JsonExport(
  [
    {
      _id: 's1',
      date,
      bedTime: bed,
      wakeTime: wake,
      source: 'locked-schedule',
      stepsCount: 5000,
    },
  ],
  { now: fixedNow }
)

assert.equal(payload.format, 'json')
assert.equal(payload.exportedAt, fixedNow.toISOString())
assert.equal(payload.entryCount, 1)
assert.equal(payload.entries.length, 1)
assert.equal(payload.origin, 'mobile-server')

// Wire format (Date → ISO) — what Phase 1 download / importer sees
const wire = JSON.parse(JSON.stringify(payload))
assert.equal(wire.format, 'json')
assert.equal(wire.entryCount, 1)
assert.equal(typeof wire.entries[0].date, 'string')
assert.equal(typeof wire.entries[0].bedTime, 'string')
assert.equal(wire.entries[0].mood, null)
assert.ok(wire.entries[0].notes.includes('stepsCount=5000'))

// Month filter on builder
const juneOnly = sessionsToPhase1JsonExport(
  [
    {
      _id: 's1',
      date,
      bedTime: bed,
      wakeTime: wake,
      source: 'locked-schedule',
    },
    {
      _id: 's2',
      date: otherMonth,
      bedTime: otherMonth,
      wakeTime: new Date('2026-07-01T08:00:00.000Z'),
      source: 'baseline-auto',
    },
  ],
  { month: '2026-06', now: fixedNow }
)
assert.equal(juneOnly.entryCount, 1)
assert.equal(juneOnly.entries[0].id, 's1')

console.log(
  'Phase 1 export OK — GET /export/json Step 105 shape from ActivitySessions'
)
