import { Button } from '@/components/ui/button'
import { EmptyState, FIRST_NIGHT_CTA } from '@/components/ui/EmptyState'
import { SleepTrackerLoader } from '@/components/ui/Loader'
import { useCorrelations, useScatterCorrelations } from '@/features/analytics'
import { CorrelationCards } from '@/features/dashboard/CorrelationCards'
import { CorrelationScatterCharts } from '@/features/dashboard/CorrelationScatterCharts'
import {
  BedtimeWakeConsistencyCharts,
  QualityContributionHeatmap,
  SleepDurationChart,
  SleepQualityOverTimeChart,
  SleepTimelineChart,
  WeekdayWeekendChart,
} from '@/components/charts'
import { DashboardCharts } from '@/features/dashboard/DashboardCharts'
import { AverageSleepCards } from '@/features/dashboard/AverageSleepCards'
import { ConsistencyScoreCard } from '@/features/dashboard/ConsistencyScoreCard'
import { InsightsPanel } from '@/features/dashboard/InsightsPanel'
import { PatternsDetectedCard } from '@/features/dashboard/PatternsDetectedCard'
import { ScheduleTimingCards } from '@/features/dashboard/ScheduleTimingCards'
import { SleepDebtCard } from '@/features/dashboard/SleepDebtCard'
import { StatCardsGrid } from '@/features/dashboard/StatCardsGrid'
import { TodayCard } from '@/features/dashboard/TodayCard'
import { useDashboardStats } from '@/features/dashboard/useDashboardStats'
import { QuickLogActions, useSleepEntries } from '@/features/sleep-entry'

/**
 * Grafana-dense dashboard (Step 59) + empty/loading guards (Step 109).
 */
export function DashboardPage() {
  const { data: entries = [], isLoading, dataUpdatedAt } = useSleepEntries()
  const { data: stats, isLoading: statsLoading } = useDashboardStats()
  const { data: correlations, isLoading: corrLoading } = useCorrelations()
  const { data: scatters, isLoading: scatterLoading } = useScatterCorrelations()

  const hasNights = entries.length > 0
  const bootLoading = isLoading && !hasNights

  return (
    <div
      className="mx-auto flex w-full min-w-0 max-w-6xl flex-col gap-5"
      data-testid="dashboard-page"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground text-sm">
            {isLoading ? 'loading…' : `${entries.length} nights`} · updated{' '}
            {dataUpdatedAt ? new Date(dataUpdatedAt).toLocaleTimeString() : '—'}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <QuickLogActions />
          <Button
            variant="outline"
            size="sm"
            onClick={() => document.documentElement.classList.toggle('dark')}
          >
            Toggle theme
          </Button>
        </div>
      </div>

      {bootLoading ? (
        <SleepTrackerLoader
          fullScreen={false}
          size="md"
          label="Loading your sleep data…"
        />
      ) : !hasNights ? (
        <EmptyState
          title="No sleep data yet"
          description={FIRST_NIGHT_CTA}
          data-testid="dashboard-empty"
        />
      ) : (
        <>
          <div
            className="grid gap-2 sm:grid-cols-2"
            data-testid="highlight-cards"
          >
            <TodayCard />
            <SleepDebtCard />
          </div>

          <AverageSleepCards />

          <ConsistencyScoreCard />

          <ScheduleTimingCards />

          <section className="space-y-2">
            <h2 className="text-muted-foreground text-[10px] font-medium tracking-wide uppercase">
              Overview
            </h2>
            <StatCardsGrid
              stats={stats}
              isLoading={statsLoading}
              hasData={hasNights}
            />
          </section>

          <section className="min-w-0 space-y-2" data-testid="dashboard-trends">
            <h2 className="text-muted-foreground text-[10px] font-medium tracking-wide uppercase">
              Trends
            </h2>
            <DashboardCharts entries={entries} />
            <SleepDurationChart entries={entries} />
            <SleepQualityOverTimeChart entries={entries} />
            <QualityContributionHeatmap entries={entries} />
            <SleepTimelineChart entries={entries} title="Sleep timeline (14d)" />
            <BedtimeWakeConsistencyCharts entries={entries} />
            <WeekdayWeekendChart entries={entries} />
          </section>

          <section className="space-y-2">
            <h2 className="text-muted-foreground text-[10px] font-medium tracking-wide uppercase">
              Insights
            </h2>
            <InsightsPanel />
            <PatternsDetectedCard />
          </section>

          <section
            className="min-w-0 space-y-2"
            data-testid="dashboard-correlations"
          >
            <h2 className="text-muted-foreground text-[10px] font-medium tracking-wide uppercase">
              Correlations
            </h2>
            <CorrelationScatterCharts
              scatters={scatters}
              isLoading={scatterLoading}
            />
            <CorrelationCards
              correlations={correlations}
              isLoading={corrLoading}
            />
          </section>
        </>
      )}
    </div>
  )
}
