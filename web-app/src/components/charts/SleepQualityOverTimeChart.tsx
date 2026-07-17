import * as React from 'react'
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
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
  chartYAxisWidth,
  compactChartHeight,
  defaultChartHeight,
} from '@/components/charts/chartTheme'
import {
  buildQualityOverTimePoints,
  type QualityOverTimePoint,
} from '@/components/charts/qualityOverTime'
import { useCompactChart } from '@/components/charts/useCompactChart'
import type { SleepEntry } from '@/types/sleepEntry'

export type SleepQualityOverTimeChartProps = {
  entries: SleepEntry[]
  title?: string
  limit?: number
  height?: number
  className?: string
  'data-testid'?: string
  points?: QualityOverTimePoint[]
}

function QualityTooltip({
  active,
  payload,
}: {
  active?: boolean
  payload?: Array<{ payload: QualityOverTimePoint }>
}) {
  if (!active || !payload?.[0]) return null
  const row = payload[0].payload
  return (
    <div style={chartTooltipStyle} className="px-2 py-1.5">
      <div className="font-medium">{row.dateKey}</div>
      <div className="text-muted-foreground">
        Daily: {row.quality ?? '—'}
      </div>
      <div>7-day avg: {row.rolling7 ?? '—'}</div>
    </div>
  )
}

/**
 * Sleep quality over time: faint daily points + smoothed 7-day rolling average.
 */
export function SleepQualityOverTimeChart({
  entries,
  title = 'Sleep quality over time',
  limit = 60,
  height,
  className,
  'data-testid': testId = 'sleep-quality-over-time-chart',
  points: pointsProp,
}: SleepQualityOverTimeChartProps) {
  const compact = useCompactChart()
  const points = pointsProp ?? buildQualityOverTimePoints(entries, limit)
  const empty = !points.some(
    (p) => p.quality != null || p.rolling7 != null
  )
  const plotHeight = height ?? (compact ? compactChartHeight : defaultChartHeight)

  return (
    <React.Fragment>
      <ChartCardShell
        title={title}
        height={plotHeight}
        empty={empty}
        emptyMessage="No quality data yet."
        className={className}
        data-testid={testId}
      >
        <ResponsiveChartFrame>
          <LineChart data={points} margin={chartPlotMargin(compact)}>
            <CartesianGrid stroke={chartColors.grid} strokeDasharray="3 3" />
            <XAxis
              dataKey="label"
              tick={chartTick(compact)}
              axisLine={false}
              tickLine={false}
              interval="preserveStartEnd"
              minTickGap={compact ? 28 : 16}
              angle={compact ? -30 : 0}
              textAnchor={compact ? 'end' : 'middle'}
              height={compact ? 36 : 24}
            />
            <YAxis
              domain={[0, 10]}
              tick={chartTick(compact)}
              axisLine={false}
              tickLine={false}
              width={chartYAxisWidth(compact, 28)}
            />
            <Tooltip content={<QualityTooltip />} />
            <Legend
              wrapperStyle={{
                fontSize: compact ? 10 : 11,
                color: 'var(--muted-foreground)',
              }}
            />
            <Line
              type="monotone"
              dataKey="quality"
              name="Daily"
              stroke={chartColors.series}
              strokeWidth={1}
              strokeOpacity={0.35}
              dot={{
                r: compact ? 1.5 : 2,
                fill: chartColors.series,
                fillOpacity: 0.35,
              }}
              activeDot={{ r: 3 }}
              connectNulls={false}
              isAnimationActive={false}
            />
            <Line
              type="monotone"
              dataKey="rolling7"
              name="7-day avg"
              stroke={chartColors.seriesStrong}
              strokeWidth={2.5}
              dot={false}
              connectNulls
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveChartFrame>
      </ChartCardShell>
    </React.Fragment>
  )
}
