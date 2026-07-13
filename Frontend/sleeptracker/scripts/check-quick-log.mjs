/**
 * Step 58 — Quick Log partial entry; schema + UI contracts; averages tolerate nulls.
 */
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const dialog = readFileSync(
  join(root, 'src/features/sleep-entry/QuickLogDialog.tsx'),
  'utf8'
)
const actions = readFileSync(
  join(root, 'src/features/sleep-entry/QuickLogActions.tsx'),
  'utf8'
)
const logPage = readFileSync(
  join(root, 'src/features/sleep-entry/LogEntryPage.tsx'),
  'utf8'
)
const dash = readFileSync(
  join(root, 'src/features/dashboard/DashboardPage.tsx'),
  'utf8'
)
const today = readFileSync(
  join(root, 'src/features/dashboard/TodayCard.tsx'),
  'utf8'
)
const store = readFileSync(join(root, 'src/stores/ui-store.ts'), 'utf8')

assert.match(dialog, /quickLogSchema/)
assert.match(dialog, /bedTime/)
assert.match(dialog, /wakeTime/)
assert.match(dialog, /sleepQuality/)
assert.match(dialog, /mood:\s*null/)
assert.match(dialog, /food:\s*null/)
assert.match(dialog, /exercise:\s*null/)
assert.match(dialog, /environment:\s*null/)
assert.match(dialog, /health:\s*null/)
assert.match(actions, /Quick Log/)
assert.match(actions, /Full Log/)
assert.match(logPage, /QuickLogActions/)
assert.match(logPage, /id="full-log"/)
assert.match(dash, /QuickLogActions/)
assert.match(store, /quickLogOpen/)
assert.match(today, /quality \?\?|sleepQuality \?\?/)
assert.match(today, /todaySleep/)

const { quickLogSchema } = await import(
  '../src/features/sleep-entry/quickLog.schema.ts'
)
assert.equal(
  quickLogSchema.safeParse({
    bedTime: '23:00',
    wakeTime: '07:00',
    sleepQuality: 8,
  }).success,
  true
)
assert.equal(
  quickLogSchema.safeParse({
    bedTime: '23:00',
    wakeTime: '07:00',
    sleepQuality: 0,
  }).success,
  false
)

// Backend analytics null-safety: duration uses bed when estimated missing
const analytics = readFileSync(
  join(root, '../../Backend/src/services/analytics.service.ts'),
  'utf8'
)
assert.match(
  analytics,
  /estimatedSleepTime \?\? entry\.attemptSleepTime \?\? entry\.bedTime/
)
assert.match(analytics, /filter\(\(value\): value is number => value !== null\)/)

console.log('Quick Log contract OK — 3-field modal; partial + null-safe dashboard')
