import { useQuery } from '@tanstack/react-query'
import type { AnalyticsDateRange } from '@/features/analytics/analyticsRange'
import { api } from '@/lib/api-client'

export type FactorGroupStats = {
  label: string
  avg: number | null
  n: number
}

export type FactorCorrelation = {
  factor: string
  outcome: string
  /** e.g. "Phone before sleep vs latency" */
  label: string
  groupA: FactorGroupStats
  groupB: FactorGroupStats
}

export type ScatterPoint = {
  x: number
  y: number
  date: string
}

export type LinearRegression = {
  slope: number
  intercept: number
  n: number
}

export type ScatterCorrelation = {
  key: string
  label: string
  xLabel: string
  yLabel: string
  points: ScatterPoint[]
  regression: LinearRegression | null
}

export type ScatterCorrelationsResponse = {
  scatters: ScatterCorrelation[]
}

export type InsightsResponse = {
  insights: string[]
}

export type PatternWarning = {
  key: 'weekendJetlag' | 'circadianDrift'
  severity: 'warning'
  message: string
}

export type PatternHighlight = {
  key: 'goodNightStreak' | 'personalRecord' | 'cumulativeDebt'
  message: string
}

export type SmartPatternsResponse = {
  warnings: PatternWarning[]
  highlights: PatternHighlight[]
}

function rangeQuery(range: AnalyticsDateRange): string {
  return range === 'all' ? '' : `?range=${range}`
}

export const correlationsQueryKey = (range: AnalyticsDateRange = 'all') =>
  ['analytics', 'correlations', range] as const

export const insightsQueryKey = (range: AnalyticsDateRange = 'all') =>
  ['analytics', 'insights', range] as const

export const scatterQueryKey = (range: AnalyticsDateRange = 'all') =>
  ['analytics', 'scatter', range] as const

export const patternsQueryKey = (range: AnalyticsDateRange = 'all') =>
  ['analytics', 'patterns', range] as const

export const useCorrelations = (range: AnalyticsDateRange = 'all') =>
  useQuery({
    queryKey: correlationsQueryKey(range),
    queryFn: () =>
      api.get<FactorCorrelation[]>(
        `/analytics/correlations${rangeQuery(range)}`
      ),
  })

export const useInsights = (range: AnalyticsDateRange = 'all') =>
  useQuery({
    queryKey: insightsQueryKey(range),
    queryFn: async () => {
      const body = await api.get<InsightsResponse>(
        `/analytics/insights${rangeQuery(range)}`
      )
      return body.insights
    },
  })

export const useScatterCorrelations = (range: AnalyticsDateRange = 'all') =>
  useQuery({
    queryKey: scatterQueryKey(range),
    queryFn: async () => {
      const body = await api.get<ScatterCorrelationsResponse>(
        `/analytics/scatter${rangeQuery(range)}`
      )
      return body.scatters
    },
  })

export const useSmartPatterns = (range: AnalyticsDateRange = 'all') =>
  useQuery({
    queryKey: patternsQueryKey(range),
    queryFn: () =>
      api.get<SmartPatternsResponse>(
        `/analytics/patterns${rangeQuery(range)}`
      ),
  })
