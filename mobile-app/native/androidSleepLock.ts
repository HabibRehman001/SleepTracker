import { NativeModules, Platform } from 'react-native'

import type { IncomingCallPolicy } from './incomingCallPolicy'
import type { SleepLockModule } from './index'
import { parseIncomingCallPolicy } from './incomingCallPolicy'
import { createMockSleepLock } from './mockSleepLock'

type NativeSleepLock = {
  enableLock?: () => Promise<void>
  disableLock?: () => Promise<void>
  isLocked?: () => Promise<boolean>
  isDeviceOwner?: () => Promise<boolean>
  hasFamilyControlsEntitlement?: () => Promise<boolean>
  setCallAllowlist?: (numbers: string[]) => Promise<void>
  getCallAllowlist?: () => Promise<string[]>
  setIncomingCallPolicy?: (policy: string) => Promise<string>
  getIncomingCallPolicy?: () => Promise<string>
  getAsleepCallbackMessage?: () => Promise<string>
  getBatteryLevel?: () => Promise<number>
  isEmergencyNumber?: (number: string) => Promise<boolean>
}

function getNativeBridge(): NativeSleepLock | null {
  const mod = NativeModules.SleepLockModule as NativeSleepLock | undefined
  return mod ?? null
}

function withCallPolicyApi(
  base: SleepLockModule,
  native: NativeSleepLock | null
): SleepLockModule {
  return {
    ...base,
    async setCallAllowlist(numbers) {
      if (native?.setCallAllowlist) await native.setCallAllowlist(numbers)
      else await base.setCallAllowlist?.(numbers)
    },
    async getCallAllowlist() {
      if (native?.getCallAllowlist) return (await native.getCallAllowlist()) ?? []
      return (await base.getCallAllowlist?.()) ?? []
    },
    async setIncomingCallPolicy(policy: IncomingCallPolicy) {
      if (native?.setIncomingCallPolicy) {
        await native.setIncomingCallPolicy(policy)
      } else {
        await base.setIncomingCallPolicy?.(policy)
      }
    },
    async getIncomingCallPolicy() {
      if (native?.getIncomingCallPolicy) {
        return parseIncomingCallPolicy(await native.getIncomingCallPolicy())
      }
      return parseIncomingCallPolicy(await base.getIncomingCallPolicy?.())
    },
    async getAsleepCallbackMessage() {
      if (native?.getAsleepCallbackMessage) {
        return await native.getAsleepCallbackMessage()
      }
      return (await base.getAsleepCallbackMessage?.()) ?? 'Asleep — will call back.'
    },
    async getBatteryLevel() {
      if (native?.getBatteryLevel) {
        return (await native.getBatteryLevel()) ?? -1
      }
      return (await base.getBatteryLevel?.()) ?? -1
    },
    async isEmergencyNumber(number: string) {
      if (native?.isEmergencyNumber) {
        return (await native.isEmergencyNumber(number)) ?? false
      }
      return (await base.isEmergencyNumber?.(number)) ?? false
    },
  }
}

/**
 * Android implementation — talks to native SleepLockModule when linked.
 * Family Controls is iOS-only → always false here.
 */
export function createAndroidSleepLock(): SleepLockModule {
  const native = getNativeBridge()
  if (!native?.isDeviceOwner) {
    return withCallPolicyApi(createMockSleepLock(false), null)
  }

  const base: SleepLockModule = {
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
  return withCallPolicyApi(base, native)
}

/**
 * iOS — soft lock via FamilyControls when entitlement is in the binary.
 * Until Apple approves, hasFamilyControlsEntitlement → false → notification-only.
 */
export function createIosSleepLock(): SleepLockModule {
  const native = getNativeBridge()
  const fallback = createMockSleepLock(false)
  const base: SleepLockModule = {
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
  return withCallPolicyApi(base, null)
}

/** Pick default platform for the running OS. */
export function resolveDefaultPlatform(): 'mock' | 'android' | 'ios' {
  if (Platform.OS === 'android') return 'android'
  if (Platform.OS === 'ios') return 'ios'
  return 'mock'
}
