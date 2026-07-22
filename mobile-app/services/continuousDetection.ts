/**
 * Step 197 / 201 — persist continuous nightly static windows (local, forever)
 * and push passive-ongoing sessions to the backend (actual vs enforced).
 */
import AsyncStorage from '@react-native-async-storage/async-storage'

import {
  CONTINUOUS_NIGHT_LOG_MAX,
  decideContinuousNightRecord,
  type ContinuousNightRecord,
} from './continuousDetectionMath'
import { loadMotionSamples } from './motionSample'
import { buildPassiveOngoingFromDetection } from './passiveSessionMath'
import { pushPassiveOngoingSession } from './sessionApi'
import { useBaselineStore } from '../store/baselineStore'
import type { DetectedSleepWindow } from './baselineDetection'

export const CONTINUOUS_NIGHTS_STORAGE_KEY =
  '@sleep_lock/continuous_night_windows_v1'

export type { ContinuousNightRecord }

async function loadNightRecords(): Promise<ContinuousNightRecord[]> {
  try {
    const raw = await AsyncStorage.getItem(CONTINUOUS_NIGHTS_STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown
    return Array.isArray(parsed) ? (parsed as ContinuousNightRecord[]) : []
  } catch {
    return []
  }
}

async function saveNightRecords(
  records: ContinuousNightRecord[]
): Promise<void> {
  const trimmed = records.slice(-CONTINUOUS_NIGHT_LOG_MAX)
  await AsyncStorage.setItem(
    CONTINUOUS_NIGHTS_STORAGE_KEY,
    JSON.stringify(trimmed)
  )
}

export async function listContinuousNights(): Promise<ContinuousNightRecord[]> {
  return loadNightRecords()
}

export async function clearContinuousNights(): Promise<void> {
  await AsyncStorage.removeItem(CONTINUOUS_NIGHTS_STORAGE_KEY)
}

/**
 * After a motion sample: try to finalize a completed sleep night into the
 * permanent log. Also feeds the 2-night baseline while it is not ready yet.
 * Step 201: POSTs passive-ongoing with detected bed/wake (alongside lock).
 */
export async function runContinuousDetectionOnce(
  now: Date = new Date()
): Promise<ContinuousNightRecord | null> {
  const samples = await loadMotionSamples()
  const existing = await loadNightRecords()
  const existingKeys = existing.map((r) => r.sleepDayKey)

  const decided = decideContinuousNightRecord({
    samples,
    existingSleepDayKeys: existingKeys,
    now,
  })
  if (!decided) return null

  const baseline = useBaselineStore.getState()
  let countedTowardBaseline = false
  if (!baseline.baselineReady) {
    const window: DetectedSleepWindow = {
      start: new Date(decided.startIso),
      end: new Date(decided.endIso),
    }
    baseline.addDetectedWindow(window)
    countedTowardBaseline = true
  }

  const record: ContinuousNightRecord = {
    ...decided,
    countedTowardBaseline,
  }
  await saveNightRecords([...existing, record])
  console.log(
    '[CONTINUOUS_DETECT] night',
    record.sleepDayKey,
    record.startIso,
    '→',
    record.endIso
  )

  // Step 201 — actual detection as its own backend row (not locked-schedule).
  try {
    const payload = buildPassiveOngoingFromDetection(record)
    await pushPassiveOngoingSession({
      bedTime: payload.bedTime,
      wakeTime: payload.wakeTime,
      stepsCount: payload.stepsCount,
    })
    console.log('[PASSIVE_SESSION] pushed passive-ongoing', record.sleepDayKey)
  } catch (err) {
    console.warn('[PASSIVE_SESSION] push failed', err)
  }

  return record
}
