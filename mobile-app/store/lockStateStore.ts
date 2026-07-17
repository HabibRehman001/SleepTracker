import { create } from 'zustand'

type LockState = {
  /** Mirrors SleepLockModule.isLocked() for UI */
  isLocked: boolean
  busy: boolean
  ready: boolean
  lastError: string | null
  setLocked: (locked: boolean) => void
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
  busy: false,
  ready: false,
  lastError: null,
  setLocked: (isLocked) => set({ isLocked }),
  setBusy: (busy) => set({ busy }),
  setReady: (ready) => set({ ready }),
  setLastError: (lastError) => set({ lastError }),
  reset: () =>
    set({
      isLocked: false,
      busy: false,
      ready: false,
      lastError: null,
    }),
}))
