/**
 * Step 165 — Crash/recovery while locked: START_STICKY FGS relaunches Lock Task.
 */
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const watchdog = readFileSync(
  join(root, 'native/android/SleepLockWatchdogService.kt'),
  'utf8'
)
const moduleKt = readFileSync(
  join(root, 'native/android/SleepLockModule.kt'),
  'utf8'
)
const plugin = readFileSync(join(root, 'plugins/withDeviceAdmin.js'), 'utf8')
const app = JSON.parse(readFileSync(join(root, 'app.json'), 'utf8'))

assert.match(watchdog, /class SleepLockWatchdogService\s*:\s*Service/)
assert.match(watchdog, /START_STICKY/)
assert.match(watchdog, /startForeground/)
assert.match(watchdog, /bringLockedActivityToFront|startActivity/)
assert.match(watchdog, /SleepLockSession\.isLocked/)

assert.match(moduleKt, /SleepLockWatchdogService\.start/)
assert.match(moduleKt, /SleepLockWatchdogService\.stop/)
assert.match(moduleKt, /onHostResume/)
assert.match(moduleKt, /startLockTask/)

assert.match(plugin, /SleepLockWatchdogService/)
assert.match(plugin, /specialUse|FOREGROUND_SERVICE_SPECIAL_USE/)
assert.match(plugin, /SleepLockWatchdogService\.kt/)

const perms = app.expo.android?.permissions ?? []
assert.ok(
  perms.includes('FOREGROUND_SERVICE_SPECIAL_USE'),
  'app.json needs FOREGROUND_SERVICE_SPECIAL_USE'
)

console.log(
  'Lock crash recovery OK — START_STICKY watchdog + Lock Task re-engage on resume'
)
console.log(
  'Device test: while locked, prefer `adb shell am kill PACKAGE` (START_STICKY).'
)
console.log(
  '`am force-stop` sets stopped-state and blocks auto-restart on stock Android.'
)
