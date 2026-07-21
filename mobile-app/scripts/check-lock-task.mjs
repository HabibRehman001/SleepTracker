/**
 * Step 159 — Lock Task (kiosk) Mode entry via SleepLockModule.enableLock().
 */
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const moduleKt = readFileSync(
  join(root, 'native/android/SleepLockModule.kt'),
  'utf8'
)
const xml = readFileSync(
  join(root, 'native/android/res/xml/device_admin.xml'),
  'utf8'
)

assert.match(moduleKt, /setLockTaskPackages/)
assert.match(moduleKt, /startLockTask\s*\(/)
assert.match(moduleKt, /stopLockTask\s*\(/)
assert.match(moduleKt, /fun disableLock/)
assert.match(moduleKt, /arrayOf\s*\(\s*packageName\s*\)/)
assert.match(moduleKt, /adminComponent|ComponentName/)
assert.match(moduleKt, /DeviceAdminReceiver/)
assert.match(moduleKt, /fun enableLock/)
assert.match(moduleKt, /isDeviceOwnerApp/)
assert.match(moduleKt, /E_NOT_DEVICE_OWNER|Device Owner/)
assert.match(xml, /<lock-task\s*\/>/)

console.log(
  'Lock Task entry OK — setLockTaskPackages + Activity.startLockTask in enableLock'
)
