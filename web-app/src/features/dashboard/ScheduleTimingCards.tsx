import * as React from 'react'

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { useDashboardStats } from '@/features/dashboard/useDashboardStats'
import { cn } from '@/lib/utils'

const MINUTES_PER_DAY = 24 * 60

/**
 * Format minutes-since-midnight as a 12-hour clock ("4:12 AM").
 * Never show raw minute totals.
 */
export function formatMinutesAsClock(minutes: number): string {
  const normalized =
    ((Math.round(minutes) % MINUTES_PER_DAY) + MINUTES_PER_DAY) % MINUTES_PER_DAY
  const hours24 = Math.floor(normalized / 60)
  const mins = normalized % 60
  const period = hours24 >= 12 ? 'PM' : 'AM'
  const hours12 = hours24 % 12 === 0 ? 12 : hours24 % 12
  return `${hours12}:${String(mins).padStart(2, '0')} ${period}`
}

/**
 * Accept API `HH:mm` / `H:mm` strings or minute-of-day numbers → "4:12 AM".
 */
export function formatClockTime(
  value: string | number | null | undefined
): string {
  if (value == null || value === '') return '—'

  if (typeof value === 'number') {
    if (!Number.isFinite(value)) return '—'
    return formatMinutesAsClock(value)
  }

  const trimmed = value.trim()
  // Already a friendly clock with AM/PM
  if (/\b(AM|PM)\b/i.test(trimmed)) return trimmed

  const match = /^(\d{1,2}):(\d{2})(?::\d{2})?$/.exec(trimmed)
  if (!match) return '—'

  const hours = Number(match[1])
  const mins = Number(match[2])
  if (hours > 23 || mins > 59) return '—'
  return formatMinutesAsClock(hours * 60 + mins)
}

/**
 * Latency is a duration (attempt → sleep), not a wall clock.
 * Show compact clock-style duration ("45m", "1h 05m") — never a bare minute count alone.
 */
export function formatLatencyDisplay(minutes: number | null | undefined): string {
  if (minutes == null || !Number.isFinite(minutes)) return '—'
  const safe = Math.max(0, Math.round(minutes))
  const h = Math.floor(safe / 60)
  const m = safe % 60
  if (h === 0) return `${m}m`
  return `${h}h ${String(m).padStart(2, '0')}m`
}

export type ScheduleMetric = 'bedtime' | 'wake' | 'latency'

export type ScheduleTimingCardProps = {
  metric: ScheduleMetric
  /** Bed/wake: HH:mm or minutes; latency: minutes duration. */
  value: string | number | null
  isFetching?: boolean
  className?: string
}

const METRIC_META: Record<
  ScheduleMetric,
  { title: string; hint: string; testId: string }
> = {
  bedtime: {
    title: 'Avg Bedtime',
    hint: 'circular mean bedtime',
    testId: 'avg-bedtime-card',
  },
  wake: {
    title: 'Avg Wake',
    hint: 'circular mean wake time',
    testId: 'avg-wake-card',
  },
  latency: {
    title: 'Avg Latency',
    hint: 'attempt → estimated sleep',
    testId: 'avg-latency-card',
  },
}

export function formatScheduleMetric(
  metric: ScheduleMetric,
  value: string | number | null | undefined
): string {
  if (metric === 'latency') {
    return formatLatencyDisplay(
      typeof value === 'number' ? value : value == null ? null : Number(value)
    )
  }
  return formatClockTime(value)
}

/** Presentational bed / wake / latency card (Step 66). */
export function ScheduleTimingCardView({
  metric,
  value,
  isFetching,
  className,
}: ScheduleTimingCardProps) {
  const meta = METRIC_META[metric]
  const display = formatScheduleMetric(metric, value)

  return (
    <React.Fragment>
      <Card
        data-testid={meta.testId}
        size="sm"
        className={cn(className)}
      >
        <CardHeader className="border-b">
          <CardTitle>{meta.title}</CardTitle>
          <CardDescription>
            {meta.hint}
            {isFetching ? ' · refreshing…' : null}
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-(--card-spacing)">
          <p
            className="font-mono text-2xl font-semibold tabular-nums tracking-tight"
            data-testid={`${meta.testId}-value`}
          >
            {display}
          </p>
        </CardContent>
      </Card>
    </React.Fragment>
  )
}

/** Trio of average bedtime / wake / latency cards. */
export function ScheduleTimingCards() {
  const { data: stats, isFetching } = useDashboardStats()

  return (
    <div
      className="grid gap-2 sm:grid-cols-3"
      data-testid="schedule-timing-cards"
    >
      <ScheduleTimingCardView
        metric="bedtime"
        value={stats?.avgBedtime ?? null}
        isFetching={isFetching}
      />
      <ScheduleTimingCardView
        metric="wake"
        value={stats?.avgWakeTime ?? null}
        isFetching={isFetching}
      />
      <ScheduleTimingCardView
        metric="latency"
        value={stats?.avgLatency ?? null}
        isFetching={isFetching}
      />
    </div>
  )
}
