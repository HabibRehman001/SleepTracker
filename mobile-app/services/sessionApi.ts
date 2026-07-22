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
