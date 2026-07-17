import { ArrowDown, ArrowRight, ArrowUp } from 'lucide-react'
import * as React from 'react'

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  formatDelta,
  formatMetricValue,
  formatMonthLabel,
  type ComparedMetric,
  type MetricTone,
  type MonthlyReportSummary,
} from '@/features/reports/reportCompare'
import { cn } from '@/lib/utils'

const TONE_META: Record<
  MetricTone,
  {
    Icon: typeof ArrowUp
    className: string
    label: string
  }
> = {
  improved: {
    Icon: ArrowUp,
    className: 'text-emerald-700 dark:text-emerald-400',
    label: 'Improved',
  },
  regressed: {
    Icon: ArrowDown,
    className: 'text-red-700 dark:text-red-400',
    label: 'Regressed',
  },
  unchanged: {
    Icon: ArrowRight,
    className: 'text-muted-foreground',
    label: 'Unchanged',
  },
  neutral: {
    Icon: ArrowRight,
    className: 'text-muted-foreground',
    label: 'No data',
  },
}

function arrowForMetric(metric: ComparedMetric) {
  if (metric.tone === 'improved') return TONE_META.improved
  if (metric.tone === 'regressed') return TONE_META.regressed
  if (metric.tone === 'unchanged') return TONE_META.unchanged
  return TONE_META.neutral
}

export type MonthStatsColumnProps = {
  title: string
  subtitle: string
  summary: MonthlyReportSummary
  /** Metrics viewed from this column's side (delta = this − other). */
  metrics: ComparedMetric[]
  /** When true, show arrows (this month column). */
  showArrows?: boolean
  className?: string
  'data-testid'?: string
}

/**
 * One month column: headline stats + optional MoM arrows (Step 103).
 */
export function MonthStatsColumn({
  title,
  subtitle,
  summary,
  metrics,
  showArrows = false,
  className,
  'data-testid': testId,
}: MonthStatsColumnProps) {
  return (
    <Card className={cn('min-w-0', className)} data-testid={testId}>
      <CardHeader className="border-b pb-3">
        <CardTitle className="text-base">{title}</CardTitle>
        <CardDescription>
          {subtitle}
          {summary.entryCount > 0
            ? ` · ${summary.entryCount} nights`
            : ' · no nights logged'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 pt-4">
        {metrics.map((metric) => {
          const value =
            metric.key === 'avgQuality'
              ? summary.avgQuality
              : metric.key === 'avgDuration'
                ? summary.avgDuration
                : metric.key === 'bestDayQuality'
                  ? summary.bestDayQuality
                  : summary.worstDayQuality
          const arrow = arrowForMetric(metric)
          const Icon = arrow.Icon

          return (
            <div
              key={metric.key}
              className="flex items-center justify-between gap-3"
              data-testid={`metric-row-${metric.key}`}
              data-tone={showArrows ? metric.tone : undefined}
              data-direction={showArrows ? metric.direction : undefined}
            >
              <div className="min-w-0">
                <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                  {metric.label}
                </p>
                <p className="text-lg font-semibold tabular-nums tracking-tight">
                  {formatMetricValue(metric.key, value)}
                </p>
              </div>
              {showArrows ? (
                <div
                  className={cn(
                    'flex shrink-0 items-center gap-1 text-sm font-medium',
                    arrow.className
                  )}
                  data-testid={`metric-arrow-${metric.key}`}
                  aria-label={`${metric.label}: ${arrow.label}`}
                >
                  <Icon className="size-4" aria-hidden />
                  <span className="tabular-nums">
                    {formatDelta(metric.key, metric.delta) || arrow.label}
                  </span>
                </div>
              ) : null}
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}

export type ReportsCompareGridProps = {
  current: MonthlyReportSummary
  previous: MonthlyReportSummary
  metrics: ComparedMetric[]
}

export function ReportsCompareGrid({
  current,
  previous,
  metrics,
}: ReportsCompareGridProps) {
  return (
    <React.Fragment>
      <div
        className="grid gap-4 md:grid-cols-2"
        data-testid="reports-compare-grid"
      >
        <MonthStatsColumn
          title="This month"
          subtitle={formatMonthLabel(current.month)}
          summary={current}
          metrics={metrics}
          showArrows
          data-testid="reports-column-current"
        />
        <MonthStatsColumn
          title="Last month"
          subtitle={formatMonthLabel(previous.month)}
          summary={previous}
          metrics={metrics}
          showArrows={false}
          data-testid="reports-column-previous"
        />
      </div>
    </React.Fragment>
  )
}
