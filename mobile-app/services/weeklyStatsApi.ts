/**
 * Step 203/204 — GET /stats/weekly client.
 */
import { mobileFetch } from './api'

export type WeeklyStatsNightDTO = {
  sleepDayKey: string
  date: string
  bedTime: string
  wakeTime: string
  durationMinutes: number
  adherenceMinutes: number | null
}

export type WeeklyStatsDTO = {
  from: string
  to: string
  days: number
  nightCount: number
  avgDurationMinutes: number | null
  avgAdherenceMinutes: number | null
  lockedSleepTime: string | null
  nights: WeeklyStatsNightDTO[]
}

/** Fresh weekly aggregation from passive-ongoing sessions. */
export async function fetchWeeklyStats(): Promise<WeeklyStatsDTO> {
  return mobileFetch<WeeklyStatsDTO>('/stats/weekly')
}
