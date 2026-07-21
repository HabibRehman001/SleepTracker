/**
 * Step 158 — Device Admin / Device Owner native module + Expo config plugin.
 */
import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  DEVICE_OWNER_ADB_COMMAND,
  DEVICE_OWNER_DUMPSYS_COMMAND,
} from '../native/deviceOwner.ts'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const receiver = readFileSync(
  join(root, 'native/android/DeviceAdminReceiver.kt'),
  'utf8'
)
const moduleKt = readFileSync(
  join(root, 'native/android/SleepLockModule.kt'),
  'utf8'
)
const pkgKt = readFileSync(
  join(root, 'native/android/SleepLockPackage.kt'),
  'utf8'
)
const xml = readFileSync(
  join(root, 'native/android/res/xml/device_admin.xml'),
  'utf8'
)
const plugin = readFileSync(join(root, 'plugins/withDeviceAdmin.js'), 'utf8')
const app = JSON.parse(readFileSync(join(root, 'app.json'), 'utf8'))

assert.match(receiver, /class DeviceAdminReceiver\s*:\s*DeviceAdminReceiver/)
assert.match(receiver, /package com\.sleeptracker\.sleeplock/)
assert.match(moduleKt, /isDeviceOwner/)
assert.match(moduleKt, /DevicePolicyManager/)
assert.match(moduleKt, /isDeviceOwnerApp/)
assert.match(moduleKt, /NAME = "SleepLockModule"/)
assert.match(moduleKt, /setLockTaskPackages/)
assert.match(moduleKt, /startLockTask/)
assert.match(moduleKt, /DISALLOW_OUTGOING_CALLS/)
assert.match(pkgKt, /class SleepLockPackage/)
assert.match(plugin, /SleepLockCallScreeningService/)
assert.match(plugin, /BIND_SCREENING_SERVICE/)
assert.match(xml, /<device-admin/)
assert.match(xml, /<force-lock\s*\/>/)
assert.match(xml, /<lock-task\s*\/>/)

assert.match(plugin, /withAndroidManifest/)
assert.match(plugin, /withDangerousMod/)
assert.match(plugin, /withMainApplication/)
assert.match(plugin, /DEVICE_ADMIN_ENABLED|BIND_DEVICE_ADMIN/)
assert.match(plugin, /@xml\/device_admin/)
assert.match(plugin, /SleepLockPackage/)
assert.match(plugin, /DeviceAdminReceiver\.kt/)

const plugins = app.expo.plugins ?? []
assert.ok(
  plugins.some(
    (p) =>
      p === './plugins/withDeviceAdmin' ||
      (Array.isArray(p) && p[0] === './plugins/withDeviceAdmin')
  ),
  'app.json must register ./plugins/withDeviceAdmin'
)

assert.match(
  DEVICE_OWNER_ADB_COMMAND,
  /dpm set-device-owner com\.sleeptracker\.sleeplock\/\.DeviceAdminReceiver/
)
assert.match(DEVICE_OWNER_DUMPSYS_COMMAND, /dumpsys device_policy/)

assert.ok(existsSync(join(root, 'native/android/SleepLockModule.kt')))
assert.ok(existsSync(join(root, 'plugins/withDeviceAdmin.js')))

console.log(
  'Device Admin native module OK — receiver + SleepLockModule + withDeviceAdmin plugin'
)
