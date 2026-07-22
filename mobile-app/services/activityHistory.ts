import AsyncStorage from '@react-native-async-storage/async-storage'

import type { ActivityType } from './activityClassification'
import { getHistoricalDaySteps, getTodayStepCount } from './pedometer'
import { startOfLocalDay } from './pedometerMath'
import type { ActivityMinutes } from './activityScreenMath'

const MINUTES_KEY_PREFIX = '@sleep_lock/activity_minutes_'

export function activityMinutesStorageKey(day: Date = new Date()): string {
  const d = startOfLocalDay(day)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const dayNum = String(d.getDate()).padStart(2, '0')
  return `${MINUTES_KEY_PREFIX}${y}-${m}-${dayNum}`
}

export async function loadActivityMinutes(
  day: Date = new Date()
): Promise<ActivityMinutes> {
  try {
    const raw = await AsyncStorage.getItem(activityMinutesStorageKey(day))
    if (!raw) return { walk: 0, jog: 0, run: 0 }
    const parsed = JSON.parse(raw) as Partial<ActivityMinutes>
    return {
      walk: Number(parsed.walk) || 0,
      jog: Number(parsed.jog) || 0,
      run: Number(parsed.run) || 0,
    }
  } catch {
    return { walk: 0, jog: 0, run: 0 }
  }
}

export async function saveActivityMinutes(
  minutes: ActivityMinutes,
  day: Date = new Date()
): Promise<void> {
  await AsyncStorage.setItem(
    activityMinutesStorageKey(day),
    JSON.stringify(minutes)
  )
}

/** Fetch OS step history for the last 7 local days (0 = today … 6). */
export async function fetchSevenDayStepSeries(
  now = new Date()
): Promise<Array<{ daysAgo: number; steps: number | null }>> {
  const out: Array<{ daysAgo: number; steps: number | null }> = []
  for (let ago = 0; ago <= 6; ago++) {
    if (ago === 0) {
      const today = await getTodayStepCount(now)
      out.push({ daysAgo: 0, steps: today })
      continue
    }
    const day = await getHistoricalDaySteps(ago, now)
    out.push({ daysAgo: ago, steps: day?.steps ?? null })
  }
  return out
}

/**
 * Tick one second of classified activity into minutes (floor to whole minutes
 * by accumulating ms externally — caller passes whole minutes to add).
 */
export function addActivityMinute(
  current: ActivityMinutes,
  type: ActivityType,
  minutes = 1
): ActivityMinutes {
  const next = { ...current }
  next[type] = Math.max(0, next[type] + minutes)
  return next
}
