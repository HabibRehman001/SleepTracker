import { create } from 'zustand'

/**
 * App-level UI flags (Step 120 — zustand). Lock session state still also
 * mirrored in lockStore for the home screen until fully migrated.
 */
type AppState = {
  onboardingDone: boolean
  setOnboardingDone: (done: boolean) => void
  locationSetupDone: boolean
  setLocationSetupDone: (done: boolean) => void
  motionSetupDone: boolean
  setMotionSetupDone: (done: boolean) => void
  notificationSetupDone: boolean
  setNotificationSetupDone: (done: boolean) => void
  /** True after home pin saved or loaded from backend (Step 137). */
  homeSetupDone: boolean
  setHomeSetupDone: (done: boolean) => void
  /** True after Device Owner setup screen acknowledged (Step 138). */
  deviceOwnerSetupDone: boolean
  setDeviceOwnerSetupDone: (done: boolean) => void
  /** True after Family Controls checklist acknowledged (Step 139). */
  familyControlsSetupDone: boolean
  setFamilyControlsSetupDone: (done: boolean) => void
}

export const useAppStore = create<AppState>((set) => ({
  onboardingDone: false,
  setOnboardingDone: (done) => set({ onboardingDone: done }),
  locationSetupDone: false,
  setLocationSetupDone: (done) => set({ locationSetupDone: done }),
  motionSetupDone: false,
  setMotionSetupDone: (done) => set({ motionSetupDone: done }),
  notificationSetupDone: false,
  setNotificationSetupDone: (done) => set({ notificationSetupDone: done }),
  homeSetupDone: false,
  setHomeSetupDone: (done) => set({ homeSetupDone: done }),
  deviceOwnerSetupDone: false,
  setDeviceOwnerSetupDone: (done) => set({ deviceOwnerSetupDone: done }),
  familyControlsSetupDone: false,
  setFamilyControlsSetupDone: (done) => set({ familyControlsSetupDone: done }),
}))
