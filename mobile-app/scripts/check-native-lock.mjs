/**
 * Step 116/118/138 — SleepLockModule + Device Owner isDeviceOwner().
 */
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createMockSleepLock } from '../native/mockSleepLock.ts'
import {
  DEVICE_OWNER_ADB_COMMAND,
  FULL_LOCK_ENABLED_LABEL,
} from '../native/deviceOwner.ts'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const indexSrc = readFileSync(join(root, 'native/index.ts'), 'utf8')
const getSrc = readFileSync(join(root, 'native/getSleepLockModule.ts'), 'utf8')
const androidSrc = readFileSync(
  join(root, 'native/androidSleepLock.ts'),
  'utf8'
)

assert.match(indexSrc, /export interface SleepLockModule/)
assert.match(indexSrc, /enableLock\(\):\s*Promise<void>/)
assert.match(indexSrc, /disableLock\(\):\s*Promise<void>/)
assert.match(indexSrc, /isLocked\(\):\s*Promise<boolean>/)
assert.match(indexSrc, /isDeviceOwner\(\):\s*Promise<boolean>/)
assert.match(indexSrc, /hasFamilyControlsEntitlement\(\):\s*Promise<boolean>/)

assert.match(getSrc, /createAndroidSleepLock/)
assert.match(androidSrc, /isDeviceOwner/)
assert.match(androidSrc, /hasFamilyControlsEntitlement/)
assert.match(androidSrc, /SleepLockModule|NativeModules/)

const lock = createMockSleepLock(false)
assert.equal(await lock.isLocked(), false)
assert.equal(await lock.isDeviceOwner(), false)
assert.equal(await lock.hasFamilyControlsEntitlement(), false)
await lock.enableLock()
assert.equal(await lock.isLocked(), true)
await lock.disableLock()
assert.equal(await lock.isLocked(), false)

const ownerLock = createMockSleepLock({ deviceOwner: true })
assert.equal(await ownerLock.isDeviceOwner(), true)

const familyLock = createMockSleepLock({ familyControls: true })
assert.equal(await familyLock.hasFamilyControlsEntitlement(), true)

assert.match(
  DEVICE_OWNER_ADB_COMMAND,
  /adb shell dpm set-device-owner com\.sleeptracker\.sleeplock\/\.DeviceAdminReceiver/
)
assert.equal(FULL_LOCK_ENABLED_LABEL, 'Full lock enabled (Device Owner)')

console.log('native/ mock contract OK — isDeviceOwner + Device Owner ADB')
