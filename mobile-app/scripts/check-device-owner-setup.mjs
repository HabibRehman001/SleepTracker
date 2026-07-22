/**
 * Step 138 — Device Owner setup screen contract.
 */
import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { DEVICE_OWNER_ADB_COMMAND } from '../native/deviceOwner.ts'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const screen = readFileSync(join(root, 'app/device-owner-setup.tsx'), 'utf8')
const layout = readFileSync(join(root, 'app/_layout.tsx'), 'utf8')
const setHome = readFileSync(join(root, 'app/set-home.tsx'), 'utf8')
const index = readFileSync(join(root, 'app/index.tsx'), 'utf8')
const receiver = readFileSync(
  join(root, 'native/android/DeviceAdminReceiver.kt'),
  'utf8'
)

assert.ok(existsSync(join(root, 'app/device-owner-setup.tsx')))
assert.match(screen, /DEVICE_OWNER_ADB_COMMAND/)
assert.match(screen, /testID=["']device-owner-adb-command["']/)
assert.match(screen, /testID=["']device-owner-adb-copy["']/)
assert.match(screen, /isDeviceOwner/)
assert.match(screen, /FULL_LOCK_ENABLED_LABEL|Full lock enabled/)
assert.match(layout, /device-owner-setup/)
assert.match(setHome, /router\.replace\(['"]\/['"]/)
// Client rejected DO upsell on home — screen stays for engineering; home must not link it.
assert.doesNotMatch(index, /open-device-owner-setup|Optional:\s*full lock/)
assert.match(index, /full-lock-enabled-badge|FULL_LOCK_ENABLED_LABEL|soft-lock-enabled-badge/)
assert.doesNotMatch(index, /!deviceOwnerSetupDone/)
assert.match(screen, /soft lock|optional/i)
assert.match(screen, /device-owner-distribution-note|personal-sideload|DISTRIBUTION_MODEL/)
assert.match(receiver, /DeviceAdminReceiver/)
assert.ok(existsSync(join(root, 'plugins/withDeviceAdmin.js')))
assert.match(
  DEVICE_OWNER_ADB_COMMAND,
  /com\.sleeptracker\.sleeplock\/\.DeviceAdminReceiver/
)

console.log('Device Owner setup contract OK — optional full lock + ADB')
