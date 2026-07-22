/**
 * Step 192 — persist real-device soak night logs (not sped-up sims).
 * Background SCHEDULED_LOCK / geofence paths append stages for post-soak review.
 */
import AsyncStorage from '@react-native-async-storage/async-storage'
import { Platform } from 'react-native'

import { sleepDayDateKey } from './homeArrivalMath'
import {
  evaluateSoakCampaign,
  type SoakNightLog,
  type SoakPlatform,
  type SoakStage,
  type SoakStageEvent,
} from './soakReliabilityMath'

export const SOAK_NIGHTS_STORAGE_KEY = '@sleep_lock/soak_night_logs'
/** Cap retained nights so storage stays small. */
export const SOAK_LOG_RETENTION = 30

function resolvePlatform(): SoakPlatform {
  return Platform.OS === 'ios' ? 'ios' : 'android'
}

async function loadAllNights(): Promise<SoakNightLog[]> {
  const raw = await AsyncStorage.getItem(SOAK_NIGHTS_STORAGE_KEY)
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw) as SoakNightLog[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

async function saveAllNights(nights: SoakNightLog[]): Promise<void> {
  const trimmed = nights.slice(-SOAK_LOG_RETENTION)
  await AsyncStorage.setItem(SOAK_NIGHTS_STORAGE_KEY, JSON.stringify(trimmed))
}

function upsertNight(
  nights: SoakNightLog[],
  sleepDayKey: string,
  platform: SoakPlatform,
  patch: (night: SoakNightLog) => SoakNightLog
): SoakNightLog[] {
  const idx = nights.findIndex(
    (n) => n.sleepDayKey === sleepDayKey && n.platform === platform
  )
  if (idx >= 0) {
    const next = [...nights]
    next[idx] = patch(nights[idx])
    return next
  }
  const blank: SoakNightLog = { sleepDayKey, platform, events: [] }
  return [...nights, patch(blank)]
}

/**
 * Append one stage for today's sleep day. Duplicate stages are kept so
 * evaluateSoakNight fails the night during soak review.
 */
export async function appendSoakStage(
  stage: SoakStage,
  opts?: {
    at?: Date
    detail?: string
    platform?: SoakPlatform
  }
): Promise<void> {
  const at = opts?.at ?? new Date()
  const platform = opts?.platform ?? resolvePlatform()
  const sleepDayKey = sleepDayDateKey(at)
  const event: SoakStageEvent = {
    stage,
    atIso: at.toISOString(),
    ...(opts?.detail ? { detail: opts.detail } : {}),
  }

  const existing = await loadAllNights()
  const next = upsertNight(existing, sleepDayKey, platform, (night) => ({
    ...night,
    events: [...night.events, event],
  }))
  await saveAllNights(next)
}

/** Optional morning/evening battery % for drain review. */
export async function recordSoakBatterySample(input: {
  sleepDayKey?: string
  kind: 'start' | 'end'
  percent: number
  platform?: SoakPlatform
  at?: Date
}): Promise<void> {
  const at = input.at ?? new Date()
  const platform = input.platform ?? resolvePlatform()
  const sleepDayKey = input.sleepDayKey ?? sleepDayDateKey(at)
  const existing = await loadAllNights()
  const next = upsertNight(existing, sleepDayKey, platform, (night) => ({
    ...night,
    ...(input.kind === 'start'
      ? { batteryStartPercent: input.percent }
      : { batteryEndPercent: input.percent }),
  }))
  await saveAllNights(next)
}

export async function listSoakNights(): Promise<SoakNightLog[]> {
  return loadAllNights()
}

export async function getSoakCampaignStatus() {
  const nights = await loadAllNights()
  return evaluateSoakCampaign(nights)
}

export async function clearSoakNights(): Promise<void> {
  await AsyncStorage.removeItem(SOAK_NIGHTS_STORAGE_KEY)
}

/** Best-effort; never throws into lock/geofence paths. */
export function appendSoakStageSafe(
  stage: SoakStage,
  opts?: Parameters<typeof appendSoakStage>[1]
): void {
  void appendSoakStage(stage, opts).catch((err) => {
    console.warn('[SOAK] append stage failed', stage, err)
  })
}
