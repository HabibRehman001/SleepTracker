import * as React from 'react'
import { differenceInMinutes } from 'date-fns'

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { useDashboardStats } from '@/features/dashboard/useDashboardStats'
import { useSleepEntries } from '@/features/sleep-entry'
import { cn } from '@/lib/utils'
import type { SleepEntry } from '@/types/sleepEntry'

/** Match Backend `round(value, 2)` used by `computeSummary`. */
export function roundHours(value: number, digits = 2): number {
  const factor = 10 ** digits
  return Math.round(value * factor) / factor
}

/** Display form used on cards — always two decimal places (`7.36h`). */
export function formatAverageHours(hours: number | null | undefined): string {
  if (hours == null) return '—'
  return `${roundHours(hours).toFixed(2)}h`
}

export function sleepDurationHours(
  entry: Pick<
    SleepEntry,
    'estimatedSleepTime' | 'attemptSleepTime' | 'bedTime' | 'wakeTime'
  >
): number | null {
  const start =
    entry.estimatedSleepTime ?? entry.attemptSleepTime ?? entry.bedTime
  if (!start || !entry.wakeTime) return null
  const minutes = differenceInMinutes(new Date(entry.wakeTime), new Date(start))
  if (minutes <= 0) return null
  return minutes / 60
}

/**
 * Average of the last `windowSize` entries that have a known duration.
 * Mirrors Backend `computeSummary` avg7day / avg30day.
 */
export function averageSleepHours(
  entries: Array<
    Pick<
      SleepEntry,
      | 'date'
      | 'estimatedSleepTime'
      | 'attemptSleepTime'
      | 'bedTime'
      | 'wakeTime'
    >
  >,
  windowSize: number
): number | null {
  const sorted = [...entries].sort((a, b) => a.date.localeCompare(b.date))
  const withDuration = sorted
    .map((entry) => sleepDurationHours(entry))
    .filter((hours): hours is number => hours !== null)
  const window = withDuration.slice(-windowSize)
  if (window.length === 0) return null
  const sum = window.reduce((acc, h) => acc + h, 0)
  return roundHours(sum / window.length)
}

/**
 * Spreadsheet-style mean: average known hour values, round to 2 decimals.
 * Used by Step 64 test to confirm the card matches a manual average.
 */
export function spreadsheetAverage(hours: number[]): number {
  if (hours.length === 0) return 0
  return roundHours(hours.reduce((sum, h) => sum + h, 0) / hours.length)
}

export type AverageWindow = 7 | 30

export type AverageSleepCardProps = {
  window: AverageWindow
  hours: number | null
  /** Optional comparison line (e.g. 7d vs 30d). */
  trend?: string
  isFetching?: boolean
  className?: string
}

/** Presentational 7-day or 30-day average card (Step 64). */
export function AverageSleepCardView({
  window,
  hours,
  trend,
  isFetching,
  className,
}: AverageSleepCardProps) {
  const title = window === 7 ? '7-day Avg' : '30-day Avg'
  const testId = window === 7 ? 'avg-7-day-card' : 'avg-30-day-card'

  return (
    <React.Fragment>
      <Card data-testid={testId} size="sm" className={cn(className)}>
        <CardHeader className="border-b">
          <CardTitle>{title}</CardTitle>
          <CardDescription>
            mean sleep duration
            {isFetching ? ' · refreshing…' : null}
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-1 pt-(--card-spacing)">
          <p
            className="font-mono text-2xl font-semibold tabular-nums tracking-tight"
            data-testid={`${testId}-value`}
          >
            {formatAverageHours(hours)}
          </p>
          {trend ? (
            <p
              className="text-muted-foreground text-[10px] tabular-nums"
              data-testid={`${testId}-trend`}
            >
              {trend}
            </p>
          ) : null}
        </CardContent>
      </Card>
    </React.Fragment>
  )
}

/** Pair of average cards fed by `useDashboardStats` (with entry fallback). */
export function AverageSleepCards() {
  const { data: stats, isFetching: statsFetching } = useDashboardStats()
  const { data: entries = [], isFetching: entriesFetching } = useSleepEntries()
  const isFetching = statsFetching || entriesFetching

  const avg7 = stats?.avg7day ?? averageSleepHours(entries, 7)
  const avg30 = stats?.avg30day ?? averageSleepHours(entries, 30)

  const trend30 =
    avg7 != null && avg30 != null
      ? `${avg7 >= avg30 ? '+' : ''}${(avg7 - avg30).toFixed(2)}h vs 30d`
      : undefined

  return (
    <div
      className="grid gap-2 sm:grid-cols-2"
      data-testid="average-sleep-cards"
    >
      <AverageSleepCardView
        window={7}
        hours={avg7}
        isFetching={isFetching}
        trend="last 7 nights with duration"
      />
      <AverageSleepCardView
        window={30}
        hours={avg30}
        isFetching={isFetching}
        trend={trend30}
      />
    </div>
  )
}
