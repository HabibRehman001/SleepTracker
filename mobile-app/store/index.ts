/**
 * Client state barrel (Steps 118–123).
 */
export {
  useScheduleStore,
  type ClockHm,
} from './scheduleStore'
export {
  useBaselineStore,
  BASELINE_TARGET_NIGHTS,
  type BaselineStats,
  type PersistedSleepWindow,
} from './baselineStore'
export { useLockStateStore } from './lockStateStore'
export { useAppStore } from './useAppStore'
export { useHomeLocationStore } from './homeLocationStore'
export { usePedometerStore } from './pedometerStore'

/** @deprecated Prefer useLockStateStore (Step 123). */
export {
  getLockSnapshot,
  setLockBusy,
  setLockLocked,
  subscribeLockStore,
} from './lockStore'
