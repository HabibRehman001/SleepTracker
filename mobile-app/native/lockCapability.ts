/**
 * Lock capability derived from platform entitlements (Steps 138–139).
 */
export type LockCapability = 'full' | 'soft' | 'notification-only'

export function classifyLockCapability(
  isDeviceOwner: boolean,
  hasFamilyControls: boolean
): LockCapability {
  if (isDeviceOwner) return 'full'
  if (hasFamilyControls) return 'soft'
  return 'notification-only'
}
