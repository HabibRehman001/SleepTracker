import type { SleepLockModule } from './index'

/**
 * In-memory mock — simulator / unit tests without native modules.
 */
export function createMockSleepLock(
  initialLocked = false
): SleepLockModule {
  let locked = initialLocked

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
  }
}
