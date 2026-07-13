import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api-client'

/** Mirrors GET /api/stats/summary (Backend StatsSummary). */
export type StatsSummary = {
  todaySleep: number | null
  sleepDebt: number
  avg7day: number | null
  avg30day: number | null
  consistencyScore: number
  avgBedtime: string | null
  avgWakeTime: string | null
  avgLatency: number | null
}

export const statsSummaryQueryKey = ['stats-summary'] as const

export const useStatsSummary = () =>
  useQuery({
    queryKey: statsSummaryQueryKey,
    queryFn: () => api.get<StatsSummary>('/stats/summary'),
  })
