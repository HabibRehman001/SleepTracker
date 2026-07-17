import { create } from 'zustand'

/**
 * App-level UI flags (Step 120 — zustand). Lock session state still also
 * mirrored in lockStore for the home screen until fully migrated.
 */
type AppState = {
  onboardingDone: boolean
  setOnboardingDone: (done: boolean) => void
}

export const useAppStore = create<AppState>((set) => ({
  onboardingDone: false,
  setOnboardingDone: (done) => set({ onboardingDone: done }),
}))
