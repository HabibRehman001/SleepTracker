import {
  CorrelationCard,
  type CorrelationGroup,
} from '@/features/dashboard/CorrelationCard'
import type { FactorCorrelation } from '@/features/analytics/useAnalytics'

function toCardGroup(group: FactorCorrelation['groupA']): CorrelationGroup {
  return {
    label: group.label || 'YES',
    avg: group.avg,
    n: group.n,
  }
}

/**
 * Grid of {@link CorrelationCard} — one card per factor × outcome entry.
 * Titles come from API `label` ("Phone before sleep vs latency").
 */
export function CorrelationCards({
  correlations,
  isLoading,
}: {
  correlations?: FactorCorrelation[]
  isLoading?: boolean
}) {
  if (isLoading) {
    return (
      <div className="grid gap-2 sm:grid-cols-2" data-testid="correlation-cards">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="h-28 animate-pulse rounded-md border border-border/80 bg-card/40"
          />
        ))}
      </div>
    )
  }

  if (!correlations?.length) {
    return (
      <p className="text-muted-foreground text-sm" data-testid="correlation-cards">
        No correlations yet — need at least 3 nights in each group for the
        selected range.
      </p>
    )
  }

  return (
    <div
      className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3"
      data-testid="correlation-cards"
    >
      {correlations.map((c) => (
        <CorrelationCard
          key={`${c.factor}-${c.outcome}`}
          factor={c.label || `${c.factor} vs ${c.outcome}`}
          outcome={c.outcome}
          groupA={toCardGroup(c.groupA)}
          groupB={toCardGroup({ ...c.groupB, label: c.groupB.label || 'NO' })}
          data-testid={`correlation-${c.factor}-${c.outcome}`}
        />
      ))}
    </div>
  )
}

/** @deprecated Side labels now come from the API groups. */
export function correlationSideLabel(
  _factor: string,
  isGroupA: boolean,
  groupLabel?: string
): string {
  if (groupLabel) return groupLabel
  return isGroupA ? 'YES' : 'NO'
}
