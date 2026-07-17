import * as React from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import { ChartCardShell } from '@/components/charts/ChartCardShell'
import { ResponsiveChartFrame } from '@/components/charts/ResponsiveChartFrame'
import {
  chartColors,
  chartPlotMargin,
  chartTick,
  chartTooltipStyle,
  compactChartHeight,
  defaultChartHeight,
} from '@/components/charts/chartTheme'
import {
  buildWeekdayWeekendBarRows,
  hasWeekdayWeekendComparison,
  type WeekdayWeekendBarRow,
} from '@/components/charts/weekdayWeekendComparison'
import { useCompactChart } from '@/components/charts/useCompactChart'
import type { SleepEntry } from '@/types/sleepEntry'

export type WeekdayWeekendChartProps = {
  entries: SleepEntry[]
  title?: string
  height?: number
  className?: string
  'data-testid'?: string
  rows?: WeekdayWeekendBarRow[]
}

function ComparisonTooltip({
  active,
  payload,
}: {
  active?: boolean
  payload?: Array<{ payload: WeekdayWeekendBarRow }>
}) {
  if (!active || !payload?.[0]) return null
  const row = payload[0].payload
  return (
    <div style={chartTooltipStyle} className="px-2 py-1.5">
      <div className="mb-1 font-medium">{row.metric}</div>
      <div>Weekday: {row.weekdayText}</div>
      <div>Weekend: {row.weekendText}</div>
    </div>
  )
}

/**
 * Grouped bars: avg bedtime / duration / quality — weekday vs weekend side by side.
 */
export function WeekdayWeekendChart({
  entries,
  title = 'Weekday vs weekend',
  height,
  className,
  'data-testid': testId = 'weekday-weekend-chart',
  rows: rowsProp,
}: WeekdayWeekendChartProps) {
  const compact = useCompactChart()
  const rows = rowsProp ?? buildWeekdayWeekendBarRows(entries)
  const empty =
    rowsProp != null
      ? rows.length === 0
      : !hasWeekdayWeekendComparison(entries)
  const plotHeight = height ?? (compact ? compactChartHeight : defaultChartHeight)

  const displayRows = compact
    ? rows.map((r) => ({
        ...r,
        metric: r.metric.replace('Avg ', ''),
      }))
    : rows

  return (
    <React.Fragment>
      <ChartCardShell
        title={title}
        height={plotHeight}
        empty={empty}
        emptyMessage="Need both weekday and weekend nights to compare."
        className={className}
        data-testid={testId}
      >
        <ResponsiveChartFrame>
          <BarChart
            data={displayRows}
            margin={{ ...chartPlotMargin(compact), left: 0 }}
            barGap={compact ? 2 : 4}
          >
            <CartesianGrid stroke={chartColors.grid} strokeDasharray="3 3" />
            <XAxis
              dataKey="metric"
              tick={chartTick(compact)}
              axisLine={false}
              tickLine={false}
              interval={0}
            />
            <YAxis domain={[0, 100]} hide tick={chartTick(compact)} />
            <Tooltip content={<ComparisonTooltip />} />
            <Legend
              wrapperStyle={{
                fontSize: compact ? 10 : 11,
                color: 'var(--muted-foreground)',
              }}
            />
            <Bar
              dataKey="weekday"
              name="Weekday"
              fill={chartColors.series}
              fillOpacity={0.9}
              radius={[2, 2, 0, 0]}
              isAnimationActive={false}
            />
            <Bar
              dataKey="weekend"
              name="Weekend"
              fill={chartColors.seriesStrong}
              fillOpacity={0.85}
              radius={[2, 2, 0, 0]}
              isAnimationActive={false}
            />
          </BarChart>
        </ResponsiveChartFrame>
      </ChartCardShell>
    </React.Fragment>
  )
}
