/**
 * Step 202 — schedule adherence (RN / offline; same as mobile-server).
 * Positive minutes = fell asleep after schedule (late drift);
 * negative = earlier than locked sleepTime.
 */

export function differenceInMinutes(a: Date, b: Date): number {
  return Math.round((a.getTime() - b.getTime()) / 60_000)
}

function parseClockHm(hhmm: string): { hours: number; minutes: number } {
  const m = /^(\d{1,2}):(\d{2})$/.exec(String(hhmm).trim())
  if (!m) {
    throw new Error(`sleepTime must be HH:MM, got ${hhmm}`)
  }
  const hours = Number(m[1])
  const minutes = Number(m[2])
  if (
    !Number.isFinite(hours) ||
    !Number.isFinite(minutes) ||
    hours < 0 ||
    hours > 23 ||
    minutes < 0 ||
    minutes > 59
  ) {
    throw new Error(`sleepTime must be HH:MM, got ${hhmm}`)
  }
  return { hours, minutes }
}

/**
 * Place locked sleepTime (HH:MM) on the occurrence nearest to passive bedTime
 * (handles same-day 04:00→04:40 and overnight 23:00→00:40).
 */
export function lockedSleepInstant(
  passiveBedTime: Date,
  lockedSleepTimeHHMM: string
): Date {
  const { hours, minutes } = parseClockHm(lockedSleepTimeHHMM)
  const candidates = [-1, 0, 1].map((dayOffset) => {
    const d = new Date(
      passiveBedTime.getFullYear(),
      passiveBedTime.getMonth(),
      passiveBedTime.getDate() + dayOffset,
      hours,
      minutes,
      0,
      0
    )
    return d
  })
  return candidates.reduce((best, d) =>
    Math.abs(d.getTime() - passiveBedTime.getTime()) <
    Math.abs(best.getTime() - passiveBedTime.getTime())
      ? d
      : best
  )
}

export type ScheduleAdherenceResult = {
  /** passive.bedTime − locked.sleepTime (minutes). +40 = 40 min late. */
  adherenceMinutes: number
  passiveBedTime: Date
  lockedSleepAt: Date
  lockedSleepTimeHHMM: string | null
}

/**
 * Direct answer: how many minutes off the locked bedtime was actual sleep?
 * adherenceMinutes = differenceInMinutes(passiveSession.bedTime, lockedSchedule.sleepTime)
 */
export function computeScheduleAdherence(input: {
  passiveSession: { bedTime: Date | string }
  lockedSchedule: { sleepTime: string } | { sleepTime: Date | string }
}): ScheduleAdherenceResult {
  const passiveBedTime =
    input.passiveSession.bedTime instanceof Date
      ? input.passiveSession.bedTime
      : new Date(input.passiveSession.bedTime)
  if (Number.isNaN(passiveBedTime.getTime())) {
    throw new Error('Invalid passiveSession.bedTime')
  }

  const raw = input.lockedSchedule.sleepTime
  let lockedSleepAt: Date
  let lockedSleepTimeHHMM: string | null = null

  if (typeof raw === 'string' && /^\d{1,2}:\d{2}$/.test(raw.trim())) {
    lockedSleepTimeHHMM = raw.trim()
    lockedSleepAt = lockedSleepInstant(passiveBedTime, lockedSleepTimeHHMM)
  } else {
    lockedSleepAt = raw instanceof Date ? raw : new Date(raw)
    if (Number.isNaN(lockedSleepAt.getTime())) {
      throw new Error('Invalid lockedSchedule.sleepTime')
    }
  }

  const adherenceMinutes = differenceInMinutes(passiveBedTime, lockedSleepAt)
  return {
    adherenceMinutes,
    passiveBedTime,
    lockedSleepAt,
    lockedSleepTimeHHMM,
  }
}
