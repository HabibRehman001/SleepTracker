import * as React from 'react'

import type { FactorGroupStats } from '@/features/analytics/useAnalytics'
import { cn } from '@/lib/utils'

export type CorrelationGroup = Pick<
  FactorGroupStats,
  'label' | 'avgLatency' | 'n'
> & {
  avgQuality?: number | null
}

export type CorrelationCardProps = {
  factor: string
  groupA: CorrelationGroup
  groupB: CorrelationGroup
  className?: string
  'data-testid'?: string
}

const NOT_ENOUGH = 'not enough data'

/**
 * Latency line for one side. Never shows NaN — empty groups → "not enough data".
 */
export function formatCorrelationLatency(group: CorrelationGroup): string {
  if (group.n <= 0 || group.avgLatency == null || !Number.isFinite(group.avgLatency)) {
    return NOT_ENOUGH
  }
  const mins = Math.round(group.avgLatency)
  return `${mins} min avg latency`
}

/**
 * Which side has the higher (worse) latency for highlight — null if incomparable.
 */
export function higherLatencySide(
  groupA: CorrelationGroup,
  groupB: CorrelationGroup
): 'A' | 'B' | null {
  const aOk =
    groupA.n > 0 &&
    groupA.avgLatency != null &&
    Number.isFinite(groupA.avgLatency)
  const bOk =
    groupB.n > 0 &&
    groupB.avgLatency != null &&
    Number.isFinite(groupB.avgLatency)
  if (!aOk || !bOk) return null
  if (groupA.avgLatency! === groupB.avgLatency!) return null
  return groupA.avgLatency! > groupB.avgLatency! ? 'A' : 'B'
}

function GroupColumn({
  side,
  group,
  highlight,
}: {
  side: 'A' | 'B'
  group: CorrelationGroup
  highlight: boolean
}) {
  const latencyText = formatCorrelationLatency(group)
  const isEmpty = latencyText === NOT_ENOUGH

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
        <span className="font-mono tabular-nums">{latencyText}</span>
      </p>
    </div>
  )
}

/**
 * Side-by-side factor comparison (Step 67).
 * Example: Phone before sleep — YES → 87 min avg latency | NO → 21 min avg latency
 * Larger latency highlighted in red/amber.
 */
export function CorrelationCard({
  factor,
  groupA,
  groupB,
  className,
  'data-testid': testId = 'correlation-card',
}: CorrelationCardProps) {
  const worse = higherLatencySide(groupA, groupB)

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
          <GroupColumn side="A" group={groupA} highlight={worse === 'A'} />
          <GroupColumn side="B" group={groupB} highlight={worse === 'B'} />
        </div>
      </article>
    </React.Fragment>
  )
}
