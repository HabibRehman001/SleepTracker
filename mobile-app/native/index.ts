import type { IncomingCallPolicy } from './incomingCallPolicy'

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
  /** Step 162 — favorites/emergency numbers that may ring during lock. */
  setCallAllowlist?(numbers: string[]): Promise<void>
  getCallAllowlist?(): Promise<string[]>
  setIncomingCallPolicy?(policy: IncomingCallPolicy): Promise<void>
  getIncomingCallPolicy?(): Promise<IncomingCallPolicy | string>
  getAsleepCallbackMessage?(): Promise<string>
  getBatteryLevel?(): Promise<number>
  isEmergencyNumber?(number: string): Promise<boolean>
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
  DEVICE_OWNER_DUMPSYS_COMMAND,
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
export {
  ASLEEP_CALLBACK_MESSAGE,
  decideIncomingCall,
  isAllowlistedNumber,
  isEmergencyNumber,
  normalizePhoneDigits,
  parseIncomingCallPolicy,
  INCOMING_CALL_POLICY_LABELS,
  EMERGENCY_MANUAL_TEST_NOTE,
  LOW_BATTERY_LOCKED_HINT,
  LOW_BATTERY_THRESHOLD,
  WELL_KNOWN_EMERGENCY_DIGITS,
  type IncomingCallDecision,
  type IncomingCallPolicy,
} from './incomingCallPolicy'
