import type { SleepLockModule } from './index'
import { createMockSleepLock } from './mockSleepLock'
import {
  createAndroidSleepLock,
  createIosSleepLock,
} from './androidSleepLock'

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
      return createAndroidSleepLock()
    case 'ios':
      return createIosSleepLock()
    default: {
      const _exhaustive: never = platform
      throw new Error(`Unknown SleepLock platform: ${_exhaustive}`)
    }
  }
}
