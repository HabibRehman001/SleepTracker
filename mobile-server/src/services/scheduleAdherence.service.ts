/**
 * Step 202 — load passive nights + locked schedule → adherence minutes.
 */
import { getSchedule, ScheduleNotFoundError } from './schedule.service'
import { listActivitySessions } from './session.service'
import {
  computeScheduleAdherence,
  type ScheduleAdherenceResult,
} from './scheduleAdherenceMath'

export type NightAdherenceRow = ScheduleAdherenceResult & {
  date: Date
  sleepDayKey: string
  wakeTime: Date
}

function sleepDayKeyFromDate(d: Date): string {
  const y = d.getFullYear()
  const mo = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${mo}-${day}`
}

/**
 * For each passive-ongoing session, compare bedTime to the locked schedule
 * sleepTime. Queryable independently of locked-schedule session rows.
 */
export async function listScheduleAdherence(
  range?: string
): Promise<{
  sleepTime: string | null
  count: number
  nights: NightAdherenceRow[]
}> {
  let schedule: Awaited<ReturnType<typeof getSchedule>> | null = null
  try {
    schedule = await getSchedule()
  } catch (err) {
    if (err instanceof ScheduleNotFoundError) {
      return { sleepTime: null, count: 0, nights: [] }
    }
    throw err
  }

  const sleepTime = String(schedule.enforcedSleepTime ?? schedule.sleepTime)
  const passive = await listActivitySessions(range ?? '30d', 'passive-ongoing')

  const nights: NightAdherenceRow[] = []
  for (const row of passive) {
    const bedTime =
      row.bedTime instanceof Date ? row.bedTime : new Date(String(row.bedTime))
    const wakeTime =
      row.wakeTime instanceof Date
        ? row.wakeTime
        : new Date(String(row.wakeTime))
    const date =
      row.date instanceof Date ? row.date : new Date(String(row.date))
    const result = computeScheduleAdherence({
      passiveSession: { bedTime },
      lockedSchedule: { sleepTime },
    })
    nights.push({
      ...result,
      date,
      sleepDayKey: sleepDayKeyFromDate(date),
      wakeTime,
    })
  }

  return {
    sleepTime,
    count: nights.length,
    nights,
  }
}

/** Single-night helper (tests / call sites with already-loaded docs). */
export function adherenceForPassiveNight(
  passive: { bedTime: Date | string },
  lockedSleepTime: string
): ScheduleAdherenceResult {
  return computeScheduleAdherence({
    passiveSession: passive,
    lockedSchedule: { sleepTime: lockedSleepTime },
  })
}
