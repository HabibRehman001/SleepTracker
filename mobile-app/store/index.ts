/**
 * Client state barrel (Steps 118–123).
 */
export {
  useScheduleStore,
  type ClockHm,
} from './scheduleStore'
export {
  useBaselineStore,
  type BaselineStats,
} from './baselineStore'
export { useLockStateStore } from './lockStateStore'
export { useAppStore } from './useAppStore'
export { useHomeLocationStore } from './homeLocationStore'

/** @deprecated Prefer useLockStateStore (Step 123). */
export {
  getLockSnapshot,
  setLockBusy,
  setLockLocked,
  subscribeLockStore,
} from './lockStore'
