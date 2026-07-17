import * as React from 'react'

import type { FactorGroupStats } from '@/features/analytics/useAnalytics'
import { cn } from '@/lib/utils'

export type CorrelationGroup = Pick<FactorGroupStats, 'label' | 'avg' | 'n'>

export type CorrelationCardProps = {
  factor: string
  /** Outcome key for display units — latency | quality | duration */
  outcome?: string
  groupA: CorrelationGroup
  groupB: CorrelationGroup
  className?: string
  'data-testid'?: string
}

const NOT_ENOUGH = 'not enough data'

/**
 * Format one group's outcome mean. Never shows NaN — empty → "not enough data".
 */
export function formatCorrelationAvg(
  group: CorrelationGroup,
  outcome = 'latency'
): string {
  if (group.n <= 0 || group.avg == null || !Number.isFinite(group.avg)) {
    return NOT_ENOUGH
  }
  if (outcome === 'quality') {
    return `${group.avg} avg quality`
  }
  if (outcome === 'duration') {
    return `${Math.round(group.avg)} min avg duration`
  }
  return `${Math.round(group.avg)} min avg latency`
}

/** @deprecated Prefer formatCorrelationAvg */
export const formatCorrelationLatency = (
  group: CorrelationGroup & { avgLatency?: number | null }
) =>
  formatCorrelationAvg(
    {
      label: group.label,
      n: group.n,
      avg: group.avg ?? group.avgLatency ?? null,
    },
    'latency'
  )

/**
 * Which side has the higher value for highlight — null if incomparable.
 */
export function higherValueSide(
  groupA: CorrelationGroup,
  groupB: CorrelationGroup
): 'A' | 'B' | null {
  const aOk =
    groupA.n > 0 && groupA.avg != null && Number.isFinite(groupA.avg)
  const bOk =
    groupB.n > 0 && groupB.avg != null && Number.isFinite(groupB.avg)
  if (!aOk || !bOk) return null
  if (groupA.avg === groupB.avg) return null
  return groupA.avg! > groupB.avg! ? 'A' : 'B'
}

/** @deprecated Prefer higherValueSide */
export const higherLatencySide = higherValueSide

function GroupColumn({
  side,
  group,
  outcome,
  highlight,
}: {
  side: 'A' | 'B'
  group: CorrelationGroup
  outcome: string
  highlight: boolean
}) {
  const avgText = formatCorrelationAvg(group, outcome)
  const isEmpty = avgText === NOT_ENOUGH

  return (
    <div
      data-testid={`correlation-group-${side}`}
      data-empty={isEmpty ? 'true' : 'false'}
      className={cn(
        'min-w-0 rounded-md border border-border/60 px-2.5 py-2',
        side === 'A' ? 'bg-muted/25' : 'bg-transparent'
      )}
    >
      <p className="text-muted-foreground mb-1 text-[10px] font-medium tracking-wide uppercase">
        <span data-testid={`correlation-group-${side}-label`}>{group.label}</span>
        <span className="normal-case text-muted-foreground/80"> · n={group.n}</span>
      </p>
      <p
        className={cn(
          'text-sm leading-snug',
          isEmpty && 'text-muted-foreground italic',
          highlight &&
            !isEmpty &&
            'font-semibold text-red-700 dark:text-amber-400'
        )}
        data-testid={`correlation-group-${side}-latency`}
        data-highlight={highlight && !isEmpty ? 'true' : 'false'}
      >
        <span className="font-medium tracking-wide uppercase">{group.label}</span>
        {' → '}
        <span className="font-mono tabular-nums">{avgText}</span>
      </p>
    </div>
  )
}

/**
 * Side-by-side factor × outcome comparison.
 * Example: Phone before sleep vs latency — YES → 87 min | NO → 21 min
 */
export function CorrelationCard({
  factor,
  outcome = 'latency',
  groupA,
  groupB,
  className,
  'data-testid': testId = 'correlation-card',
}: CorrelationCardProps) {
  const worse = higherValueSide(groupA, groupB)

  return (
    <React.Fragment>
      <article
        data-testid={testId}
        className={cn(
          'rounded-md border border-border/80 bg-card/40 p-3',
          className
        )}
      >
        <h3
          className="mb-2 text-xs font-medium tracking-tight"
          data-testid={`${testId}-factor`}
        >
          {factor}
        </h3>
        <div className="grid grid-cols-2 gap-2">
          <GroupColumn
            side="A"
            group={groupA}
            outcome={outcome}
            highlight={worse === 'A'}
          />
          <GroupColumn
            side="B"
            group={groupB}
            outcome={outcome}
            highlight={worse === 'B'}
          />
        </div>
      </article>
    </React.Fragment>
  )
}
