import { NativeModules, Platform } from 'react-native'

import type { SleepLockModule } from './index'
import { createMockSleepLock } from './mockSleepLock'

type NativeSleepLock = {
  enableLock?: () => Promise<void>
  disableLock?: () => Promise<void>
  isLocked?: () => Promise<boolean>
  isDeviceOwner?: () => Promise<boolean>
  hasFamilyControlsEntitlement?: () => Promise<boolean>
}

function getNativeBridge(): NativeSleepLock | null {
  const mod = NativeModules.SleepLockModule as NativeSleepLock | undefined
  return mod ?? null
}

/**
 * Android implementation — talks to native SleepLockModule when linked.
 * Family Controls is iOS-only → always false here.
 */
export function createAndroidSleepLock(): SleepLockModule {
  const native = getNativeBridge()
  if (!native?.isDeviceOwner) {
    const fallback = createMockSleepLock(false)
    return {
      enableLock: () => fallback.enableLock(),
      disableLock: () => fallback.disableLock(),
      isLocked: () => fallback.isLocked(),
      async isDeviceOwner() {
        return false
      },
      async hasFamilyControlsEntitlement() {
        return false
      },
    }
  }

  return {
    async enableLock() {
      await native.enableLock?.()
    },
    async disableLock() {
      await native.disableLock?.()
    },
    async isLocked() {
      return (await native.isLocked?.()) ?? false
    },
    async isDeviceOwner() {
      return (await native.isDeviceOwner?.()) ?? false
    },
    async hasFamilyControlsEntitlement() {
      return false
    },
  }
}

/**
 * iOS — soft lock via FamilyControls when entitlement is in the binary.
 * Until Apple approves, hasFamilyControlsEntitlement → false → notification-only.
 */
export function createIosSleepLock(): SleepLockModule {
  const native = getNativeBridge()
  const fallback = createMockSleepLock(false)
  return {
    enableLock: () => fallback.enableLock(),
    disableLock: () => fallback.disableLock(),
    isLocked: () => fallback.isLocked(),
    async isDeviceOwner() {
      return false
    },
    async hasFamilyControlsEntitlement() {
      if (native?.hasFamilyControlsEntitlement) {
        return (await native.hasFamilyControlsEntitlement()) ?? false
      }
      return false
    },
  }
}

/** Pick default platform for the running OS. */
export function resolveDefaultPlatform(): 'mock' | 'android' | 'ios' {
  if (Platform.OS === 'android') return 'android'
  if (Platform.OS === 'ios') return 'ios'
  return 'mock'
}
