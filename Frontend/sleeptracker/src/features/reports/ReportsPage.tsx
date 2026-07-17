import * as React from 'react'

import { EmptyState, FIRST_NIGHT_CTA } from '@/components/ui/EmptyState'
import { SleepTrackerLoader } from '@/components/ui/Loader'
import { ExportPanel } from '@/features/reports/ExportPanel'
import { ReportsCompareGrid } from '@/features/reports/MonthStatsColumn'
import { compareMonthlySummaries } from '@/features/reports/reportCompare'
import { useMonthCompare } from '@/features/reports/useReports'

/**
 * Step 103–109 — Reports: MoM compare + export + empty/loading.
 */
export function ReportsPage() {
  const { data, isLoading, isError } = useMonthCompare()

  const metrics = React.useMemo(() => {
    if (!data) return []
    if (data.metrics?.length) return data.metrics
    return compareMonthlySummaries(data.current, data.previous)
  }, [data])

  const bothEmpty =
    data != null &&
    data.current.entryCount === 0 &&
    data.previous.entryCount === 0

  return (
    <div
      className="mx-auto flex w-full min-w-0 max-w-4xl flex-col gap-5"
      data-testid="reports-page"
    >
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Reports</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          This month vs last — green arrows mean you improved.
        </p>
      </div>

      <ExportPanel defaultMonth={data?.currentMonth} />

      {isLoading ? (
        <SleepTrackerLoader
          fullScreen={false}
          size="sm"
          label="Loading monthly report…"
        />
      ) : isError || !data ? (
        <p className="text-muted-foreground text-sm" data-testid="reports-error">
          Could not load monthly comparison.
        </p>
      ) : bothEmpty ? (
        <EmptyState
          title="Nothing to compare yet"
          description={FIRST_NIGHT_CTA}
          data-testid="reports-empty"
        />
      ) : (
        <>
          <ReportsCompareGrid
            current={data.current}
            previous={data.previous}
            metrics={metrics}
          />

          {data.current.insights.length > 0 ? (
            <section className="space-y-2" data-testid="reports-insights">
              <h2 className="text-muted-foreground text-[10px] font-medium tracking-wide uppercase">
                This month&apos;s insights
              </h2>
              <ul className="text-muted-foreground list-inside list-disc space-y-1 text-sm">
                {data.current.insights.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
            </section>
          ) : null}
        </>
      )}
    </div>
  )
}
