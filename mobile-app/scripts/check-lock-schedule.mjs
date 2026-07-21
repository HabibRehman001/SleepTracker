/**
 * Step 150 — hold-to-confirm lock + Settings read-only schedule.
 */
import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { useScheduleStore } from '../store/scheduleStore.ts'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')

assert.ok(existsSync(join(root, 'app/lock-schedule.tsx')))
assert.ok(existsSync(join(root, 'app/settings.tsx')))
assert.ok(existsSync(join(root, 'services/scheduleApi.ts')))
assert.ok(existsSync(join(root, 'components/HoldToConfirm.tsx')))

const lockScreen = readFileSync(join(root, 'app/lock-schedule.tsx'), 'utf8')
const settings = readFileSync(join(root, 'app/settings.tsx'), 'utf8')
const api = readFileSync(join(root, 'services/scheduleApi.ts'), 'utf8')
const hold = readFileSync(join(root, 'components/HoldToConfirm.tsx'), 'utf8')
const baseline = readFileSync(join(root, 'app/baseline-results.tsx'), 'utf8')
const layout = readFileSync(join(root, 'app/_layout.tsx'), 'utf8')
const home = readFileSync(join(root, 'app/index.tsx'), 'utf8')
const store = readFileSync(join(root, 'store/scheduleStore.ts'), 'utf8')

assert.match(api, /async function lockSchedule|export async function lockSchedule/)
assert.match(api, /Schedule already locked/)
assert.match(api, /fetchSchedule|GET.*schedule|\/schedule/)
assert.match(api, /lockedAt/)

assert.match(lockScreen, /This cannot be changed later\. Are you sure\?/)
assert.match(lockScreen, /HoldToConfirm|lock-schedule-hold/)
assert.match(hold, /onPressIn|Hold to/)

assert.match(settings, /settings-schedule-readonly|settings-sleep-time/)
assert.match(settings, /cannot be edited|Locked/)
assert.doesNotMatch(settings, /TextInput/)
assert.doesNotMatch(settings, /onChangeText/)

assert.match(baseline, /lock-schedule/)
assert.match(layout, /lock-schedule/)
assert.match(layout, /settings/)
assert.match(home, /open-settings|\/settings/)
assert.match(store, /lockedAt|applyLockedSchedule/)

// Local immutability after lockIn
useScheduleStore.getState().clearSchedule()
useScheduleStore.getState().setSchedule('04:00', '12:00')
useScheduleStore.getState().lockIn()
assert.equal(useScheduleStore.getState().lockedIn, true)
assert.ok(useScheduleStore.getState().lockedAt)
useScheduleStore.getState().setSchedule('05:00', '11:30')
assert.equal(useScheduleStore.getState().bedtime, '04:00')
assert.equal(useScheduleStore.getState().waketime, '12:00')

console.log(
  'Lock schedule UI contract OK — hold-to-confirm + Settings read-only'
)
