/**
 * Step 201 — build/push passive-ongoing sessions (actual detection).
 * Pure helpers; I/O stays in continuousDetection + sessionApi.
 */

export const PASSIVE_ONGOING_SOURCE = 'passive-ongoing' as const

export type PassiveOngoingPayload = {
  date: Date
  bedTime: Date
  wakeTime: Date
  source: typeof PASSIVE_ONGOING_SOURCE
  stepsCount: number
}

function sleepDayMidnight(at: Date): Date {
  const d = new Date(at.getFullYear(), at.getMonth(), at.getDate())
  d.setHours(0, 0, 0, 0)
  return d
}

/** Map a continuous night record → ActivitySession POST body. */
export function buildPassiveOngoingFromDetection(input: {
  startIso: string
  endIso: string
  stepsCount?: number
}): PassiveOngoingPayload {
  const bedTime = new Date(input.startIso)
  const wakeTime = new Date(input.endIso)
  return {
    date: sleepDayMidnight(bedTime),
    bedTime,
    wakeTime,
    source: PASSIVE_ONGOING_SOURCE,
    stepsCount: input.stepsCount ?? 0,
  }
}
