/**
 * Background task names for running / focus detection (Step 120).
 * Implementations land in later steps — register via expo-task-manager +
 * expo-background-fetch once permissions and native builds are ready.
 */
export const BACKGROUND_TASKS = {
  /** Periodic check while app is backgrounded */
  focusFetch: 'SLEEP_LOCK_FOCUS_FETCH',
  /** Location / geofence updates */
  geofence: 'SLEEP_LOCK_GEOFENCE',
} as const

export type BackgroundTaskName =
  (typeof BACKGROUND_TASKS)[keyof typeof BACKGROUND_TASKS]
