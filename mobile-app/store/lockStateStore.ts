import { create } from 'zustand'

import type { LockCapability } from '../native'

type LockState = {
  /** Mirrors SleepLockModule.isLocked() for UI */
  isLocked: boolean
  /** Android Device Owner — full lock capability (Step 138) */
  isDeviceOwner: boolean
  /** iOS Family Controls entitlement in this build (Step 139) */
  hasFamilyControls: boolean
  /** Derived lock mode for UI badges */
  lockCapability: LockCapability
  busy: boolean
  ready: boolean
  lastError: string | null
  setLocked: (locked: boolean) => void
  setDeviceOwner: (owner: boolean) => void
  setFamilyControls: (has: boolean) => void
  setLockCapability: (cap: LockCapability) => void
  setBusy: (busy: boolean) => void
  setReady: (ready: boolean) => void
  setLastError: (message: string | null) => void
  reset: () => void
}

/**
 * Live lock session UI state (Step 123).
 * Screens read this; enable/disable still goes through services/lockService.
 */
export const useLockStateStore = create<LockState>((set) => ({
  isLocked: false,
  isDeviceOwner: false,
  hasFamilyControls: false,
  lockCapability: 'notification-only',
  busy: false,
  ready: false,
  lastError: null,
  setLocked: (isLocked) => set({ isLocked }),
  setDeviceOwner: (isDeviceOwner) => set({ isDeviceOwner }),
  setFamilyControls: (hasFamilyControls) => set({ hasFamilyControls }),
  setLockCapability: (lockCapability) => set({ lockCapability }),
  setBusy: (busy) => set({ busy }),
  setReady: (ready) => set({ ready }),
  setLastError: (lastError) => set({ lastError }),
  reset: () =>
    set({
      isLocked: false,
      isDeviceOwner: false,
      hasFamilyControls: false,
      lockCapability: 'notification-only',
      busy: false,
      ready: false,
      lastError: null,
    }),
}))
