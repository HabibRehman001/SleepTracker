import AsyncStorage from '@react-native-async-storage/async-storage'
import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

/**
 * App-level UI flags (Step 120 — zustand). Persisted so cold start / deep links
 * do not bounce a signed-in user through onboarding → /auth again.
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

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
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
      setFamilyControlsSetupDone: (done) =>
        set({ familyControlsSetupDone: done }),
    }),
    {
      name: 'sleep-lock-app-flags',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s) => ({
        onboardingDone: s.onboardingDone,
        locationSetupDone: s.locationSetupDone,
        motionSetupDone: s.motionSetupDone,
        notificationSetupDone: s.notificationSetupDone,
        homeSetupDone: s.homeSetupDone,
        deviceOwnerSetupDone: s.deviceOwnerSetupDone,
        familyControlsSetupDone: s.familyControlsSetupDone,
      }),
    }
  )
)
