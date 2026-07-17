import {
  getSleepLockModule,
  type SleepLockModule,
  type SleepLockPlatform,
} from '../native'

/**
 * App-facing lock API — screens/store call here, never import platform APIs.
 */
let module: SleepLockModule = getSleepLockModule('mock')

export function configureLockService(platform: SleepLockPlatform = 'mock'): void {
  module = getSleepLockModule(platform)
}

export async function enableLock(): Promise<void> {
  await module.enableLock()
}

export async function disableLock(): Promise<void> {
  await module.disableLock()
}

export async function isLocked(): Promise<boolean> {
  return module.isLocked()
}
