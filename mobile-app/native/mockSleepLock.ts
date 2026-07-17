import type { SleepLockModule } from './index'

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
  }
}
