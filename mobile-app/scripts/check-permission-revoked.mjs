/**
 * Step 194 — permission revoked mid-use must prompt re-grant (not silent fail).
 */
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  detectRevokedPermissions,
  PERMISSION_REVOKED_BOTH_BODY,
  PERMISSION_REVOKED_LOCATION_BODY,
  PERMISSION_REVOKED_MOTION_BODY,
  PERMISSION_REVOKED_TITLE,
  wouldSilentlyBreak,
} from '../services/permissionRevokedMath.ts'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const math = readFileSync(
  join(root, 'services/permissionRevokedMath.ts'),
  'utf8'
)
const watch = readFileSync(
  join(root, 'services/permissionRevokedWatch.ts'),
  'utf8'
)
const banner = readFileSync(
  join(root, 'components/permissions/PermissionRevokedBanner.tsx'),
  'utf8'
)
const home = readFileSync(join(root, 'app/index.tsx'), 'utf8')
const summary = readFileSync(join(root, '..', 'Summary.txt'), 'utf8')
const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'))

assert.match(math, /detectRevokedPermissions|PERMISSION_REVOKED_TITLE/)
assert.match(watch, /watchPermissionRevokes|reconcileRevokedPermissions|AppState/)
assert.match(watch, /setLocationSetupDone\(false\)|clearLocationSetup/)
assert.match(watch, /showPermissionRevokedAlert|Permission turned off/)
assert.match(banner, /permission-revoked-banner|Re-grant/)
assert.match(home, /watchPermissionRevokes|PermissionRevokedBanner/)
assert.match(home, /permission-revoked|setLocationSetupDone/)
assert.match(summary, /Step 194|6\.141.*194|revok/i)
assert.ok(pkg.scripts['test:permission-revoked'])

assert.equal(PERMISSION_REVOKED_TITLE, 'Permission turned off')
assert.match(PERMISSION_REVOKED_LOCATION_BODY, /silently|Location/i)
assert.match(PERMISSION_REVOKED_MOTION_BODY, /Motion|silently/i)
assert.match(PERMISSION_REVOKED_BOTH_BODY, /Location and motion/i)

// Sticky done + still granted → no revoke
assert.equal(
  detectRevokedPermissions({
    locationSetupDone: true,
    motionSetupDone: true,
    locationPhase: 'granted',
    motionPhase: 'granted',
  }),
  null
)

// Location revoked mid-use
const loc = detectRevokedPermissions({
  locationSetupDone: true,
  motionSetupDone: true,
  locationPhase: 'foreground_denied',
  motionPhase: 'granted',
})
assert.ok(loc)
assert.deepEqual(loc.revoked, ['location'])
assert.equal(loc.clearLocationSetup, true)
assert.equal(loc.clearMotionSetup, false)
assert.equal(loc.primaryRoute, '/location-permission')
assert.equal(loc.title, PERMISSION_REVOKED_TITLE)
assert.match(loc.body, /Location/)

// Motion revoked mid-use
const mot = detectRevokedPermissions({
  locationSetupDone: true,
  motionSetupDone: true,
  locationPhase: 'granted',
  motionPhase: 'accelerometer_denied',
})
assert.ok(mot)
assert.deepEqual(mot.revoked, ['motion'])
assert.equal(mot.primaryRoute, '/motion-permission')
assert.equal(mot.clearMotionSetup, true)

// Both revoked
const both = detectRevokedPermissions({
  locationSetupDone: true,
  motionSetupDone: true,
  locationPhase: 'background_denied',
  motionPhase: 'activity_denied',
})
assert.ok(both)
assert.deepEqual(both.revoked, ['location', 'motion'])
assert.equal(both.primaryRoute, '/location-permission')
assert.match(both.body, /Location and motion/)

// Setup never completed → not a mid-use revoke
assert.equal(
  detectRevokedPermissions({
    locationSetupDone: false,
    motionSetupDone: false,
    locationPhase: 'foreground_denied',
    motionPhase: 'accelerometer_denied',
  }),
  null
)

// Silent-break heuristic: sticky done without grant
assert.equal(wouldSilentlyBreak(true, false), true)
assert.equal(wouldSilentlyBreak(true, true), false)
assert.equal(wouldSilentlyBreak(false, false), false)

console.log(
  'Permission-revoked OK — mid-use revoke clears sticky flags + prompts re-grant'
)
console.log(
  'MANUAL: grant location/motion, use app, revoke in system Settings, return — alert + permission screen.'
)
