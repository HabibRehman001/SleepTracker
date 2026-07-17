import type { SleepLockModule } from './index'
import { createMockSleepLock } from './mockSleepLock'

export type SleepLockPlatform = 'mock' | 'android' | 'ios'

/**
 * Resolve the lock implementation for the current runtime.
 * Default is mock so UI can ship before real native modules exist.
 */
export function getSleepLockModule(
  platform: SleepLockPlatform = 'mock'
): SleepLockModule {
  switch (platform) {
    case 'mock':
      return createMockSleepLock()
    case 'android':
    case 'ios':
      throw new Error(
        `SleepLockModule "${platform}" native binding is not implemented yet — use mock until Device Owner / FamilyControls land.`
      )
    default: {
      const _exhaustive: never = platform
      throw new Error(`Unknown SleepLock platform: ${_exhaustive}`)
    }
  }
}
