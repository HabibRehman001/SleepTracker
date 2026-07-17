import * as React from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
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
import {
  buildSleepDurationBars,
  durationToneFill,
  SLEEP_DURATION_TARGET_HOURS,
  type SleepDurationBar,
} from '@/components/charts/sleepDuration'
import { useCompactChart } from '@/components/charts/useCompactChart'
import type { SleepEntry } from '@/types/sleepEntry'

export type SleepDurationChartProps = {
  entries: SleepEntry[]
  title?: string
  limit?: number
  height?: number
  className?: string
  'data-testid'?: string
  /** Injected rows for tests. */
  bars?: SleepDurationBar[]
}

function DurationTooltip({
  active,
  payload,
}: {
  active?: boolean
  payload?: Array<{ payload: SleepDurationBar }>
}) {
  if (!active || !payload?.[0]) return null
  const row = payload[0].payload
  return (
    <div style={chartTooltipStyle} className="px-2 py-1.5">
      <div className="font-medium">{row.dateKey}</div>
      <div>
        {row.hours}h{' '}
        <span className="text-muted-foreground">
          ({row.tone} vs {SLEEP_DURATION_TARGET_HOURS}h)
        </span>
      </div>
    </div>
  )
}

/**
 * 30-day sleep duration bars — green / yellow / red vs the 8h target.
 */
export function SleepDurationChart({
  entries,
  title = 'Sleep duration (30d)',
  limit = 30,
  height,
  className,
  'data-testid': testId = 'sleep-duration-chart',
  bars: barsProp,
}: SleepDurationChartProps) {
  const compact = useCompactChart()
  const bars = barsProp ?? buildSleepDurationBars(entries, limit)
  const empty = bars.length === 0
  const plotHeight = height ?? (compact ? compactChartHeight : defaultChartHeight)

  return (
    <React.Fragment>
      <ChartCardShell
        title={title}
        height={plotHeight}
        empty={empty}
        emptyMessage="No duration data yet."
        className={className}
        data-testid={testId}
      >
        <ResponsiveChartFrame>
          <BarChart
            data={bars}
            margin={chartPlotMargin(compact)}
            barCategoryGap={compact ? '12%' : '18%'}
          >
            <CartesianGrid stroke={chartColors.grid} strokeDasharray="3 3" />
            <XAxis
              dataKey="label"
              tick={chartTick(compact)}
              axisLine={false}
              tickLine={false}
              interval="preserveStartEnd"
              minTickGap={compact ? 28 : 12}
              angle={compact ? -35 : 0}
              textAnchor={compact ? 'end' : 'middle'}
              height={compact ? 40 : 24}
            />
            <YAxis
              domain={[0, 12]}
              tick={chartTick(compact)}
              axisLine={false}
              tickLine={false}
              width={chartYAxisWidth(compact, 28)}
              unit="h"
            />
            <Tooltip content={<DurationTooltip />} />
            <ReferenceLine
              y={SLEEP_DURATION_TARGET_HOURS}
              stroke={chartColors.series}
              strokeDasharray="4 4"
              strokeOpacity={0.75}
              label={
                compact
                  ? undefined
                  : {
                      value: '8h',
                      position: 'insideTopRight',
                      fill: chartColors.tick,
                      fontSize: 10,
                    }
              }
            />
            <Bar
              dataKey="hours"
              name="Hours"
              radius={[2, 2, 0, 0]}
              isAnimationActive={false}
            >
              {bars.map((row) => (
                <Cell
                  key={row.dateKey}
                  fill={durationToneFill[row.tone]}
                  fillOpacity={0.9}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveChartFrame>
      </ChartCardShell>
    </React.Fragment>
  )
}
