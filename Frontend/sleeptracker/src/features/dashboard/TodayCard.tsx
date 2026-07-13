import * as React from 'react'
import { format, parseISO } from 'date-fns'

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

export type TodaySleepBadgeTone = 'green' | 'yellow' | 'red'

/**
 * Badge rules (Step 62):
 * - green: hours ≥ 7 AND quality ≥ 7
 * - red: hours < 7 AND quality < 7
 * - yellow: between (exactly one threshold met)
 */
export function todaySleepBadgeTone(
  hours: number,
  quality: number
): TodaySleepBadgeTone {
  if (hours >= 7 && quality >= 7) return 'green'
  if (hours < 7 && quality < 7) return 'red'
  return 'yellow'
}

const BADGE_STYLES: Record<
  TodaySleepBadgeTone,
  { label: string; className: string }
> = {
  green: {
    label: 'Good',
    className:
      'border-emerald-500/40 bg-emerald-500/15 text-emerald-800 dark:text-emerald-300',
  },
  yellow: {
    label: 'Fair',
    className:
      'border-amber-500/40 bg-amber-500/15 text-amber-900 dark:text-amber-300',
  },
  red: {
    label: 'Poor',
    className:
      'border-red-500/40 bg-red-500/15 text-red-800 dark:text-red-300',
  },
}

function formatHours(hours: number): string {
  const h = Math.floor(hours)
  const m = Math.round((hours - h) * 60)
  if (m === 0) return `${h}h`
  return `${h}h ${m}m`
}

function entryDateKey(entry: SleepEntry): string {
  if (
    entry.date.endsWith('T00:00:00.000Z') ||
    /^\d{4}-\d{2}-\d{2}T00:00/.test(entry.date)
  ) {
    return entry.date.slice(0, 10)
  }
  return format(parseISO(entry.date), 'yyyy-MM-dd')
}

export type TodaysSleepCardProps = {
  /** Last night duration in hours (null = unknown). */
  hours: number | null
  /** Sleep quality 1–10 (null = unknown). */
  quality: number | null
  dateLabel?: string
  bedTime?: string | null
  wakeTime?: string | null
  notes?: string | null
  isFetching?: boolean
  empty?: boolean
  className?: string
}

/**
 * Presentational "Today's Sleep" card — duration + quality + colored badge.
 * Threshold logic lives in {@link todaySleepBadgeTone}; no fetching here.
 */
export function TodaysSleepCard({
  hours,
  quality,
  dateLabel,
  bedTime,
  wakeTime,
  notes,
  isFetching,
  empty,
  className,
}: TodaysSleepCardProps) {
  const tone =
    hours != null && quality != null
      ? todaySleepBadgeTone(hours, quality)
      : null
  const badge = tone ? BADGE_STYLES[tone] : null

  return (
    <React.Fragment>
      <Card
        data-testid="today-card"
        size="sm"
        className={cn(className)}
      >
        <CardHeader className="border-b">
          <div className="flex items-start justify-between gap-2">
            <div>
              <CardTitle>Today&apos;s Sleep</CardTitle>
              <CardDescription>
                {dateLabel ?? 'Last night'}
                {isFetching ? ' · refreshing…' : null}
              </CardDescription>
            </div>
            {badge && tone ? (
              <span
                data-testid="today-sleep-badge"
                data-tone={tone}
                className={cn(
                  'inline-flex shrink-0 items-center rounded-md border px-2 py-0.5 text-[10px] font-semibold tracking-wide uppercase',
                  badge.className
                )}
              >
                {badge.label}
              </span>
            ) : null}
          </div>
        </CardHeader>
        <CardContent className="grid gap-2 pt-(--card-spacing)">
          {empty ? (
            <p
              className="text-muted-foreground text-sm"
              data-testid="today-empty"
            >
              No entry for today yet — log sleep to fill this card.
            </p>
          ) : (
            <>
              <p
                className="text-2xl font-semibold tabular-nums tracking-tight"
                data-testid="today-duration"
              >
                {hours != null ? formatHours(hours) : '—'}
              </p>
              <p className="text-muted-foreground text-sm">
                Quality{' '}
                <span
                  className="text-foreground font-medium"
                  data-testid="today-quality"
                >
                  {quality ?? '—'}
                </span>
                {bedTime || wakeTime ? (
                  <>
                    {' '}
                    · bed{' '}
                    <span data-testid="today-bed">{bedTime ?? '—'}</span>
                    {' → '}
                    <span data-testid="today-wake">{wakeTime ?? '—'}</span>
                  </>
                ) : null}
                {notes ? (
                  <>
                    {' '}
                    · <span data-testid="today-notes">{notes}</span>
                  </>
                ) : null}
              </p>
            </>
          )}
        </CardContent>
      </Card>
    </React.Fragment>
  )
}

function formatClock(iso: string | null | undefined): string | null {
  if (!iso) return null
  return new Date(iso).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  })
}

/** Dashboard container — feeds last night into {@link TodaysSleepCard}. */
export function TodayCard() {
  const today = format(new Date(), 'yyyy-MM-dd')
  const { data: entries = [], isFetching } = useSleepEntries()
  const { data: stats } = useDashboardStats()

  const todayEntry = entries.find((entry) => entryDateKey(entry) === today)

  if (!todayEntry) {
    return (
      <TodaysSleepCard
        hours={null}
        quality={null}
        dateLabel={today}
        isFetching={isFetching}
        empty
      />
    )
  }

  return (
    <TodaysSleepCard
      hours={stats?.todaySleep ?? null}
      quality={todayEntry.sleepQuality}
      dateLabel={today}
      bedTime={formatClock(todayEntry.bedTime)}
      wakeTime={formatClock(todayEntry.wakeTime)}
      notes={todayEntry.notes}
      isFetching={isFetching}
    />
  )
}
