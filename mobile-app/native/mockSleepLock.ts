import type { IncomingCallPolicy } from './incomingCallPolicy'
import type { SleepLockModule } from './index'
import {
  ASLEEP_CALLBACK_MESSAGE,
  isEmergencyNumber,
  parseIncomingCallPolicy,
} from './incomingCallPolicy'

export type MockSleepLockOptions = {
  initialLocked?: boolean
  /** Simulate Device Owner for UI / contract tests (Step 138). */
  deviceOwner?: boolean
  /** Simulate approved Family Controls entitlement (Step 139). */
  familyControls?: boolean
}

/**
 * In-memory mock — simulator / unit tests without native modules.
 */
export function createMockSleepLock(
  initialLockedOrOptions: boolean | MockSleepLockOptions = false
): SleepLockModule {
  const options: MockSleepLockOptions =
    typeof initialLockedOrOptions === 'boolean'
      ? { initialLocked: initialLockedOrOptions }
      : initialLockedOrOptions

  let locked = options.initialLocked ?? false
  const deviceOwner = options.deviceOwner ?? false
  const familyControls = options.familyControls ?? false
  let allowlist: string[] = []
  let policy: IncomingCallPolicy = 'allowlist_only'

  return {
    async enableLock() {
      locked = true
    },
    async disableLock() {
      locked = false
    },
    async isLocked() {
      return locked
    },
    async isDeviceOwner() {
      return deviceOwner
    },
    async hasFamilyControlsEntitlement() {
      return familyControls
    },
    async setCallAllowlist(numbers) {
      allowlist = numbers.map((n) => n.trim()).filter(Boolean)
    },
    async getCallAllowlist() {
      return [...allowlist]
    },
    async setIncomingCallPolicy(next) {
      policy = parseIncomingCallPolicy(next)
    },
    async getIncomingCallPolicy() {
      return policy
    },
    async getAsleepCallbackMessage() {
      return ASLEEP_CALLBACK_MESSAGE
    },
    async getBatteryLevel() {
      return -1
    },
    async isEmergencyNumber(number) {
      return isEmergencyNumber(number)
    },
  }
}
