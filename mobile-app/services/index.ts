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
  registerScheduledLockTask,
  unregisterScheduledLockTask,
  isScheduledLockTaskRegistered,
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
  PRE_LOCK_WARNING_BODY,
  decidePreLockWarning,
  minutesUntilSleep,
  nextSleepOccurrenceId,
  runPreLockWarningOnce as runPreLockWarningOncePure,
} from './preLockWarningMath'
export {
  runPreLockWarningOnce,
  PRE_LOCK_WARNED_STORAGE_KEY,
} from './preLockWarning'
export {
  ARRIVAL_GRACE_PERIOD_MS,
  GRACE_MINUTES,
  computeEffectiveLockTime,
  effectiveLockTimeMs,
  isInEffectiveSleepWindow,
  resolveWakeAfter,
  effectiveLockOccurrenceId,
} from './lateArrivalMath'
export {
  computeDynamicLockWarningTrigger,
  type DynamicLockWarningTrigger,
} from './dynamicLockWarningMath'
export { resolveDynamicLockWarningTrigger } from './dynamicLockWarning'
export {
  NEVER_ARRIVED_HOME_POLICY,
  NEVER_ARRIVED_POLICY_TITLE,
  NEVER_ARRIVED_POLICY_BODY,
  NEVER_ARRIVED_POLICY_SHORT,
  evaluateNeverArrivedNight,
  shouldSkipLockForNeverArrived,
} from './neverArrivedPolicyMath'
export {
  formatDistanceFromHome,
  summarizeCurrentVsHome,
  regionFittingPoints,
  type CurrentLocationSummary,
} from './currentLocationMath'
export {
  isPedometerAvailable,
  watchLiveStepCount,
  stopLiveStepCount,
  getTodayStepCount,
  getStepCountBetween,
  getYesterdayStepCount,
  getHistoricalDaySteps,
  isWithinStepTolerance,
  isPlausibleWholeDayTotal,
  PEDOMETER_PURPOSE,
  PEDOMETER_HISTORY_PURPOSE,
  PEDOMETER_STEP_TOLERANCE,
  type HistoricalDaySteps,
} from './pedometer'
export {
  classifyActivity,
  cadenceFromStepDelta,
  JOG_CADENCE_MIN,
  RUN_CADENCE_MIN,
  ACTIVITY_CLASSIFY_PURPOSE,
  type ActivityType,
} from './activityClassification'
export {
  DEFAULT_DAILY_STEP_GOAL,
  buildWeekStepBars,
  goalProgress,
  resolveActivityMinutes,
  formatStepCount,
  type ActivityMinutes,
  type DayStepBar,
} from './activityScreenMath'
export { fetchSevenDayStepSeries, loadActivityMinutes } from './activityHistory'
export {
  formatCountdown,
  shouldShowLockCountdown,
  LOCK_COUNTDOWN_MAX_MINUTES,
} from './lockCountdownMath'
export {
  dismissLockCountdownThisSession,
  isLockCountdownDismissedThisSession,
  resetLockCountdownSession,
} from './lockCountdownSession'
export {
  recordHomeArrival,
  getHomeArrivalTime,
  loadHomeArrivalTime,
  persistHomeArrival,
  applyHomeGeofenceTransition,
  syncHomeArrivalFromGeofenceEnter,
  formatHomeArrivalHHMM,
  sleepDayDateKey,
} from './homeArrival'
export {
  persistHomeArrivalToBackend,
  type HomeArrivalUpsertResult,
} from './sessionApi'
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
export { fetchSchedule, lockSchedule, requestScheduleChange, type LockedSchedule } from './scheduleApi'
export {
  SCHEDULE_CHANGE_DELAY_MS,
  SCHEDULE_CHANGE_EFFECT_MESSAGE,
  computePendingEffectiveAt,
  isPendingChangeActive,
  isPendingChangeDue,
  resolveEnforcedSchedule,
} from './scheduleChange'
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
  startHomeGeofencing,
  stopHomeGeofencing,
  syncHomeGeofencing,
  hasStartedHomeGeofencing,
  HOME_GEOFENCE_TASK,
  buildHomeGeofenceRegion,
  interpretHomeGeofenceEvent,
} from './homeGeofence'
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
export {
  decideScheduledLock,
  isInSleepWindow,
  runScheduledLockOnce,
  SCHEDULED_LOCK_INTERVAL_SECONDS,
} from './scheduledLockMath'
export {
  persistEnforcedSchedule,
  loadEnforcedSchedule,
  runScheduledLockOnce as runScheduledLockWithNative,
} from './scheduledLock'
export { syncScheduledLockTrigger } from './syncScheduledLock'
export {
  syncMonthEndSummaryNotification,
  cancelMonthEndSummaryNotification,
  monthEndSummaryBody,
  nextMonthEndSummaryFireAt,
  MONTH_END_SUMMARY_NOTIFICATION_ID,
} from './monthEndSummary'
export {
  fetchMonthComparison,
} from './monthlyReportApi'
export {
  buildReportMetrics,
  formatMonthLabel,
  type MonthComparisonDTO,
  type ComparedReportMetric,
} from './monthlyReportMath'

