import * as React from 'react'
import {
  CartesianGrid,
  ComposedChart,
  Line,
  Scatter,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis,
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

export type ScatterTrend = {
  slope: number
  intercept: number
}

export type ScatterChartCardProps = {
  title: string
  data: Array<Record<string, unknown>>
  xKey: string
  yKey: string
  xName?: string
  yName?: string
  xDomain?: [number | 'auto' | 'dataMin' | 'dataMax', number | 'auto' | 'dataMin' | 'dataMax']
  yDomain?: [number | 'auto' | 'dataMin' | 'dataMax', number | 'auto' | 'dataMin' | 'dataMax']
  /** Optional OLS trend — draws a line across the x-range of `data`. */
  trend?: ScatterTrend | null
  /** Optional third dim (bubble size). */
  zKey?: string
  fill?: string
  height?: number
  emptyMessage?: string
  className?: string
  'data-testid'?: string
}

function hasXY(
  data: Array<Record<string, unknown>>,
  xKey: string,
  yKey: string
): boolean {
  return data.some((row) => {
    const x = row[xKey]
    const y = row[yKey]
    return (
      typeof x === 'number' &&
      Number.isFinite(x) &&
      typeof y === 'number' &&
      Number.isFinite(y)
    )
  })
}

function trendLinePoints(
  data: Array<Record<string, unknown>>,
  xKey: string,
  yKey: string,
  trend: ScatterTrend
): Array<Record<string, number>> {
  const xs = data
    .map((row) => row[xKey])
    .filter((v): v is number => typeof v === 'number' && Number.isFinite(v))
  if (xs.length === 0) return []
  const xMin = Math.min(...xs)
  const xMax = Math.max(...xs)
  return [
    { [xKey]: xMin, [yKey]: trend.slope * xMin + trend.intercept },
    { [xKey]: xMax, [yKey]: trend.slope * xMax + trend.intercept },
  ]
}

/**
 * Reusable scatter chart card — optional OLS trend line (Step 86).
 */
export function ScatterChartCard({
  title,
  data,
  xKey,
  yKey,
  xName,
  yName,
  xDomain,
  yDomain,
  trend = null,
  zKey,
  fill = chartColors.series,
  height,
  emptyMessage = 'No data yet.',
  className,
  'data-testid': testId = 'scatter-chart-card',
}: ScatterChartCardProps) {
  const compact = useCompactChart()
  const empty = data.length === 0 || !hasXY(data, xKey, yKey)
  const linePoints =
    trend != null ? trendLinePoints(data, xKey, yKey, trend) : []
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
          <ComposedChart margin={chartPlotMargin(compact)}>
            <CartesianGrid stroke={chartColors.grid} strokeDasharray="3 3" />
            <XAxis
              type="number"
              dataKey={xKey}
              name={xName ?? xKey}
              domain={xDomain}
              tick={chartTick(compact)}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              type="number"
              dataKey={yKey}
              name={yName ?? yKey}
              domain={yDomain}
              tick={chartTick(compact)}
              axisLine={false}
              tickLine={false}
              width={chartYAxisWidth(compact, 36)}
            />
            {zKey ? (
              <ZAxis type="number" dataKey={zKey} range={[40, 160]} />
            ) : null}
            <Tooltip
              cursor={{ strokeDasharray: '3 3' }}
              contentStyle={chartTooltipStyle}
            />
            <Scatter
              name={yName ?? yKey}
              data={data}
              fill={fill}
              fillOpacity={0.85}
              isAnimationActive={false}
            />
            {linePoints.length === 2 ? (
              <Line
                name="Trend"
                data={linePoints}
                type="linear"
                dataKey={yKey}
                stroke={chartColors.seriesStrong}
                strokeWidth={2}
                strokeOpacity={0.75}
                dot={false}
                isAnimationActive={false}
                legendType="none"
              />
            ) : null}
          </ComposedChart>
        </ResponsiveChartFrame>
      </ChartCardShell>
    </React.Fragment>
  )
}
