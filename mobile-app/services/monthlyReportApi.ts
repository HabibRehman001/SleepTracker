import { mobileFetch } from './api'
import type { MonthComparisonDTO } from './monthlyReportMath'

/** GET /stats/comparison — this month vs last (mobile-server Step 130). */
export async function fetchMonthComparison(
  month?: string
): Promise<MonthComparisonDTO> {
  const q = month ? `?month=${encodeURIComponent(month)}` : ''
  return mobileFetch<MonthComparisonDTO>(`/stats/comparison${q}`)
}
