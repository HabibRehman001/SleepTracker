import * as React from 'react'
import {
  CartesianGrid,
  ComposedChart,
  Line,
  ReferenceArea,
  ReferenceLine,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import { ChartCardShell } from '@/components/charts/ChartCardShell'
import {
  chartGridClassName,
  ResponsiveChartFrame,
} from '@/components/charts/ResponsiveChartFrame'
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
  buildBedtimeConsistencySeries,
  buildWakeConsistencySeries,
  formatClockMinutes,
  seriesToChartRows,
  type ScheduleConsistencySeries,
} from '@/components/charts/scheduleConsistency'
import { useCompactChart } from '@/components/charts/useCompactChart'
import type { SleepEntry } from '@/types/sleepEntry'

export type ScheduleConsistencyChartProps = {
  title: string
  series: ScheduleConsistencySeries | null
  valueName?: string
  height?: number
  className?: string
  'data-testid'?: string
}

function ConsistencyTooltip({
  active,
  payload,
  valueName,
}: {
  active?: boolean
  payload?: Array<{ payload: { dateKey: string; value: number; mean: number } }>
  valueName: string
}) {
  if (!active || !payload?.[0]) return null
  const row = payload[0].payload
  return (
    <div style={chartTooltipStyle} className="px-2 py-1.5">
      <div className="font-medium">{row.dateKey}</div>
      <div>
        {valueName}: {formatClockMinutes(row.value)}
      </div>
      <div className="text-muted-foreground">
        mean {formatClockMinutes(row.mean)}
      </div>
    </div>
  )
}

/**
 * Line of daily times + shaded ±1 SD band (ReferenceArea) — drift is obvious.
 */
export function ScheduleConsistencyChart({
  title,
  series,
  valueName = 'Time',
  height,
  className,
  'data-testid': testId = 'schedule-consistency-chart',
}: ScheduleConsistencyChartProps) {
  const compact = useCompactChart()
  const empty = series == null || series.points.length === 0
  const rows = series ? seriesToChartRows(series) : []
  const plotHeight = height ?? (compact ? compactChartHeight : defaultChartHeight)

  const yPad = series ? Math.max(series.sd, 30) + 20 : 60
  const yMin = series ? series.bandLow - yPad + series.sd : 0
  const yMax = series ? series.bandHigh + yPad - series.sd : 1440

  return (
    <React.Fragment>
      <ChartCardShell
        title={title}
        height={plotHeight}
        empty={empty}
        emptyMessage="Not enough schedule data yet."
        className={className}
        data-testid={testId}
      >
        {series ? (
          <ResponsiveChartFrame>
            <ComposedChart data={rows} margin={chartPlotMargin(compact)}>
              <CartesianGrid stroke={chartColors.grid} strokeDasharray="3 3" />
              <XAxis
                dataKey="label"
                tick={chartTick(compact)}
                axisLine={false}
                tickLine={false}
                interval="preserveStartEnd"
                minTickGap={compact ? 24 : 10}
                angle={compact ? -30 : 0}
                textAnchor={compact ? 'end' : 'middle'}
                height={compact ? 36 : 24}
              />
              <YAxis
                domain={[yMin, yMax]}
                tick={chartTick(compact)}
                tickFormatter={formatClockMinutes}
                axisLine={false}
                tickLine={false}
                width={chartYAxisWidth(compact, 40)}
              />
              <Tooltip
                content={<ConsistencyTooltip valueName={valueName} />}
              />
              <ReferenceArea
                y1={series.bandLow}
                y2={series.bandHigh}
                fill={chartColors.series}
                fillOpacity={0.18}
                strokeOpacity={0}
                ifOverflow="extendDomain"
              />
              <ReferenceLine
                y={series.mean}
                stroke={chartColors.series}
                strokeDasharray="4 4"
                strokeOpacity={0.7}
              />
              <Line
                type="monotone"
                dataKey="value"
                name={valueName}
                stroke={chartColors.seriesStrong}
                strokeWidth={2}
                dot={{
                  r: compact ? 2 : 2.5,
                  fill: chartColors.seriesStrong,
                }}
                connectNulls={false}
                isAnimationActive={false}
              />
            </ComposedChart>
          </ResponsiveChartFrame>
        ) : null}
      </ChartCardShell>
    </React.Fragment>
  )
}

export type BedtimeWakeConsistencyChartsProps = {
  entries: SleepEntry[]
  limit?: number
  className?: string
}

/** Pair of bedtime / wake consistency charts with ±1 SD bands. */
export function BedtimeWakeConsistencyCharts({
  entries,
  limit = 14,
  className,
}: BedtimeWakeConsistencyChartsProps) {
  const bedtime = buildBedtimeConsistencySeries(entries, limit)
  const wake = buildWakeConsistencySeries(entries, limit)

  return (
    <div
      className={className ?? chartGridClassName}
      data-testid="bedtime-wake-consistency-charts"
    >
      <ScheduleConsistencyChart
        title="Bedtime consistency (14d)"
        series={bedtime}
        valueName="Bedtime"
        data-testid="bedtime-consistency-chart"
      />
      <ScheduleConsistencyChart
        title="Wake consistency (14d)"
        series={wake}
        valueName="Wake"
        data-testid="wake-consistency-chart"
      />
    </div>
  )
}
