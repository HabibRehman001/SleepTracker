/**
 * Step 127 / 175 — ActivitySession API client (mobile-server).
 */
import { mobileFetch } from './api'

export type ActivitySessionPayload = {
  _id?: string
  id?: string
  date: string
  bedTime: string
  wakeTime: string
  source: 'baseline-auto' | 'locked-schedule'
  stepsCount?: number
  homeArrivalTime?: string | null
}

export type HomeArrivalUpsertResult = {
  session: ActivitySessionPayload
  homeArrivalTime: string | null
  /** Local HH:MM on the server — e.g. "04:30". */
  homeArrivalHHMM: string | null
}

/** Step 175 — persist homeArrivalTime for the current sleep day's session. */
export async function persistHomeArrivalToBackend(
  homeArrivalTime: Date,
  extras?: {
    bedTime?: Date
    wakeTime?: Date
    source?: 'baseline-auto' | 'locked-schedule'
  }
): Promise<HomeArrivalUpsertResult> {
  return mobileFetch<HomeArrivalUpsertResult>('/sessions/home-arrival', {
    method: 'PUT',
    body: JSON.stringify({
      homeArrivalTime: homeArrivalTime.toISOString(),
      ...(extras?.bedTime
        ? { bedTime: extras.bedTime.toISOString() }
        : {}),
      ...(extras?.wakeTime
        ? { wakeTime: extras.wakeTime.toISOString() }
        : {}),
      ...(extras?.source ? { source: extras.source } : {}),
    }),
  })
}

/**
 * Step 191 — finalize the locked night on the backend after scheduled unlock.
 * Reuses the sleep-day upsert so we don't create a duplicate row.
 */
export async function finalizeLockedNightToBackend(input: {
  homeArrivalTime: Date
  bedTime: Date
  wakeTime: Date
}): Promise<HomeArrivalUpsertResult> {
  return persistHomeArrivalToBackend(input.homeArrivalTime, {
    bedTime: input.bedTime,
    wakeTime: input.wakeTime,
    source: 'locked-schedule',
  })
}

/** POST /sessions — create a new ActivitySession (baseline or manual). */
export async function createActivitySession(payload: {
  date: Date
  bedTime: Date
  wakeTime: Date
  source: 'baseline-auto' | 'locked-schedule'
  stepsCount?: number
  homeArrivalTime?: Date | null
}): Promise<ActivitySessionPayload> {
  return mobileFetch<ActivitySessionPayload>('/sessions', {
    method: 'POST',
    body: JSON.stringify({
      date: payload.date.toISOString(),
      bedTime: payload.bedTime.toISOString(),
      wakeTime: payload.wakeTime.toISOString(),
      source: payload.source,
      ...(payload.stepsCount != null ? { stepsCount: payload.stepsCount } : {}),
      ...(payload.homeArrivalTime
        ? { homeArrivalTime: payload.homeArrivalTime.toISOString() }
        : {}),
    }),
  })
}
