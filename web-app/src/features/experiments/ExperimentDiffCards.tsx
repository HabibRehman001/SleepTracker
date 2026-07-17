import * as React from 'react'

import { StatCard } from '@/features/dashboard/StatCard'
import {
  formatDiffValue,
  formatMetricValue,
  formatPValue,
} from '@/features/experiments/experimentFormat'
import type { ExperimentComparisonMetric } from '@/features/experiments/useExperiments'
import { cn } from '@/lib/utils'

export type ExperimentDiffCardsProps = {
  metric?: ExperimentComparisonMetric
  isLoading?: boolean
  className?: string
  'data-testid'?: string
}

/**
 * Spec-style before / during / Δ row for one outcome metric.
 * Example: Before 5.2 · During 8.1 · Δ +2.9 (p < 0.05)
 */
export function ExperimentDiffCards({
  metric,
  isLoading,
  className,
  'data-testid': testId = 'experiment-diff-cards',
}: ExperimentDiffCardsProps) {
  if (isLoading) {
    return (
      <div
        className={cn('grid gap-2 sm:grid-cols-3', className)}
        data-testid={testId}
      >
        {Array.from({ length: 3 }).map((_, i) => (
          <StatCard key={i} label="…" value="—" isLoading />
        ))}
      </div>
    )
  }

  if (!metric) {
    return (
      <p
        className="text-muted-foreground text-sm"
        data-testid={testId}
      >
        Not enough nights on both sides to compare yet.
      </p>
    )
  }

  const pTrend = formatPValue(metric.pValue)
  const diffTrend = [
    metric.significant ? 'significant' : null,
    pTrend,
    `n=${metric.beforeN}→${metric.duringN}`,
  ]
    .filter(Boolean)
    .join(' · ')

  return (
    <React.Fragment>
      <div
        className={cn('space-y-2', className)}
        data-testid={testId}
      >
        <p className="text-muted-foreground text-[10px] font-medium tracking-wide uppercase">
          {metric.label}
        </p>
        <div className="grid gap-2 sm:grid-cols-3">
          <StatCard
            label="Before"
            value={formatMetricValue(metric.beforeMean, metric.unit)}
            trend={`${metric.beforeN} nights`}
            data-testid="experiment-stat-before"
          />
          <StatCard
            label="During"
            value={formatMetricValue(metric.duringMean, metric.unit)}
            trend={`${metric.duringN} nights`}
            data-testid="experiment-stat-during"
          />
          <StatCard
            label="Δ Diff"
            value={formatDiffValue(metric.diff, metric.unit)}
            trend={diffTrend || undefined}
            className={
              metric.significant
                ? 'border-emerald-500/40 bg-emerald-500/[0.06]'
                : undefined
            }
            data-testid="experiment-stat-diff"
          />
        </div>
      </div>
    </React.Fragment>
  )
}
