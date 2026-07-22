/**
 * Expo config plugin — Device Admin / Device Owner (Step 158).
 *
 * 1. Registers `.DeviceAdminReceiver` in AndroidManifest.xml
 * 2. Registers `.SleepLockCallScreeningService` (Step 161)
 * 3. Registers `.SleepLockWatchdogService` START_STICKY FGS (Step 165)
 * 4. Registers `.UnlockWakeMonitorService` for ACTION_USER_PRESENT (Step 198)
 * 5. Copies Kotlin sources + device_admin.xml into the prebuild android/ tree
 * 6. Registers SleepLockPackage in MainApplication so JS can call isDeviceOwner()
 *
 * After install + ADB set-device-owner, verify with:
 *   adb shell dumpsys device_policy
 */

const {
  AndroidConfig,
  withAndroidManifest,
  withDangerousMod,
  withMainApplication,
} = require('expo/config-plugins')
const fs = require('fs')
const path = require('path')

const ANDROID_PACKAGE = 'com.sleeptracker.sleeplock'
const RECEIVER_NAME = '.DeviceAdminReceiver'
const CALL_SCREENING_SERVICE = '.SleepLockCallScreeningService'
const WATCHDOG_SERVICE = '.SleepLockWatchdogService'
const UNLOCK_WAKE_SERVICE = '.UnlockWakeMonitorService'
const KOTLIN_FILES = [
  'DeviceAdminReceiver.kt',
  'SleepLockModule.kt',
  'SleepLockPackage.kt',
  'SleepLockCallScreeningService.kt',
  'SleepLockSession.kt',
  'IncomingCallGate.kt',
  'EmergencyNumbers.kt',
  'SleepLockWatchdogService.kt',
  'UnlockReceiver.kt',
  'UnlockEventStore.kt',
  'UnlockWakeMonitorService.kt',
]

function receiverAlreadyPresent(application) {
  const receivers = application.receiver ?? []
  return receivers.some((r) => {
    const name = r.$?.['android:name']
    return (
      name === RECEIVER_NAME ||
      name === `${ANDROID_PACKAGE}.DeviceAdminReceiver` ||
      name?.endsWith('.DeviceAdminReceiver')
    )
  })
}

function serviceAlreadyPresent(application, shortName) {
  const services = application.service ?? []
  return services.some((s) => {
    const name = s.$?.['android:name']
    return (
      name === shortName ||
      name === `${ANDROID_PACKAGE}${shortName}` ||
      name?.endsWith(shortName)
    )
  })
}

/** Manifest: Device Admin + CallScreening + Lock watchdog FGS (Steps 161/165). */
function withDeviceAdminManifest(config) {
  return withAndroidManifest(config, (cfg) => {
    const application =
      AndroidConfig.Manifest.getMainApplicationOrThrow(cfg.modResults)

    if (!receiverAlreadyPresent(application)) {
      if (!application.receiver) application.receiver = []
      application.receiver.push({
        $: {
          'android:name': RECEIVER_NAME,
          'android:permission': 'android.permission.BIND_DEVICE_ADMIN',
          'android:exported': 'true',
        },
        'meta-data': [
          {
            $: {
              'android:name': 'android.app.device_admin',
              'android:resource': '@xml/device_admin',
            },
          },
        ],
        'intent-filter': [
          {
            action: [
              {
                $: {
                  'android:name': 'android.app.action.DEVICE_ADMIN_ENABLED',
                },
              },
            ],
          },
        ],
      })
    }

    if (!serviceAlreadyPresent(application, CALL_SCREENING_SERVICE)) {
      if (!application.service) application.service = []
      application.service.push({
        $: {
          'android:name': CALL_SCREENING_SERVICE,
          'android:permission': 'android.permission.BIND_SCREENING_SERVICE',
          'android:exported': 'true',
        },
        'intent-filter': [
          {
            action: [
              {
                $: {
                  'android:name': 'android.telecom.CallScreeningService',
                },
              },
            ],
          },
        ],
      })
    }

    if (!serviceAlreadyPresent(application, WATCHDOG_SERVICE)) {
      if (!application.service) application.service = []
      application.service.push({
        $: {
          'android:name': WATCHDOG_SERVICE,
          'android:exported': 'false',
          'android:foregroundServiceType': 'specialUse',
        },
        property: [
          {
            $: {
              'android:name': 'android.app.PROPERTY_SPECIAL_USE_FGS_SUBTYPE',
              'android:value': 'sleep_lock_kiosk_recovery',
            },
          },
        ],
      })
    }

    // Step 198 — FGS hosts runtime ACTION_USER_PRESENT (not manifest receiver).
    if (!serviceAlreadyPresent(application, UNLOCK_WAKE_SERVICE)) {
      if (!application.service) application.service = []
      application.service.push({
        $: {
          'android:name': UNLOCK_WAKE_SERVICE,
          'android:exported': 'false',
          'android:foregroundServiceType': 'specialUse',
        },
        property: [
          {
            $: {
              'android:name': 'android.app.PROPERTY_SPECIAL_USE_FGS_SUBTYPE',
              'android:value': 'sleep_lock_unlock_wake_detect',
            },
          },
        ],
      })
    }

    // Ensure FGS special-use permission is declared.
    const manifest = cfg.modResults.manifest
    if (!manifest['uses-permission']) manifest['uses-permission'] = []
    const perms = manifest['uses-permission']
    const hasSpecial = perms.some(
      (p) =>
        p.$?.['android:name'] ===
        'android.permission.FOREGROUND_SERVICE_SPECIAL_USE'
    )
    if (!hasSpecial) {
      perms.push({
        $: {
          'android:name':
            'android.permission.FOREGROUND_SERVICE_SPECIAL_USE',
        },
      })
    }

    return cfg
  })
}

/** Copy native/android → android/app/src/main/{java|res}. */
function withDeviceAdminSources(config) {
  return withDangerousMod(config, [
    'android',
    async (cfg) => {
      const projectRoot = cfg.modRequest.projectRoot
      const androidRoot = cfg.modRequest.platformProjectRoot
      const srcRoot = path.join(projectRoot, 'native', 'android')
      const packageDir = path.join(
        androidRoot,
        'app',
        'src',
        'main',
        'java',
        ...ANDROID_PACKAGE.split('.')
      )
      const xmlDir = path.join(androidRoot, 'app', 'src', 'main', 'res', 'xml')

      fs.mkdirSync(packageDir, { recursive: true })
      fs.mkdirSync(xmlDir, { recursive: true })

      for (const file of KOTLIN_FILES) {
        const from = path.join(srcRoot, file)
        if (!fs.existsSync(from)) {
          throw new Error(`withDeviceAdmin: missing ${from}`)
        }
        fs.copyFileSync(from, path.join(packageDir, file))
      }

      const xmlFrom = path.join(srcRoot, 'res', 'xml', 'device_admin.xml')
      if (!fs.existsSync(xmlFrom)) {
        throw new Error(`withDeviceAdmin: missing ${xmlFrom}`)
      }
      fs.copyFileSync(xmlFrom, path.join(xmlDir, 'device_admin.xml'))

      return cfg
    },
  ])
}

/** Register SleepLockPackage in MainApplication PackageList. */
function withSleepLockPackage(config) {
  return withMainApplication(config, (cfg) => {
    const isJava = cfg.modResults.language === 'java'
    let contents = cfg.modResults.contents

    contents = AndroidConfig.CodeMod.addImports(
      contents,
      [`${ANDROID_PACKAGE}.SleepLockPackage`],
      isJava
    )

    if (!contents.includes('SleepLockPackage()')) {
      // Expo template: "...here, for example:\n          // add(MyReactNativePackage())"
      const exampleComment = '// add(MyReactNativePackage())'
      if (contents.includes(exampleComment)) {
        contents = contents.replace(
          exampleComment,
          `add(SleepLockPackage())\n              ${exampleComment}`
        )
      } else if (contents.includes('PackageList(this).packages.apply {')) {
        contents = contents.replace(
          'PackageList(this).packages.apply {',
          'PackageList(this).packages.apply {\n              add(SleepLockPackage())'
        )
      } else {
        throw new Error(
          'withDeviceAdmin: could not find PackageList apply block in MainApplication'
        )
      }
    }

    cfg.modResults.contents = contents
    return cfg
  })
}

function withDeviceAdmin(config) {
  config = withDeviceAdminManifest(config)
  config = withDeviceAdminSources(config)
  config = withSleepLockPackage(config)
  return config
}

module.exports = withDeviceAdmin
