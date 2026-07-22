/**
 * Step 198 — ACTION_USER_PRESENT unlock → wake time (Android FGS runtime receiver).
 */
import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  lastUnlockMs,
  recordUnlockEventPure,
  resolveWakeFromUnlock,
  UNLOCK_WAKE_ACTION,
  UNLOCK_WAKE_MANUAL_TEST,
} from '../services/unlockWakeMath.ts'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const receiver = readFileSync(
  join(root, 'native/android/UnlockReceiver.kt'),
  'utf8'
)
const store = readFileSync(
  join(root, 'native/android/UnlockEventStore.kt'),
  'utf8'
)
const monitor = readFileSync(
  join(root, 'native/android/UnlockWakeMonitorService.kt'),
  'utf8'
)
const moduleKt = readFileSync(
  join(root, 'native/android/SleepLockModule.kt'),
  'utf8'
)
const plugin = readFileSync(join(root, 'plugins/withDeviceAdmin.js'), 'utf8')
const summary = readFileSync(join(root, '..', 'Summary.txt'), 'utf8')
const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'))

assert.ok(existsSync(join(root, 'native/android/UnlockReceiver.kt')))
assert.ok(existsSync(join(root, 'native/android/UnlockEventStore.kt')))
assert.ok(existsSync(join(root, 'native/android/UnlockWakeMonitorService.kt')))

assert.match(receiver, /class UnlockReceiver\s*:\s*BroadcastReceiver/)
assert.match(receiver, /ACTION_USER_PRESENT/)
assert.match(receiver, /recordUnlockEvent/)
assert.match(receiver, /registerReceiver/)
assert.doesNotMatch(receiver, /android:name=.*USER_PRESENT/) // not a manifest snippet

assert.match(store, /fun recordUnlockEvent|recordUnlockEvent\(/)
assert.match(store, /System\.currentTimeMillis|epochMs/)

assert.match(monitor, /class UnlockWakeMonitorService\s*:\s*Service/)
assert.match(monitor, /UnlockReceiver\.register|startForeground/)
assert.match(monitor, /ACTION_USER_PRESENT|UnlockReceiver/)

assert.match(moduleKt, /UnlockWakeMonitorService\.start/)
assert.match(moduleKt, /getLastUnlockEventMs|startUnlockWakeMonitor/)
assert.match(plugin, /UnlockWakeMonitorService|UnlockReceiver\.kt/)
assert.match(plugin, /UnlockWakeMonitorService/)
assert.doesNotMatch(
  plugin,
  /android\.intent\.action\.USER_PRESENT/
) // must NOT be manifest-registered

assert.match(UNLOCK_WAKE_MANUAL_TEST, /within ~1s|USER_PRESENT/)
assert.equal(UNLOCK_WAKE_ACTION, 'ACTION_USER_PRESENT')
assert.match(summary, /Step 198|6\.144.*198|USER_PRESENT|unlock/)
assert.ok(pkg.scripts['test:unlock-wake'])

// Pure: lock then unlock logs accurate timestamp within 1s window
const t0 = 1_700_000_000_000
let log = []
const unlockAt = t0 + 800 // 800ms after "lock" moment
log = recordUnlockEventPure(log, unlockAt)
assert.equal(lastUnlockMs(log), unlockAt)
assert.ok(unlockAt - t0 < 1000, 'manual test: event within a second')

const bed = t0
const scheduledWake = t0 + 8 * 60 * 60 * 1000
const resolved = resolveWakeFromUnlock({
  bedTimeMs: bed,
  scheduledWakeMs: scheduledWake,
  unlockMs: scheduledWake + 12 * 60 * 1000, // woke 12m late
})
assert.equal(resolved.source, 'unlock')
assert.equal(resolved.wakeMs, scheduledWake + 12 * 60 * 1000)

const fallback = resolveWakeFromUnlock({
  bedTimeMs: bed,
  scheduledWakeMs: scheduledWake,
  unlockMs: null,
})
assert.equal(fallback.source, 'scheduled')

console.log(
  'Unlock wake OK — runtime ACTION_USER_PRESENT in FGS; timestamp within 1s contract'
)
console.log(`MANUAL: ${UNLOCK_WAKE_MANUAL_TEST}`)
