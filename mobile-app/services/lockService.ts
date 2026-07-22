import {
  getSleepLockModule,
  resolveDefaultPlatform,
  classifyLockCapability,
  type LockCapability,
  type SleepLockModule,
  type SleepLockPlatform,
} from '../native'
import { resolveWakeAfter } from './lateArrivalMath'
import {
  fetchAccountLockSession,
  isAccountLockActive,
  publishAccountLockSession,
} from './lockSessionApi'

/**
 * App-facing lock API — screens/store call here, never import platform APIs.
 */
let module: SleepLockModule = getSleepLockModule('mock')

export function configureLockService(platform?: SleepLockPlatform): void {
  module = getSleepLockModule(platform ?? resolveDefaultPlatform())
}

async function nextUnlockIso(wakeHHMM?: string | null): Promise<string | null> {
  let wake = wakeHHMM
  if (!wake) {
    try {
      const { useScheduleStore } = await import('../store/scheduleStore')
      wake =
        useScheduleStore.getState().getEnforcedTimes()?.waketime ??
        useScheduleStore.getState().waketime
    } catch {
      wake = null
    }
  }
  if (!wake || !/^\d{1,2}:\d{2}$/.test(wake)) return null
  try {
    return resolveWakeAfter(new Date(), wake).toISOString()
  } catch {
    return null
  }
}

export async function enableLock(opts?: {
  wakeHHMM?: string | null
}): Promise<void> {
  await module.enableLock()
  await publishAccountLockSession({
    locked: true,
    unlockAt: await nextUnlockIso(opts?.wakeHHMM),
  })
}

export async function disableLock(): Promise<void> {
  await module.disableLock()
  await publishAccountLockSession({ locked: false, unlockAt: null })
}

export async function isLocked(): Promise<boolean> {
  return module.isLocked()
}

/**
 * Pull account lock from the server. If this user is asleep on any device,
 * engage soft lock here so login on another phone shows /locked.
 */
export async function syncAccountLockFromServer(): Promise<boolean> {
  try {
    const session = await fetchAccountLockSession()
    const active = isAccountLockActive(session)
    const local = await module.isLocked()
    if (active && !local) {
      await module.enableLock()
      return true
    }
    if (!active && local) {
      // Soft/account unlock from another device — release mock/soft lock.
      // Device Owner full lockdown stays local until native disable.
      const owner = await module.isDeviceOwner()
      if (!owner) {
        await module.disableLock()
      }
      return false
    }
    return active || local
  } catch (err) {
    console.warn('[lock-session] sync failed', err)
    return module.isLocked()
  }
}

/** Android Device Owner status (Step 138). Always false on iOS / plain mock. */
export async function isDeviceOwner(): Promise<boolean> {
  return module.isDeviceOwner()
}

/** iOS Family Controls entitlement present in this build (Step 139). */
export async function hasFamilyControlsEntitlement(): Promise<boolean> {
  return module.hasFamilyControlsEntitlement()
}

/**
 * full = Android Device Owner; soft = iOS Family Controls;
 * notification-only = fallback until platform entitlement is ready.
 */
export async function getLockCapability(): Promise<LockCapability> {
  const [owner, family] = await Promise.all([
    module.isDeviceOwner(),
    module.hasFamilyControlsEntitlement(),
  ])
  return classifyLockCapability(owner, family)
}

/** Step 162 — push favorites allow-list into native screening prefs. */
export async function setCallAllowlist(numbers: string[]): Promise<void> {
  await module.setCallAllowlist?.(numbers)
}

export async function getCallAllowlist(): Promise<string[]> {
  return (await module.getCallAllowlist?.()) ?? []
}

export async function setIncomingCallPolicy(
  policy: import('../native').IncomingCallPolicy
): Promise<void> {
  await module.setIncomingCallPolicy?.(policy)
}

export async function getIncomingCallPolicy(): Promise<
  import('../native').IncomingCallPolicy | string
> {
  return (await module.getIncomingCallPolicy?.()) ?? 'allowlist_only'
}

export async function getBatteryLevel(): Promise<number> {
  return (await module.getBatteryLevel?.()) ?? -1
}

export async function isEmergencyNumber(number: string): Promise<boolean> {
  return (await module.isEmergencyNumber?.(number)) ?? false
}

export type { LockCapability }
