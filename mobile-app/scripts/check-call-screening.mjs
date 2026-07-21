/**
 * Step 161 — CallScreeningService + DISALLOW_OUTGOING_CALLS during lock.
 */
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const screening = readFileSync(
  join(root, 'native/android/SleepLockCallScreeningService.kt'),
  'utf8'
)
const session = readFileSync(
  join(root, 'native/android/SleepLockSession.kt'),
  'utf8'
)
const moduleKt = readFileSync(
  join(root, 'native/android/SleepLockModule.kt'),
  'utf8'
)
const plugin = readFileSync(join(root, 'plugins/withDeviceAdmin.js'), 'utf8')

assert.match(screening, /class SleepLockCallScreeningService\s*:\s*CallScreeningService/)
assert.match(screening, /onScreenCall/)
assert.match(screening, /setDisallowCall\s*\(\s*true\s*\)/)
assert.match(screening, /IncomingCallGate|isAllowlisted|getCallAllowlist/)
assert.match(screening, /SleepLockSession\.isLocked/)

assert.match(session, /object SleepLockSession/)
assert.match(session, /KEY_LOCKED|setLocked/)

assert.match(moduleKt, /DISALLOW_OUTGOING_CALLS/)
assert.match(moduleKt, /addUserRestriction/)
assert.match(moduleKt, /clearUserRestriction/)
assert.match(moduleKt, /SleepLockSession\.setLocked/)

assert.match(plugin, /SleepLockCallScreeningService/)
assert.match(plugin, /BIND_SCREENING_SERVICE/)
assert.match(plugin, /android\.telecom\.CallScreeningService/)
assert.match(plugin, /SleepLockCallScreeningService\.kt/)
assert.match(plugin, /SleepLockSession\.kt/)

console.log(
  'Call block OK — CallScreeningService + DISALLOW_OUTGOING_CALLS while locked'
)
