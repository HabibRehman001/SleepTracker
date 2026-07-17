/**
 * Step 139 — Family Controls / Screen Time entitlement checklist contract.
 */
import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  FAMILY_CONTROLS_CHECKLIST,
  FAMILY_CONTROLS_REQUEST_URL,
  NOTIFICATION_ONLY_MODE_LABEL,
} from '../native/familyControls.ts'
import { classifyLockCapability } from '../native/lockCapability.ts'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const screen = readFileSync(
  join(root, 'app/family-controls-setup.tsx'),
  'utf8'
)
const layout = readFileSync(join(root, 'app/_layout.tsx'), 'utf8')
const deviceOwner = readFileSync(
  join(root, 'app/device-owner-setup.tsx'),
  'utf8'
)
const index = readFileSync(join(root, 'app/index.tsx'), 'utf8')
const store = readFileSync(join(root, 'store/useAppStore.ts'), 'utf8')
const nativeIndex = readFileSync(join(root, 'native/index.ts'), 'utf8')

assert.ok(existsSync(join(root, 'app/family-controls-setup.tsx')))
assert.match(screen, /FAMILY_CONTROLS_CHECKLIST/)
assert.match(screen, /notification-only|NOTIFICATION_ONLY_MODE/)
assert.match(screen, /testID=["']notification-only-mode-banner["']/)
assert.match(screen, /testID=["']family-controls-request-url["']/)
assert.match(layout, /family-controls-setup/)
assert.match(deviceOwner, /family-controls-setup/)
assert.match(index, /notification-only-mode-badge|NOTIFICATION_ONLY_MODE/)
assert.match(store, /familyControlsSetupDone/)
assert.match(nativeIndex, /hasFamilyControlsEntitlement/)

assert.ok(FAMILY_CONTROLS_CHECKLIST.length >= 4)
assert.match(FAMILY_CONTROLS_REQUEST_URL, /family-controls/)
assert.equal(NOTIFICATION_ONLY_MODE_LABEL, 'Notification-only mode')

assert.equal(classifyLockCapability(true, false), 'full')
assert.equal(classifyLockCapability(false, true), 'soft')
assert.equal(classifyLockCapability(false, false), 'notification-only')

console.log(
  'Family Controls setup contract OK — checklist + notification-only fallback'
)
