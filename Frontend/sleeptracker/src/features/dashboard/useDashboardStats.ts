import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api-client'

/** Mirrors GET /api/stats/summary (Backend StatsSummary). */
export type DashboardStats = {
  todaySleep: number | null
  sleepDebt: number
  avg7day: number | null
  avg30day: number | null
  consistencyScore: number
  avgBedtime: string | null
  avgWakeTime: string | null
  avgLatency: number | null
}

/** @deprecated Prefer DashboardStats — kept for existing imports. */
export type StatsSummary = DashboardStats

export const dashboardStatsQueryKey = ['stats-summary'] as const

/** @deprecated Prefer dashboardStatsQueryKey */
export const statsSummaryQueryKey = dashboardStatsQueryKey

/**
 * Step 60 — dashboard KPI query.
 * Same cache key as prior useStatsSummary so invalidation from saves still works.
 */
export const useDashboardStats = () =>
  useQuery({
    queryKey: ['stats-summary'],
    queryFn: () => api.get<DashboardStats>('/stats/summary'),
  })

/** @deprecated Prefer useDashboardStats */
export const useStatsSummary = useDashboardStats
