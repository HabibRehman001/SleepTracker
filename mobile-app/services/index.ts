/**
 * Thin services barrel — HTTP / lock / sensors / background (Steps 116–120).
 */
export {
  configureLockService,
  disableLock,
  enableLock,
  isLocked,
} from './lockService'
export { queryClient } from './queryClient'
export { BACKGROUND_TASKS, type BackgroundTaskName } from './backgroundTasks'
export { LOCATION_PURPOSE } from './location'
export { SENSOR_PACKAGES } from './sensors'
