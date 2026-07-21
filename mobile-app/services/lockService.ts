import {
  getSleepLockModule,
  resolveDefaultPlatform,
  classifyLockCapability,
  type LockCapability,
  type SleepLockModule,
  type SleepLockPlatform,
} from '../native'

/**
 * App-facing lock API — screens/store call here, never import platform APIs.
 */
let module: SleepLockModule = getSleepLockModule('mock')

export function configureLockService(platform?: SleepLockPlatform): void {
  module = getSleepLockModule(platform ?? resolveDefaultPlatform())
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
