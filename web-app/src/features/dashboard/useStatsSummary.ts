/**
 * Back-compat barrel — Step 60 moved the hook to useDashboardStats.ts.
 * Re-exports keep existing import paths working.
 */
export {
  useDashboardStats,
  useStatsSummary,
  dashboardStatsQueryKey,
  statsSummaryQueryKey,
  type DashboardStats,
  type StatsSummary,
} from './useDashboardStats'
