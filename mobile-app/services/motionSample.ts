import AsyncStorage from '@react-native-async-storage/async-storage'
import { Accelerometer } from 'expo-sensors'
import { Platform } from 'react-native'

import {
  classifyMotionMagnitude,
  computeMagnitude,
  MOTION_SAMPLE_LOG_MAX,
  type MotionSample,
} from './motionSampleMath'
import { getHomeGeofenceState } from './geofence'

export {
  classifyMotionMagnitude,
  computeMagnitude,
  countLowMagnitudeInWindow,
  countStaticInWindow,
  deviationFromGravityMs2,
  GRAVITY_G,
  GRAVITY_MS2,
  isLowMagnitudeStillProxy,
  isStatic,
  MOTION_SAMPLE_INTERVAL_SECONDS,
  MOTION_SAMPLE_LOG_MAX,
  CONTINUOUS_MOTION_LOG_MAX,
  STATIC_THRESHOLD,
  type MotionSample,
} from './motionSampleMath'

const STORAGE_KEY = 'sleep_lock_motion_samples_v1'

/** In-process cache of the last accel reading (prompt’s getLastReading stand-in). */
let lastReading: { x: number; y: number; z: number } | null = null

/**
 * expo-sensors has no getLastReading — take one sample via a short subscription.
 * Matches the Step 141 intent without continuous streaming.
 */
export async function getAccelerometerReading(
  timeoutMs = 2500
): Promise<{ x: number; y: number; z: number }> {
  if (Platform.OS === 'web') {
    // Deterministic web stub so UI/dev can exercise the log path (flat / static).
    const stub = { x: 0, y: 0, z: 1 }
    lastReading = stub
    return stub
  }

  const available = await Accelerometer.isAvailableAsync()
  if (!available) {
    throw new Error('Accelerometer unavailable')
  }

  return new Promise((resolve, reject) => {
    let settled = false
    const timer = setTimeout(() => {
      if (settled) return
      settled = true
      subscription.remove()
      reject(new Error('Accelerometer read timed out'))
    }, timeoutMs)

    Accelerometer.setUpdateInterval(100)
    const subscription = Accelerometer.addListener((data) => {
      if (settled) return
      settled = true
      clearTimeout(timer)
      subscription.remove()
      const reading = { x: data.x, y: data.y, z: data.z }
      lastReading = reading
      resolve(reading)
    })
  })
}

/** Prompt-shaped helper: last cached reading, or a fresh one-shot. */
export async function getLastReading(): Promise<{
  x: number
  y: number
  z: number
}> {
  if (lastReading) return lastReading
  return getAccelerometerReading()
}

function toSample(
  partial: Pick<MotionSample, 'timestamp' | 'magnitude'> &
    Partial<
      Pick<
        MotionSample,
        'x' | 'y' | 'z' | 'deviationMs2' | 'isStatic' | 'insideHomeGeofence'
      >
    >
): MotionSample {
  const classified = classifyMotionMagnitude(partial.magnitude)
  return {
    timestamp: partial.timestamp,
    magnitude: partial.magnitude,
    deviationMs2: partial.deviationMs2 ?? classified.deviationMs2,
    isStatic: partial.isStatic ?? classified.isStatic,
    insideHomeGeofence:
      typeof partial.insideHomeGeofence === 'boolean'
        ? partial.insideHomeGeofence
        : (getHomeGeofenceState() ?? undefined),
    x: partial.x ?? lastReading?.x ?? 0,
    y: partial.y ?? lastReading?.y ?? 0,
    z: partial.z ?? lastReading?.z ?? 0,
  }
}

export async function storeSample(
  sample: Pick<MotionSample, 'timestamp' | 'magnitude'> &
    Partial<
      Pick<
        MotionSample,
        'x' | 'y' | 'z' | 'deviationMs2' | 'isStatic' | 'insideHomeGeofence'
      >
    >
): Promise<MotionSample> {
  const entry = toSample(sample)
  const existing = await loadMotionSamples()
  existing.push(entry)
  const trimmed =
    existing.length > MOTION_SAMPLE_LOG_MAX
      ? existing.slice(existing.length - MOTION_SAMPLE_LOG_MAX)
      : existing
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed))
  return entry
}

function normalizeLoaded(row: unknown): MotionSample | null {
  if (!row || typeof row !== 'object') return null
  const r = row as Partial<MotionSample>
  if (typeof r.timestamp !== 'number' || typeof r.magnitude !== 'number') {
    return null
  }
  return toSample({
    timestamp: r.timestamp,
    magnitude: r.magnitude,
    x: typeof r.x === 'number' ? r.x : 0,
    y: typeof r.y === 'number' ? r.y : 0,
    z: typeof r.z === 'number' ? r.z : 0,
    deviationMs2:
      typeof r.deviationMs2 === 'number' ? r.deviationMs2 : undefined,
    isStatic: typeof r.isStatic === 'boolean' ? r.isStatic : undefined,
    insideHomeGeofence:
      typeof r.insideHomeGeofence === 'boolean'
        ? r.insideHomeGeofence
        : undefined,
  })
}

export async function loadMotionSamples(): Promise<MotionSample[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return []
    return parsed
      .map(normalizeLoaded)
      .filter((row): row is MotionSample => row != null)
  } catch {
    return []
  }
}

export async function clearMotionSamples(): Promise<void> {
  await AsyncStorage.removeItem(STORAGE_KEY)
}

/**
 * One sample cycle: read accel → magnitude → classify static → append local log.
 */
export async function runMotionSampleOnce(): Promise<MotionSample> {
  const { x, y, z } = await getAccelerometerReading()
  const magnitude = computeMagnitude(x, y, z)
  return storeSample({ timestamp: Date.now(), magnitude, x, y, z })
}
