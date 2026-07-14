import * as React from 'react'
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
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
import { useCompactChart } from '@/components/charts/useCompactChart'

export type LineSeriesConfig = {
  dataKey: string
  name?: string
  stroke?: string
  strokeWidth?: number
  type?: 'monotone' | 'linear' | 'step'
}

export type LineChartCardProps = {
  title: string
  data: Array<Record<string, unknown>>
  xKey: string
  series: LineSeriesConfig[]
  yDomain?: [number | 'auto' | 'dataMin' | 'dataMax', number | 'auto' | 'dataMin' | 'dataMax']
  /** Vertical marker at this categorical x value (e.g. experiment start). */
  verticalMarkerX?: string | number
  verticalMarkerLabel?: string
  height?: number
  emptyMessage?: string
  className?: string
  'data-testid'?: string
}

function hasSeriesValues(
  data: Array<Record<string, unknown>>,
  series: LineSeriesConfig[]
): boolean {
  return data.some((row) =>
    series.some((s) => {
      const v = row[s.dataKey]
      return typeof v === 'number' && Number.isFinite(v)
    })
  )
}

/**
 * Reusable line chart card — axes, grid, tooltip, and strokes live here.
 * Feature files pass data + series keys only.
 */
export function LineChartCard({
  title,
  data,
  xKey,
  series,
  yDomain,
  verticalMarkerX,
  verticalMarkerLabel = 'Start',
  height,
  emptyMessage = 'No data yet.',
  className,
  'data-testid': testId = 'line-chart-card',
}: LineChartCardProps) {
  const compact = useCompactChart()
  const empty = data.length === 0 || !hasSeriesValues(data, series)
  const plotHeight = height ?? (compact ? compactChartHeight : defaultChartHeight)

  return (
    <React.Fragment>
      <ChartCardShell
        title={title}
        height={plotHeight}
        empty={empty}
        emptyMessage={emptyMessage}
        className={className}
        data-testid={testId}
      >
        <ResponsiveChartFrame>
          <LineChart data={data} margin={chartPlotMargin(compact)}>
            <CartesianGrid stroke={chartColors.grid} strokeDasharray="3 3" />
            <XAxis
              dataKey={xKey}
              tick={chartTick(compact)}
              axisLine={false}
              tickLine={false}
              interval="preserveStartEnd"
              minTickGap={compact ? 24 : 12}
              angle={compact ? -30 : 0}
              textAnchor={compact ? 'end' : 'middle'}
              height={compact ? 36 : 24}
            />
            <YAxis
              domain={yDomain}
              tick={chartTick(compact)}
              axisLine={false}
              tickLine={false}
              width={chartYAxisWidth(compact, 32)}
            />
            <Tooltip contentStyle={chartTooltipStyle} />
            {verticalMarkerX != null ? (
              <ReferenceLine
                x={verticalMarkerX}
                stroke={chartColors.seriesStrong}
                strokeDasharray="4 4"
                label={{
                  value: verticalMarkerLabel,
                  position: 'insideTopRight',
                  fill: chartColors.tick,
                  fontSize: 10,
                }}
              />
            ) : null}
            {series.map((s, i) => (
              <Line
                key={s.dataKey}
                type={s.type ?? 'monotone'}
                dataKey={s.dataKey}
                name={s.name ?? s.dataKey}
                stroke={
                  s.stroke ??
                  (i === 0 ? chartColors.seriesStrong : chartColors.series)
                }
                strokeWidth={s.strokeWidth ?? 2}
                dot={false}
                connectNulls={false}
              />
            ))}
          </LineChart>
        </ResponsiveChartFrame>
      </ChartCardShell>
    </React.Fragment>
  )
}
