/**
 * Platform modules boundary (Step 116 → Step 118 `native/`).
 * UI / forms / stats depend only on this — never on Device Owner or FamilyControls APIs.
 */
export interface SleepLockModule {
  enableLock(): Promise<void>
  disableLock(): Promise<void>
  isLocked(): Promise<boolean>
  /** Android Device Owner — true after one-time ADB dpm set-device-owner (Step 138). */
  isDeviceOwner(): Promise<boolean>
  /**
   * iOS Family Controls entitlement available in this build (Step 139).
   * False until Apple approves and the app is rebuilt with the capability.
   */
  hasFamilyControlsEntitlement(): Promise<boolean>
}

export { createMockSleepLock } from './mockSleepLock'
export {
  getSleepLockModule,
  type SleepLockPlatform,
} from './getSleepLockModule'
export {
  createAndroidSleepLock,
  createIosSleepLock,
  resolveDefaultPlatform,
} from './androidSleepLock'
export {
  ANDROID_PACKAGE,
  DEVICE_ADMIN_RECEIVER,
  DEVICE_OWNER_ADB_COMMAND,
  DEVICE_OWNER_STEPS,
  FULL_LOCK_ENABLED_LABEL,
} from './deviceOwner'
export {
  FAMILY_CONTROLS_CHECKLIST,
  FAMILY_CONTROLS_REQUEST_URL,
  IOS_BUNDLE_ID,
  NOTIFICATION_ONLY_MODE_BODY,
  NOTIFICATION_ONLY_MODE_LABEL,
  SOFT_LOCK_ENABLED_LABEL,
} from './familyControls'
export {
  classifyLockCapability,
  type LockCapability,
} from './lockCapability'
