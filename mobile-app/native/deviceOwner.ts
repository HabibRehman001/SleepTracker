/**
 * Android Device Owner — one-time ADB setup (Step 138).
 * Package must match app.json android.package.
 */
export const ANDROID_PACKAGE = 'com.sleeptracker.sleeplock'

/** Component relative to the app package (DeviceAdminReceiver class). */
export const DEVICE_ADMIN_RECEIVER = '.DeviceAdminReceiver'

/**
 * Run once on a factory-reset / account-free Android device (USB debugging on).
 * Cannot be automated from inside the app.
 */
export const DEVICE_OWNER_ADB_COMMAND = `adb shell dpm set-device-owner ${ANDROID_PACKAGE}/${DEVICE_ADMIN_RECEIVER}`

export const DEVICE_OWNER_STEPS = [
  'Factory-reset the phone (or use a device with no Google account).',
  'Skip signing into a Google account during setup.',
  'Enable Developer options → USB debugging.',
  'Install the Sleep Lock build (custom dev client / APK).',
  'Connect USB and run the ADB command below on your computer.',
  'Open Sleep Lock and tap “Check Device Owner status”.',
] as const

export const FULL_LOCK_ENABLED_LABEL = 'Full lock enabled (Device Owner)'
