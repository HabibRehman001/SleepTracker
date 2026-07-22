/**
 * Step 127 / 175 / 201 — ActivitySession API client (mobile-server).
 */
import { mobileFetch } from './api'
import { PASSIVE_ONGOING_SOURCE } from './passiveSessionMath'

export type ActivitySessionSource =
  | 'baseline-auto'
  | 'locked-schedule'
  | 'passive-ongoing'

export type ActivitySessionPayload = {
  _id?: string
  id?: string
  date: string
  bedTime: string
  wakeTime: string
  source: ActivitySessionSource
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
    source?: ActivitySessionSource
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
 * Upserts the locked-schedule row only (never overwrites passive-ongoing).
 */
export async function finalizeLockedNightToBackend(input: {
  homeArrivalTime: Date
  bedTime: Date
  wakeTime: Date
}): Promise<ActivitySessionPayload> {
  return createActivitySession({
    date: input.homeArrivalTime,
    bedTime: input.bedTime,
    wakeTime: input.wakeTime,
    source: 'locked-schedule',
    homeArrivalTime: input.homeArrivalTime,
  })
}

/** POST /sessions — create/upsert ActivitySession by date × source. */
export async function createActivitySession(payload: {
  date: Date
  bedTime: Date
  wakeTime: Date
  source: ActivitySessionSource
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

/** Step 201 — push continuous detection as passive-ongoing (actual bed/wake). */
export async function pushPassiveOngoingSession(input: {
  bedTime: Date
  wakeTime: Date
  stepsCount?: number
}): Promise<ActivitySessionPayload> {
  return createActivitySession({
    date: input.bedTime,
    bedTime: input.bedTime,
    wakeTime: input.wakeTime,
    source: PASSIVE_ONGOING_SOURCE,
    stepsCount: input.stepsCount,
  })
}

/** GET /sessions?source=… — independently query passive or locked rows. */
export async function listActivitySessions(params?: {
  range?: string
  source?: ActivitySessionSource
}): Promise<{
  range: string
  source: string | null
  count: number
  sessions: ActivitySessionPayload[]
}> {
  const q = new URLSearchParams()
  q.set('range', params?.range ?? '30d')
  if (params?.source) q.set('source', params.source)
  return mobileFetch(`/sessions?${q.toString()}`)
}
