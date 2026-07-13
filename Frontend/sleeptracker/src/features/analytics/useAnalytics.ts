import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api-client'

export type FactorGroupStats = {
  label: string
  avgLatency: number | null
  avgQuality: number | null
  n: number
}

export type FactorCorrelation = {
  factor: string
  groupA: FactorGroupStats
  groupB: FactorGroupStats
}

export const correlationsQueryKey = ['analytics', 'correlations'] as const
export const insightsQueryKey = ['analytics', 'insights'] as const

export const useCorrelations = () =>
  useQuery({
    queryKey: correlationsQueryKey,
    queryFn: () => api.get<FactorCorrelation[]>('/analytics/correlations'),
  })

export const useInsights = () =>
  useQuery({
    queryKey: insightsQueryKey,
    queryFn: () => api.get<string[]>('/analytics/insights'),
  })
