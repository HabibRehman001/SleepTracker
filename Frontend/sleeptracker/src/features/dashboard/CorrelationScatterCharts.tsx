import * as React from 'react'

import { chartGridClassName } from '@/components/charts/ResponsiveChartFrame'
import { ScatterChartCard } from '@/components/charts/ScatterChartCard'
import type { ScatterCorrelation } from '@/features/analytics/useAnalytics'

export type CorrelationScatterChartsProps = {
  scatters?: ScatterCorrelation[]
  isLoading?: boolean
  className?: string
}

/**
 * Phone-minutes × latency and caffeine × quality scatters with OLS trend lines.
 */
export function CorrelationScatterCharts({
  scatters,
  isLoading,
  className,
}: CorrelationScatterChartsProps) {
  if (isLoading) {
    return (
      <div
        className={className ?? 'grid gap-3 lg:grid-cols-2'}
        data-testid="correlation-scatter-charts"
      >
        {Array.from({ length: 2 }).map((_, i) => (
          <div
            key={i}
            className="h-52 animate-pulse rounded-md border border-border/80 bg-card/40"
          />
        ))}
      </div>
    )
  }

  if (!scatters?.length) {
    return (
      <p
        className="text-muted-foreground text-sm"
        data-testid="correlation-scatter-charts"
      >
        No scatter correlation data yet.
      </p>
    )
  }

  return (
    <React.Fragment>
      <div
        className={className ?? chartGridClassName}
        data-testid="correlation-scatter-charts"
      >
        {scatters.map((s) => (
          <ScatterChartCard
            key={s.key}
            title={s.label}
            data={s.points}
            xKey="x"
            yKey="y"
            xName={s.xLabel}
            yName={s.yLabel}
            trend={s.regression}
            emptyMessage={`Not enough ${s.xLabel.toLowerCase()} data yet.`}
            data-testid={`scatter-${s.key}`}
          />
        ))}
      </div>
    </React.Fragment>
  )
}
