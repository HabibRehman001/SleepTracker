/**
 * Step 192 — battery & reliability soak testing (real devices, not simulation).
 *
 * Background fetch / geofence / lock triggers are throttled unpredictably by
 * iOS and Android. Code review and sped-up-clock sims (Step 191) are necessary
 * but not sufficient — trust requires ≥3 real overnight soaks on both platforms.
 */

import {
  GEOFENCE_OVERNIGHT_DRAIN_BUDGET_PERCENT,
  GEOFENCE_POLLING_DRAIN_RED_FLAG_PERCENT,
  classifyOvernightGeofenceDrain,
} from './geofenceBattery'

/** Minimum consecutive (or total) real nights before trusting the build. */
export const SOAK_MIN_REAL_NIGHTS = 3

/** Platforms that must each complete a soak campaign. */
export const SOAK_REQUIRED_PLATFORMS = ['ios', 'android'] as const
export type SoakPlatform = (typeof SOAK_REQUIRED_PLATFORMS)[number]

/** Stages that must appear exactly once for a night to count as complete. */
export const SOAK_REQUIRED_STAGES = [
  'arrival',
  'warning',
  'lock',
  'unlock',
  'session_recorded',
] as const
export type SoakStage = (typeof SOAK_REQUIRED_STAGES)[number]

export const SOAK_RELIABILITY_TITLE = 'Battery & reliability soak'

export const SOAK_RELIABILITY_BODY =
  'Before trusting Sleep Lock in daily use, run it overnight for at least 3 real nights on a physical iPhone and Android phone. Background tasks are throttled unpredictably by the OS — a sped-up clock sim is not enough.'

export const SOAK_RELIABILITY_SHORT =
  '≥3 real overnight soaks on iOS and Android before trust.'

export const SOAK_OS_THROTTLE_NOTE =
  'iOS Background App Refresh / BGTaskScheduler and Android Doze / App Standby can delay SCHEDULED_LOCK and geofence delivery by minutes to hours. Measure real nights, not desk simulations.'

export type SoakStageEvent = {
  stage: SoakStage
  atIso: string
  detail?: string
}

export type SoakNightLog = {
  /** Local calendar sleep-day key yyyy-MM-dd. */
  sleepDayKey: string
  platform: SoakPlatform
  /** Battery % at lights-out / evening baseline (optional). */
  batteryStartPercent?: number | null
  /** Battery % next morning after unlock (optional). */
  batteryEndPercent?: number | null
  events: SoakStageEvent[]
  /** Tester notes (missed warn, late lock, etc.). */
  notes?: string
}

export type SoakNightVerdict = {
  sleepDayKey: string
  platform: SoakPlatform
  complete: boolean
  missingStages: SoakStage[]
  duplicateStages: SoakStage[]
  drainPercent: number | null
  drainWithinBudget: boolean | null
  drainRedFlag: boolean | null
  reasons: string[]
}

export type SoakCampaignVerdict = {
  /** True only when ≥ SOAK_MIN_REAL_NIGHTS complete nights exist per required platform. */
  trusted: boolean
  minNights: number
  completeByPlatform: Record<SoakPlatform, number>
  nights: SoakNightVerdict[]
  reasons: string[]
}

export function countStage(
  events: SoakStageEvent[],
  stage: SoakStage
): number {
  return events.filter((e) => e.stage === stage).length
}

/**
 * One real night passes when every required stage fired exactly once
 * and overnight drain (if measured) stays within the geofence budget.
 */
export function evaluateSoakNight(night: SoakNightLog): SoakNightVerdict {
  const missingStages: SoakStage[] = []
  const duplicateStages: SoakStage[] = []
  const reasons: string[] = []

  for (const stage of SOAK_REQUIRED_STAGES) {
    const n = countStage(night.events, stage)
    if (n === 0) missingStages.push(stage)
    if (n > 1) duplicateStages.push(stage)
  }

  if (missingStages.length) {
    reasons.push(`missing: ${missingStages.join(',')}`)
  }
  if (duplicateStages.length) {
    reasons.push(`duplicates: ${duplicateStages.join(',')}`)
  }

  let drainPercent: number | null = null
  let drainWithinBudget: boolean | null = null
  let drainRedFlag: boolean | null = null

  if (
    night.batteryStartPercent != null &&
    night.batteryEndPercent != null &&
    Number.isFinite(night.batteryStartPercent) &&
    Number.isFinite(night.batteryEndPercent)
  ) {
    drainPercent = Math.max(
      0,
      night.batteryStartPercent - night.batteryEndPercent
    )
    const drain = classifyOvernightGeofenceDrain(drainPercent)
    drainWithinBudget = drain.withinBudget
    drainRedFlag = drain.redFlagContinuousGps
    if (!drain.withinBudget) {
      reasons.push(
        `drain ${drainPercent}% > budget ${GEOFENCE_OVERNIGHT_DRAIN_BUDGET_PERCENT}%`
      )
    }
    if (drain.redFlagContinuousGps) {
      reasons.push(
        `drain ${drainPercent}% ≥ red-flag ${GEOFENCE_POLLING_DRAIN_RED_FLAG_PERCENT}%`
      )
    }
  }

  const complete =
    missingStages.length === 0 &&
    duplicateStages.length === 0 &&
    drainWithinBudget !== false

  return {
    sleepDayKey: night.sleepDayKey,
    platform: night.platform,
    complete,
    missingStages,
    duplicateStages,
    drainPercent,
    drainWithinBudget,
    drainRedFlag,
    reasons,
  }
}

/**
 * Campaign pass: each required platform has ≥ SOAK_MIN_REAL_NIGHTS complete nights.
 * Simulated / Step 191 ticks must not be mixed into these logs.
 */
export function evaluateSoakCampaign(
  nights: SoakNightLog[]
): SoakCampaignVerdict {
  const nightVerdicts = nights.map(evaluateSoakNight)
  const completeByPlatform: Record<SoakPlatform, number> = {
    ios: 0,
    android: 0,
  }
  for (const v of nightVerdicts) {
    if (v.complete) {
      completeByPlatform[v.platform] += 1
    }
  }

  const reasons: string[] = []
  for (const platform of SOAK_REQUIRED_PLATFORMS) {
    const n = completeByPlatform[platform]
    if (n < SOAK_MIN_REAL_NIGHTS) {
      reasons.push(
        `${platform}: ${n}/${SOAK_MIN_REAL_NIGHTS} complete real nights`
      )
    }
  }

  return {
    trusted: reasons.length === 0,
    minNights: SOAK_MIN_REAL_NIGHTS,
    completeByPlatform,
    nights: nightVerdicts,
    reasons,
  }
}

/** Checklist rows for Settings / manual QA (real device). */
export const SOAK_MANUAL_CHECKLIST = [
  'Install a release or dev-client build on a physical iPhone (not Simulator).',
  'Install the same on a physical Android phone (not emulator-only).',
  'Enable notifications, location always/precise as required, and locked schedule.',
  'For each night: note evening battery %, leave phone overnight with Sleep Lock armed.',
  'Confirm geofence arrival → 30-min warning → lock → morning unlock → session in backend.',
  'Confirm no duplicate warnings and no double-lock the same night.',
  'Morning battery %: overnight drain ≤ ~5% (not 20%+).',
  'Repeat until ≥3 complete nights on iOS and ≥3 on Android before trusting the build.',
] as const
