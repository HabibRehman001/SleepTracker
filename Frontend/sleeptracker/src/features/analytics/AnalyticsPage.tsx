import * as React from 'react'

import {
  BedtimeWakeConsistencyCharts,
  QualityContributionHeatmap,
  SleepDurationChart,
  SleepQualityOverTimeChart,
  SleepTimelineChart,
  WeekdayWeekendChart,
} from '@/components/charts'
import { EmptyState, FIRST_NIGHT_CTA } from '@/components/ui/EmptyState'
import { SleepTrackerLoader } from '@/components/ui/Loader'
import { DateRangeFilter } from '@/features/analytics/DateRangeFilter'
import {
  durationLimitForRange,
  filterEntriesByAnalyticsRange,
  type AnalyticsDateRange,
} from '@/features/analytics/analyticsRange'
import {
  useCorrelations,
  useInsights,
  useScatterCorrelations,
} from '@/features/analytics/useAnalytics'
import { CorrelationCards } from '@/features/dashboard/CorrelationCards'
import { CorrelationScatterCharts } from '@/features/dashboard/CorrelationScatterCharts'
import { DashboardCharts } from '@/features/dashboard/DashboardCharts'
import { InsightsPanelView } from '@/features/dashboard/InsightsPanel'
import { useSleepEntries } from '@/features/sleep-entry'

/**
 * Step 90 — analytics surface; Step 109 — loading + empty guards.
 */
export function AnalyticsPage() {
  const [range, setRange] = React.useState<AnalyticsDateRange>('30d')
  const { data: allEntries = [], isLoading: entriesLoading } = useSleepEntries()
  const entries = React.useMemo(
    () => filterEntriesByAnalyticsRange(allEntries, range),
    [allEntries, range]
  )

  const { data: correlations, isLoading: corrLoading, isFetching: corrFetching } =
    useCorrelations(range)
  const { data: scatters, isLoading: scatterLoading, isFetching: scatterFetching } =
    useScatterCorrelations(range)
  const { data: insights, isLoading: insightsLoading, isFetching: insightsFetching } =
    useInsights(range)

  const durationLimit = durationLimitForRange(range, entries.length)
  const durationTitle =
    range === 'all'
      ? 'Sleep duration (all time)'
      : `Sleep duration (${range})`

  const chartsBusy =
    entriesLoading ||
    corrLoading ||
    scatterLoading ||
    insightsLoading ||
    corrFetching ||
    scatterFetching ||
    insightsFetching

  const noDataYet = !entriesLoading && allEntries.length === 0

  return (
    <div
      className="mx-auto flex w-full min-w-0 max-w-6xl flex-col gap-5"
      data-testid="analytics-page"
      data-range={range}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Analytics</h1>
          <p className="text-muted-foreground text-sm">
            {entriesLoading
              ? 'loading…'
              : `${entries.length} nights in range`}
            {chartsBusy && !entriesLoading ? ' · updating…' : null}
          </p>
        </div>
        <DateRangeFilter value={range} onChange={setRange} />
      </div>

      {entriesLoading && allEntries.length === 0 ? (
        <SleepTrackerLoader
          fullScreen={false}
          size="md"
          label="Loading analytics…"
        />
      ) : noDataYet ? (
        <EmptyState
          title="No analytics yet"
          description={FIRST_NIGHT_CTA}
          data-testid="analytics-empty"
        />
      ) : (
        <>
          <section className="min-w-0 space-y-2" data-testid="analytics-charts">
            <h2 className="text-muted-foreground text-[10px] font-medium tracking-wide uppercase">
              Charts
            </h2>
            <DashboardCharts entries={entries} />
            <SleepDurationChart
              entries={entries}
              title={durationTitle}
              limit={durationLimit}
            />
            <SleepQualityOverTimeChart entries={entries} />
            <QualityContributionHeatmap entries={entries} />
            <SleepTimelineChart
              entries={entries}
              limit={durationLimit}
              title={
                range === 'all'
                  ? 'Sleep timeline'
                  : `Sleep timeline (${range})`
              }
            />
            <BedtimeWakeConsistencyCharts entries={entries} />
            <WeekdayWeekendChart entries={entries} />
          </section>

          <section className="space-y-2" data-testid="analytics-insights">
            <h2 className="text-muted-foreground text-[10px] font-medium tracking-wide uppercase">
              Insights
            </h2>
            <InsightsPanelView
              insights={insights}
              isLoading={
                insightsLoading || (insightsFetching && insights == null)
              }
            />
          </section>

          <section
            className="min-w-0 space-y-2"
            data-testid="analytics-correlations"
          >
            <h2 className="text-muted-foreground text-[10px] font-medium tracking-wide uppercase">
              Correlations
            </h2>
            <CorrelationScatterCharts
              scatters={scatters}
              isLoading={
                scatterLoading || (scatterFetching && scatters == null)
              }
            />
            <CorrelationCards
              correlations={correlations}
              isLoading={corrLoading || (corrFetching && correlations == null)}
            />
          </section>
        </>
      )}
    </div>
  )
}
