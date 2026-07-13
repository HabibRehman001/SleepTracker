import * as React from 'react'
import { differenceInMinutes } from 'date-fns'
import { ArrowDown, ArrowRight, ArrowUp } from 'lucide-react'

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

/** Same 8h target as Backend `sleepDebt` (Step 36). */
export const SLEEP_DEBT_TARGET_MINUTES = 480

export type SleepDebtTrend = 'up' | 'down' | 'flat'

/** Always `Xh Ym` (e.g. `3h 40m`, `0h 0m`). */
export function formatSleepDebt(minutes: number): string {
  const safe = Math.max(0, Math.round(minutes))
  const h = Math.floor(safe / 60)
  const m = safe % 60
  return `${h}h ${m}m`
}

/** Compact signed delta for the trend line (`+20m`, `−1h 10m`). */
export function formatDebtDelta(minutes: number): string {
  if (minutes === 0) return '0m'
  const sign = minutes > 0 ? '+' : '−'
  const abs = Math.abs(Math.round(minutes))
  if (abs < 60) return `${sign}${abs}m`
  return `${sign}${formatSleepDebt(abs)}`
}

/**
 * Compare current 7-day debt to the prior 7-day window.
 * up = more debt (worse), down = less debt (better).
 */
export function sleepDebtTrendDirection(
  currentMinutes: number,
  previousMinutes: number
): SleepDebtTrend {
  const delta = currentMinutes - previousMinutes
  if (delta > 0) return 'up'
  if (delta < 0) return 'down'
  return 'flat'
}

function durationMinutes(
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
  return minutes
}

/** Rolling deficit minutes for a fixed window (mirrors backend `sleepDebt`). */
export function computeSleepDebtMinutes(
  entries: Array<
    Pick<
      SleepEntry,
      'estimatedSleepTime' | 'attemptSleepTime' | 'bedTime' | 'wakeTime'
    >
  >
): number {
  return entries.reduce((debt, entry) => {
    const duration = durationMinutes(entry) ?? SLEEP_DEBT_TARGET_MINUTES
    return debt + Math.max(0, SLEEP_DEBT_TARGET_MINUTES - duration)
  }, 0)
}

const TREND_META: Record<
  SleepDebtTrend,
  {
    Icon: typeof ArrowUp
    label: string
    className: string
  }
> = {
  up: {
    Icon: ArrowUp,
    label: 'Worse',
    className: 'text-red-700 dark:text-red-400',
  },
  down: {
    Icon: ArrowDown,
    label: 'Better',
    className: 'text-emerald-700 dark:text-emerald-400',
  },
  flat: {
    Icon: ArrowRight,
    label: 'Steady',
    className: 'text-muted-foreground',
  },
}

export type SleepDebtCardProps = {
  /** Debt minutes over the last 7 nights. */
  debtMinutes: number
  /** Direction vs prior 7-day window. */
  trend?: SleepDebtTrend
  /** Signed minutes: current − previous (positive = more debt). */
  deltaMinutes?: number | null
  isFetching?: boolean
  className?: string
}

/**
 * Presentational Sleep Debt card (Step 63): `Xh Ym` + small 7-day trend arrow.
 */
export function SleepDebtCardView({
  debtMinutes,
  trend = 'flat',
  deltaMinutes = null,
  isFetching,
  className,
}: SleepDebtCardProps) {
  const meta = TREND_META[trend]
  const { Icon } = meta
  const deltaLabel =
    deltaMinutes == null
      ? '7-day window'
      : `${formatDebtDelta(deltaMinutes)} vs prior 7d`

  return (
    <React.Fragment>
      <Card
        data-testid="sleep-debt-card"
        size="sm"
        className={cn(className)}
      >
        <CardHeader className="border-b">
          <CardTitle>Sleep Debt</CardTitle>
          <CardDescription>
            vs 8h target
            {isFetching ? ' · refreshing…' : null}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex items-end justify-between gap-2 pt-(--card-spacing)">
          <p
            className="text-2xl font-semibold tabular-nums tracking-tight"
            data-testid="sleep-debt-value"
          >
            {formatSleepDebt(debtMinutes)}
          </p>
          <div
            className={cn(
              'flex items-center gap-1 text-[10px] font-medium tabular-nums',
              meta.className
            )}
            data-testid="sleep-debt-trend"
            data-trend={trend}
            title={`${meta.label} · ${deltaLabel}`}
          >
            <Icon
              className="size-3.5 shrink-0"
              aria-hidden
              data-testid="sleep-debt-trend-arrow"
            />
            <span data-testid="sleep-debt-trend-label">{deltaLabel}</span>
          </div>
        </CardContent>
      </Card>
    </React.Fragment>
  )
}

/** Dashboard container — stats debt + entry-based 7-day trend. */
export function SleepDebtCard() {
  const { data: stats, isFetching: statsFetching } = useDashboardStats()
  const { data: entries = [], isFetching: entriesFetching } = useSleepEntries()

  const sorted = [...entries].sort((a, b) => a.date.localeCompare(b.date))
  const currentWindow = sorted.slice(-7)
  const previousWindow = sorted.length >= 14 ? sorted.slice(-14, -7) : null

  const computedCurrent = computeSleepDebtMinutes(currentWindow)
  const debtMinutes = stats?.sleepDebt ?? computedCurrent
  const previousMinutes =
    previousWindow == null ? null : computeSleepDebtMinutes(previousWindow)
  const trend =
    previousMinutes == null
      ? 'flat'
      : sleepDebtTrendDirection(debtMinutes, previousMinutes)
  const deltaMinutes =
    previousMinutes == null ? null : debtMinutes - previousMinutes

  return (
    <SleepDebtCardView
      debtMinutes={debtMinutes}
      trend={trend}
      deltaMinutes={deltaMinutes}
      isFetching={statsFetching || entriesFetching}
    />
  )
}
