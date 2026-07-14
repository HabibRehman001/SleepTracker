import * as React from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import { ChartCardShell } from '@/components/charts/ChartCardShell'
import { ResponsiveChartFrame } from '@/components/charts/ResponsiveChartFrame'
import {
  chartColors,
  chartTick,
  chartTooltipStyle,
  chartYAxisWidth,
  defaultChartHeight,
} from '@/components/charts/chartTheme'
import {
  buildSleepTimelineRows,
  formatSleepDayTick,
  SLEEP_DAY_MINUTES,
  type SleepTimelineSpan,
} from '@/components/charts/sleepTimeline'
import { useCompactChart } from '@/components/charts/useCompactChart'
import type { SleepEntry } from '@/types/sleepEntry'

export type SleepTimelineChartProps = {
  entries: SleepEntry[]
  title?: string
  /** Max nights to show (most recent). */
  limit?: number
  height?: number
  className?: string
  'data-testid'?: string
  /** Injected rows for unit/SSR tests (skips entry mapping). */
  rows?: SleepTimelineSpan[]
}

const X_TICKS = [0, 360, 720, 1080, 1440]
const X_TICKS_COMPACT = [0, 720, 1440] // noon, midnight, next noon

function TimelineTooltip({
  active,
  payload,
}: {
  active?: boolean
  payload?: Array<{ payload: SleepTimelineSpan }>
}) {
  if (!active || !payload?.[0]) return null
  const row = payload[0].payload
  const bed = formatSleepDayTick(row.startOffset)
  const wake = formatSleepDayTick(row.endOffset)
  const hours = Math.round((row.sleep / 60) * 10) / 10
  return (
    <div style={chartTooltipStyle} className="px-2 py-1.5">
      <div className="font-medium">{row.dateKey}</div>
      <div className="text-muted-foreground">
        {bed} → {wake} ({hours}h)
      </div>
    </div>
  )
}

/**
 * Horizontal bedtime→waketime bars on a noon-based sleep-day axis.
 * Crossing midnight stays one continuous bar (e.g. 4 AM–12 PM → [960, 1440]).
 */
export function SleepTimelineChart({
  entries,
  title = 'Sleep timeline',
  limit = 14,
  height = defaultChartHeight,
  className,
  'data-testid': testId = 'sleep-timeline-chart',
  rows: rowsProp,
}: SleepTimelineChartProps) {
  const compact = useCompactChart()
  const rows = rowsProp ?? buildSleepTimelineRows(entries, limit)
  const empty = rows.length === 0
  const rowH = compact ? 18 : 22
  const chartHeight = Math.max(height, 36 + rows.length * rowH)

  return (
    <React.Fragment>
      <ChartCardShell
        title={title}
        height={chartHeight}
        empty={empty}
        emptyMessage="No bedtime / wake spans yet."
        className={className}
        data-testid={testId}
      >
        <ResponsiveChartFrame>
          <BarChart
            data={rows}
            layout="vertical"
            margin={{
              top: 4,
              right: compact ? 6 : 12,
              left: 0,
              bottom: 0,
            }}
            barCategoryGap="28%"
          >
            <CartesianGrid
              stroke={chartColors.grid}
              strokeDasharray="3 3"
              horizontal={false}
            />
            <XAxis
              type="number"
              domain={[0, SLEEP_DAY_MINUTES]}
              ticks={compact ? X_TICKS_COMPACT : X_TICKS}
              tickFormatter={formatSleepDayTick}
              tick={chartTick(compact)}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              type="category"
              dataKey="label"
              width={chartYAxisWidth(compact, 40)}
              tick={chartTick(compact)}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              content={<TimelineTooltip />}
              cursor={{ fill: 'var(--muted)', opacity: 0.35 }}
            />
            <Bar
              dataKey="pad"
              stackId="span"
              fill="transparent"
              isAnimationActive={false}
            />
            <Bar
              dataKey="sleep"
              stackId="span"
              fill={chartColors.seriesStrong}
              fillOpacity={0.85}
              radius={[2, 2, 2, 2]}
              isAnimationActive={false}
            />
          </BarChart>
        </ResponsiveChartFrame>
      </ChartCardShell>
    </React.Fragment>
  )
}
