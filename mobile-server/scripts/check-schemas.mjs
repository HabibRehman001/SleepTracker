/**
 * Step 126 — ActivitySession + Schedule Mongoose schemas.
 */
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  ACTIVITY_SOURCES,
  activitySessionSchema,
  scheduleSchema,
} from '../src/models/index.ts'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const activitySrc = readFileSync(
  join(root, 'src/models/ActivitySession.ts'),
  'utf8'
)
const scheduleSrc = readFileSync(join(root, 'src/models/Schedule.ts'), 'utf8')

assert.deepEqual([...ACTIVITY_SOURCES], ['baseline-auto', 'locked-schedule'])

assert.match(activitySrc, /date:\s*\{/)
assert.match(activitySrc, /bedTime/)
assert.match(activitySrc, /wakeTime/)
assert.match(activitySrc, /stepsCount/)
assert.match(activitySrc, /homeArrivalTime/)
assert.match(activitySrc, /baseline-auto/)
assert.match(activitySrc, /locked-schedule/)

assert.match(scheduleSrc, /sleepTime/)
assert.match(scheduleSrc, /wakeTime/)
assert.match(scheduleSrc, /lockedAt/)
assert.match(scheduleSrc, /Step 150/)

const activityPaths = Object.keys(activitySessionSchema.paths)
assert.ok(activityPaths.includes('date'))
assert.ok(activityPaths.includes('bedTime'))
assert.ok(activityPaths.includes('wakeTime'))
assert.ok(activityPaths.includes('source'))
assert.ok(activityPaths.includes('stepsCount'))
assert.ok(activityPaths.includes('homeArrivalTime'))

const schedulePaths = Object.keys(scheduleSchema.paths)
assert.ok(schedulePaths.includes('sleepTime'))
assert.ok(schedulePaths.includes('wakeTime'))
assert.ok(schedulePaths.includes('lockedAt'))

const sourceEnum = activitySessionSchema.path('source').options.enum
assert.deepEqual(sourceEnum, ['baseline-auto', 'locked-schedule'])

console.log('Mongoose schemas contract OK — ActivitySession + Schedule')
