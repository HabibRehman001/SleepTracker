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
  registerMotionSampleTask,
  unregisterMotionSampleTask,
  isMotionSampleTaskRegistered,
} from './backgroundTasks'
export {
  computeMagnitude,
  countLowMagnitudeInWindow,
  countStaticInWindow,
  deviationFromGravityMs2,
  isLowMagnitudeStillProxy,
  isStatic,
  loadMotionSamples,
  clearMotionSamples,
  runMotionSampleOnce,
  storeSample,
  getLastReading,
  MOTION_SAMPLE_INTERVAL_SECONDS,
  STATIC_THRESHOLD,
  type MotionSample,
} from './motionSample'
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
export {
  findLongestStaticWindow,
  findLongestSleepWindow,
  isInNightWindow,
  synthesizeSamples,
  MIN_STATIC_SLEEP_MS,
  MAX_STATIC_SLEEP_MS,
  NIGHT_WINDOW_START_HOUR,
  NIGHT_WINDOW_END_HOUR,
  type Sample,
  type StaticWindow,
} from './staticWindow'
export {
  distanceMeters,
  isInsideHomeGeofence,
  setHomeGeofenceState,
  getHomeGeofenceState,
  clearHomeGeofenceState,
  resolveInsideHomeGeofence,
  HOME_GEOFENCE_RADIUS_METERS,
  type LatLng,
} from './geofence'
export {
  averageBedWakeFromWindows,
  averageClockTimes,
  formatHHMM,
  formatClock12h,
  formatSuggestedSchedule,
  formatNightRange,
  BASELINE_TARGET_NIGHTS,
  type DetectedSleepWindow,
} from './baselineDetection'
export {
  evaluateNightDetection,
  FAILED_DETECTION_PROMPT,
  MIN_VALID_DETECTION_MS,
  manualNightToWindow,
  isValidHHMM,
} from './nightDetection'
