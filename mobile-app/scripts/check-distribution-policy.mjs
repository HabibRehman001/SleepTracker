/**
 * Step 195 — distribution / store-policy decision before Step 196 polish.
 */
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  assertStoreListingCopyIsSoftLockSafe,
  DEVICE_OWNER_DISTRIBUTION_NOTE,
  DISTRIBUTION_DECISION_SUMMARY,
  DISTRIBUTION_IMPLICATIONS_FOR_STEP_196,
  DISTRIBUTION_MODEL,
  DISTRIBUTION_RATIONALE,
  isPersonalSideloadModel,
  SIDELOAD_FULL_LOCK_CLAIMS,
  STORE_ALLOWED_SOFT_LOCK_CLAIMS,
  STORE_FORBIDDEN_CLAIMS,
} from '../services/distributionPolicyMath.ts'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const math = readFileSync(
  join(root, 'services/distributionPolicyMath.ts'),
  'utf8'
)
const screen = readFileSync(join(root, 'app/device-owner-setup.tsx'), 'utf8')
const deviceOwner = readFileSync(join(root, 'native/deviceOwner.ts'), 'utf8')
const summary = readFileSync(join(root, '..', 'Summary.txt'), 'utf8')
const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'))

assert.equal(DISTRIBUTION_MODEL, 'personal-sideload')
assert.equal(isPersonalSideloadModel(), true)
assert.match(DISTRIBUTION_DECISION_SUMMARY, /sideload|Play Store/i)
assert.match(DEVICE_OWNER_DISTRIBUTION_NOTE, /sideload|Play Store/i)
assert.ok(DISTRIBUTION_RATIONALE.length >= 3)
assert.ok(DISTRIBUTION_IMPLICATIONS_FOR_STEP_196.length >= 3)
assert.ok(STORE_FORBIDDEN_CLAIMS.some((c) => /locks your phone/i.test(c)))
assert.ok(STORE_FORBIDDEN_CLAIMS.some((c) => /blocks calls/i.test(c)))
assert.ok(STORE_ALLOWED_SOFT_LOCK_CLAIMS.some((c) => /soft lock/i.test(c)))
assert.ok(
  SIDELOAD_FULL_LOCK_CLAIMS.some((c) => /ADB|Device Owner/i.test(c))
)

assert.match(math, /DISTRIBUTION_MODEL|personal-sideload|STORE_FORBIDDEN_CLAIMS/)
assert.match(screen, /device-owner-distribution-note|DISTRIBUTION_MODEL/)
assert.match(screen, /DEVICE_OWNER_DISTRIBUTION_NOTE/)
assert.match(deviceOwner, /sideload|Play Store/)
assert.match(summary, /Step 195|6\.142.*195|personal-sideload|Play Store/)
assert.ok(pkg.scripts['test:distribution-policy'])

// Soft-lock listing OK
const soft = assertStoreListingCopyIsSoftLockSafe(
  'Sleep Lock helps you stick to a sleep schedule with reminders, a pre-lock countdown, and a calm sleep lock screen.'
)
assert.equal(soft.ok, true)
assert.equal(soft.violations.length, 0)

// Consumer listing that over-promises full lock → reject
const bad = assertStoreListingCopyIsSoftLockSafe(
  'This app locks your phone at bedtime and blocks calls until morning.'
)
assert.equal(bad.ok, false)
assert.ok(bad.violations.includes('locks your phone'))
assert.ok(bad.violations.includes('blocks calls'))

const kiosk = assertStoreListingCopyIsSoftLockSafe(
  'Enterprise kiosk mode with Device Owner enrollment.'
)
assert.equal(kiosk.ok, false)

console.log(
  'Distribution policy OK — personal-sideload for full lock; store copy must stay soft-lock honest'
)
