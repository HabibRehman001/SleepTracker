/**
 * Step 164 — Emergency dial must not be broken by CallScreening; low-battery hint.
 * Classification tests only — never dial real emergency numbers.
 */
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  decideIncomingCall,
  EMERGENCY_MANUAL_TEST_NOTE,
  isEmergencyNumber,
  LOW_BATTERY_LOCKED_HINT,
  LOW_BATTERY_THRESHOLD,
} from '../native/incomingCallPolicy.ts'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const emergencyKt = readFileSync(
  join(root, 'native/android/EmergencyNumbers.kt'),
  'utf8'
)
const screening = readFileSync(
  join(root, 'native/android/SleepLockCallScreeningService.kt'),
  'utf8'
)
const moduleKt = readFileSync(
  join(root, 'native/android/SleepLockModule.kt'),
  'utf8'
)
const locked = readFileSync(join(root, 'app/locked.tsx'), 'utf8')
const plugin = readFileSync(join(root, 'plugins/withDeviceAdmin.js'), 'utf8')

assert.match(emergencyKt, /WELL_KNOWN/)
assert.match(emergencyKt, /isEmergencyDigits/)
assert.match(emergencyKt, /MANUAL_TEST_NOTE|never dial/i)

assert.match(screening, /isEmergencyCall|EmergencyNumbers/)
assert.match(screening, /PROPERTY_EMERGENCY_CALLBACK_MODE|isEmergencyNumber/)
assert.match(screening, /Allowing emergency/)

assert.match(moduleKt, /DISALLOW_OUTGOING_CALLS/)
assert.match(moduleKt, /emergency/i)
assert.match(moduleKt, /getBatteryLevel/)
assert.match(plugin, /EmergencyNumbers\.kt/)

assert.match(locked, /LOW_BATTERY_LOCKED_HINT|locked-low-battery/)
assert.match(locked, /getBatteryLevel/)

assert.equal(isEmergencyNumber('911'), true)
assert.equal(isEmergencyNumber('112'), true)
assert.equal(isEmergencyNumber('1122'), true)
assert.equal(isEmergencyNumber('15'), true)
assert.equal(isEmergencyNumber('5551234567'), false)

assert.equal(
  decideIncomingCall({
    locked: true,
    isFavorite: false,
    policy: 'allowlist_only',
    isEmergency: true,
  }),
  'allow'
)
assert.equal(
  decideIncomingCall({
    locked: true,
    isFavorite: false,
    policy: 'allowlist_only',
    isEmergency: false,
  }),
  'reject_silent'
)

assert.equal(LOW_BATTERY_THRESHOLD, 0.15)
assert.match(LOW_BATTERY_LOCKED_HINT, /Emergency calling still works/i)
assert.match(EMERGENCY_MANUAL_TEST_NOTE, /never dial real emergency/i)

console.log(
  'Emergency edge cases OK — screening allows emergency; classify-only tests (never dial 911)'
)
