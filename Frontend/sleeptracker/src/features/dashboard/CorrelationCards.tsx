import {
  CorrelationCard,
  type CorrelationGroup,
} from '@/features/dashboard/CorrelationCard'
import type { FactorCorrelation } from '@/features/analytics/useAnalytics'

function factorTitle(factor: string): string {
  switch (factor) {
    case 'phoneUsedBeforeSleep':
      return 'Phone before sleep'
    case 'sunlightSeenBeforeSleep':
      return 'Sunrise / sunlight'
    case 'mealBeforeSleep':
      return 'Meal before sleep'
    case 'weekdayWeekend':
      return 'Weekday vs weekend'
    default:
      return factor
  }
}

/** Compact YES / NO (or weekend/weekday) tags for the side-by-side layout. */
export function correlationSideLabel(factor: string, isGroupA: boolean): string {
  if (factor === 'weekdayWeekend') {
    return isGroupA ? 'WEEKEND' : 'WEEKDAY'
  }
  return isGroupA ? 'YES' : 'NO'
}

function toCardGroup(
  factor: string,
  group: FactorCorrelation['groupA'],
  isGroupA: boolean
): CorrelationGroup {
  return {
    label: correlationSideLabel(factor, isGroupA),
    avgLatency: group.avgLatency,
    avgQuality: group.avgQuality,
    n: group.n,
  }
}

/** Grid of {@link CorrelationCard} for all factor comparisons. */
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
        {Array.from({ length: 4 }).map((_, i) => (
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
        No correlation data yet.
      </p>
    )
  }

  return (
    <div
      className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4"
      data-testid="correlation-cards"
    >
      {correlations.map((c) => (
        <CorrelationCard
          key={c.factor}
          factor={factorTitle(c.factor)}
          groupA={toCardGroup(c.factor, c.groupA, true)}
          groupB={toCardGroup(c.factor, c.groupB, false)}
          data-testid={`correlation-${c.factor}`}
        />
      ))}
    </div>
  )
}
