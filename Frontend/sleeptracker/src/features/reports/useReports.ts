import { useQuery } from '@tanstack/react-query'

import { api } from '@/lib/api-client'
import type { MonthCompareResult } from '@/features/reports/reportCompare'

export const monthCompareQueryKey = (month?: string) =>
  ['reports', 'compare', month ?? 'current'] as const

export function useMonthCompare(month?: string) {
  const qs = month ? `?month=${encodeURIComponent(month)}` : ''
  return useQuery({
    queryKey: monthCompareQueryKey(month),
    queryFn: () => api.get<MonthCompareResult>(`/reports/compare${qs}`),
  })
}
