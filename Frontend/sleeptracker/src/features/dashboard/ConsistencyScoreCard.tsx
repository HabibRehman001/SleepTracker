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

export type ConsistencyBand = 'high' | 'moderate' | 'low'

/** Clamp and round score into the 0–100 display range. */
export function clampConsistencyScore(score: number): number {
  if (!Number.isFinite(score)) return 0
  return Math.min(100, Math.max(0, Math.round(score)))
}

export function consistencyBand(score: number): ConsistencyBand {
  const s = clampConsistencyScore(score)
  if (s >= 80) return 'high'
  if (s >= 50) return 'moderate'
  return 'low'
}

export function consistencyLabel(score: number): string {
  switch (consistencyBand(score)) {
    case 'high':
      return 'Stable schedule'
    case 'moderate':
      return 'Moderate variation'
    case 'low':
      return 'High variation'
  }
}

const BAND_STROKE: Record<ConsistencyBand, string> = {
  high: 'stroke-emerald-600 dark:stroke-emerald-400',
  moderate: 'stroke-amber-600 dark:stroke-amber-400',
  low: 'stroke-red-600 dark:stroke-red-400',
}

const RING_SIZE = 112
const STROKE = 8
const RADIUS = (RING_SIZE - STROKE) / 2
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

export type ConsistencyRingProps = {
  score: number
  className?: string
}

/**
 * Circular progress ring 0–100 — the visual differentiator for Step 65.
 */
export function ConsistencyRing({ score, className }: ConsistencyRingProps) {
  const value = clampConsistencyScore(score)
  const band = consistencyBand(value)
  const offset = CIRCUMFERENCE * (1 - value / 100)

  return (
    <div
      className={cn('relative inline-flex size-28 items-center justify-center', className)}
      data-testid="consistency-ring"
      data-score={value}
      data-band={band}
    >
      <svg
        width={RING_SIZE}
        height={RING_SIZE}
        viewBox={`0 0 ${RING_SIZE} ${RING_SIZE}`}
        className="-rotate-90"
        aria-hidden
      >
        <circle
          cx={RING_SIZE / 2}
          cy={RING_SIZE / 2}
          r={RADIUS}
          fill="none"
          strokeWidth={STROKE}
          className="stroke-muted/60"
        />
        <circle
          cx={RING_SIZE / 2}
          cy={RING_SIZE / 2}
          r={RADIUS}
          fill="none"
          strokeWidth={STROKE}
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={offset}
          className={cn(
            'transition-[stroke-dashoffset] duration-500 ease-out',
            BAND_STROKE[band]
          )}
          data-testid="consistency-ring-progress"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span
          className="font-mono text-2xl font-semibold tabular-nums tracking-tight"
          data-testid="consistency-ring-value"
        >
          {value}
        </span>
        <span className="text-muted-foreground text-[9px] font-medium tracking-wide uppercase">
          / 100
        </span>
      </div>
    </div>
  )
}

export type ConsistencyScoreCardProps = {
  score: number
  isFetching?: boolean
  className?: string
}

/** Presentational Consistency Score card with circular ring (Step 65). */
export function ConsistencyScoreCardView({
  score,
  isFetching,
  className,
}: ConsistencyScoreCardProps) {
  const value = clampConsistencyScore(score)
  const label = consistencyLabel(value)

  return (
    <React.Fragment>
      <Card
        data-testid="consistency-score-card"
        size="sm"
        className={cn(className)}
      >
        <CardHeader className="border-b">
          <CardTitle>Consistency</CardTitle>
          <CardDescription>
            bedtime stability
            {isFetching ? ' · refreshing…' : null}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-2 pt-(--card-spacing)">
          <ConsistencyRing score={value} />
          <p
            className="text-muted-foreground text-center text-[10px] tabular-nums"
            data-testid="consistency-score-label"
          >
            {label}
          </p>
        </CardContent>
      </Card>
    </React.Fragment>
  )
}

/** Dashboard container — reads consistencyScore from stats summary. */
export function ConsistencyScoreCard() {
  const { data: stats, isFetching } = useDashboardStats()
  const score = stats?.consistencyScore ?? 0

  return (
    <ConsistencyScoreCardView score={score} isFetching={isFetching} />
  )
}
