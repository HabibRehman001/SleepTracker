import * as React from 'react'

import {
  buildContributionGrid,
  contributionGridWidth,
  type HeatmapDay,
} from '@/components/charts/contributionGrid'
import { ChartCardShell } from '@/components/charts/ChartCardShell'
import { heatColor } from '@/components/charts/chartTheme'
import { cn } from '@/lib/utils'

export type { HeatmapDay }

export type HeatmapCalendarProps = {
  title: string
  /** Sparse day values; missing dates render as empty cells. */
  days: HeatmapDay[]
  /** Inclusive range start (YYYY-MM-DD or Date). Defaults to earliest day / 12 weeks ago. */
  startDate?: string | Date
  endDate?: string | Date
  /** Value that maps to the darkest heat cell (default 10 for sleep quality). */
  maxValue?: number
  emptyMessage?: string
  className?: string
  'data-testid'?: string
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const

const CELL = 11
const GAP = 3
const LABEL_W = 28
const MONTH_H = 14

/**
 * GitHub-style contribution calendar — columns = weeks, rows = days.
 * Color intensity from {@link heatColor} (sleep quality by default).
 * Wide year grids scroll horizontally; they do not expand page layout.
 */
export function HeatmapCalendar({
  title,
  days,
  startDate,
  endDate,
  maxValue = 10,
  emptyMessage = 'No data yet.',
  className,
  'data-testid': testId = 'heatmap-calendar',
}: HeatmapCalendarProps) {
  const grid = React.useMemo(
    () => buildContributionGrid(days, startDate, endDate),
    [days, startDate, endDate]
  )

  const hasAnyValue = days.some(
    (d) => d.value != null && Number.isFinite(d.value)
  )

  const width = contributionGridWidth(grid.weekCount, CELL, GAP, LABEL_W)
  const height = MONTH_H + 7 * (CELL + GAP)

  return (
    <React.Fragment>
      <ChartCardShell
        title={title}
        height="auto"
        empty={!hasAnyValue}
        emptyMessage={emptyMessage}
        className={className}
        data-testid={testId}
      >
        <div
          className="w-full min-w-0 max-w-full overflow-x-auto overflow-y-hidden overscroll-x-contain [-webkit-overflow-scrolling:touch]"
          data-testid="heatmap-scroll"
          data-week-count={grid.weekCount}
        >
          <svg
            width={width}
            height={height}
            role="img"
            aria-label={title}
            className="block max-w-none"
            data-testid="heatmap-svg"
            data-week-count={grid.weekCount}
          >
            {grid.monthLabels.map((m) => (
              <text
                key={`${m.label}-${m.weekIndex}`}
                x={LABEL_W + m.weekIndex * (CELL + GAP)}
                y={10}
                className="fill-muted-foreground"
                style={{ fontSize: 9 }}
              >
                {m.label}
              </text>
            ))}
            {WEEKDAYS.map((label, dayIndex) =>
              dayIndex % 2 === 1 ? (
                <text
                  key={label}
                  x={0}
                  y={MONTH_H + dayIndex * (CELL + GAP) + CELL - 2}
                  className="fill-muted-foreground"
                  style={{ fontSize: 9 }}
                >
                  {label}
                </text>
              ) : null
            )}
            {grid.cells.map((cell) => {
              const x = LABEL_W + cell.weekIndex * (CELL + GAP)
              const y = MONTH_H + cell.dayIndex * (CELL + GAP)
              const filled =
                cell.inRange && cell.value != null && Number.isFinite(cell.value)
              return (
                <rect
                  key={cell.key}
                  x={x}
                  y={y}
                  width={CELL}
                  height={CELL}
                  rx={2}
                  ry={2}
                  fill={
                    filled
                      ? heatColor(cell.value, maxValue)
                      : 'var(--muted)'
                  }
                  opacity={cell.inRange ? 1 : 0.25}
                  className={cn(!filled && cell.inRange && 'opacity-45')}
                >
                  <title>
                    {`${cell.key}${filled ? `: quality ${cell.value}` : ''}`}
                  </title>
                </rect>
              )
            })}
          </svg>
        </div>
        <div
          className="text-muted-foreground mt-2 flex items-center gap-1.5 text-[10px]"
          data-testid="heatmap-legend"
        >
          <span>Less</span>
          {[0, 2, 4, 6, 8, 10].map((v) => (
            <span
              key={v}
              className="inline-block size-2.5 rounded-[2px]"
              style={{
                background: v === 0 ? 'var(--muted)' : heatColor(v, maxValue),
              }}
              title={`quality ${v}`}
            />
          ))}
          <span>More</span>
        </div>
      </ChartCardShell>
    </React.Fragment>
  )
}
