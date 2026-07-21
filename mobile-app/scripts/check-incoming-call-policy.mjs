/**
 * Step 162 — incoming call allow-list + policy during lock.
 */
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  ASLEEP_CALLBACK_MESSAGE,
  decideIncomingCall,
  isAllowlistedNumber,
  normalizePhoneDigits,
  parseIncomingCallPolicy,
} from '../native/incomingCallPolicy.ts'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const gate = readFileSync(
  join(root, 'native/android/IncomingCallGate.kt'),
  'utf8'
)
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
const screen = readFileSync(join(root, 'app/call-allowlist.tsx'), 'utf8')
const settings = readFileSync(join(root, 'app/settings.tsx'), 'utf8')

assert.match(gate, /ALLOWLIST_ONLY/)
assert.match(gate, /DECLINE_NON_FAVORITES/)
assert.match(gate, /isAllowlisted/)
assert.match(gate, /fun decide/)

assert.match(screening, /IncomingCallGate/)
assert.match(screening, /getCallAllowlist/)
assert.match(screening, /REJECT_SILENT|REJECT_DECLINE/)
assert.match(screening, /isAllowlisted/)

assert.match(session, /call_allowlist|KEY_ALLOWLIST/)
assert.match(session, /ASLEEP_CALLBACK_MESSAGE/)
assert.match(moduleKt, /setCallAllowlist/)
assert.match(moduleKt, /setIncomingCallPolicy/)
assert.match(plugin, /IncomingCallGate\.kt/)

assert.match(screen, /call-allowlist-screen/)
assert.match(screen, /allowlist_only|decline_non_favorites/)
assert.match(settings, /call-allowlist/)

assert.equal(normalizePhoneDigits('+1 (555) 123-4567'), '15551234567')
assert.equal(
  isAllowlistedNumber('+15551234567', ['5551234567']),
  true
)
assert.equal(isAllowlistedNumber('9999999999', ['5551234567']), false)

assert.equal(
  decideIncomingCall({
    locked: true,
    isFavorite: true,
    policy: 'allowlist_only',
  }),
  'allow'
)
assert.equal(
  decideIncomingCall({
    locked: true,
    isFavorite: false,
    policy: 'allowlist_only',
  }),
  'reject_silent'
)
assert.equal(
  decideIncomingCall({
    locked: true,
    isFavorite: false,
    policy: 'decline_non_favorites',
  }),
  'reject_decline'
)
assert.equal(
  decideIncomingCall({
    locked: false,
    isFavorite: false,
    policy: 'allowlist_only',
  }),
  'allow'
)

assert.equal(parseIncomingCallPolicy('decline_non_favorites'), 'decline_non_favorites')
assert.equal(ASLEEP_CALLBACK_MESSAGE, 'Asleep — will call back.')

console.log(
  'Incoming call policy OK — allow-list favorites ring; others silent/decline'
)
