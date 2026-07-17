/**
 * Thin services barrel — HTTP / lock / sensors / background (Steps 116–120).
 */
export {
  configureLockService,
  disableLock,
  enableLock,
  getLockCapability,
  hasFamilyControlsEntitlement,
  isDeviceOwner,
  isLocked,
  type LockCapability,
} from './lockService'
export { queryClient } from './queryClient'
export { BACKGROUND_TASKS, type BackgroundTaskName } from './backgroundTasks'
export {
  BACKGROUND_LOCATION_WHY,
  LOCATION_PURPOSE,
  classifyLocationPermission,
  getLocationPermissionSnapshot,
  openAppSettings,
  requestLocationPermissionsTwoStep,
  type LocationPermissionPhase,
  type LocationPermissionResult,
} from './location'
export {
  ACTIVITY_RECOGNITION_WHY,
  MOTION_PURPOSE,
  SENSOR_PACKAGES,
  classifyMotionPermission,
  getMotionPermissionSnapshot,
  requestMotionPermissions,
  type MotionPermissionPhase,
  type MotionPermissionResult,
} from './sensors'
export {
  LOCK_WARNING_MINUTES,
  NOTIFICATION_PURPOSE,
  classifyNotificationPermission,
  getNotificationPermissionSnapshot,
  requestNotificationPermissions,
  scheduleLockWarningNotification,
  type NotificationPermissionPhase,
  type NotificationPermissionResult,
} from './notifications'
export {
  fetchHomeLocation,
  saveHomeLocation,
  type HomeLocation,
} from './homeLocation'
export {
  loadPermissionsStatus,
  toneGlyph,
  type PermissionStatusRowModel,
  type PermissionTone,
} from './permissionsStatus'
export { MOBILE_API_BASE, mobileFetch, ApiError } from './api'
