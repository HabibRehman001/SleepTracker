import { format, parseISO } from 'date-fns'

import type { ExperimentComparisonMetric } from '@/features/experiments/useExperiments'

export function formatExperimentDay(iso: string | null | undefined): string {
  if (!iso) return 'Ongoing'
  try {
    return format(parseISO(iso), 'MMM d, yyyy')
  } catch {
    return iso.slice(0, 10)
  }
}

export function experimentDateKey(iso: string): string {
  if (/^\d{4}-\d{2}-\d{2}/.test(iso)) return iso.slice(0, 10)
  try {
    return format(parseISO(iso), 'yyyy-MM-dd')
  } catch {
    return iso.slice(0, 10)
  }
}

export function formatMetricValue(value: number, unit: string): string {
  if (!Number.isFinite(value)) return '—'
  if (unit === 'points') return value.toFixed(1)
  if (unit === 'hours') return `${value.toFixed(1)}h`
  if (unit === 'minutes') return `${Math.round(value)}m`
  return value.toFixed(2)
}

export function formatDiffValue(diff: number, unit: string): string {
  if (!Number.isFinite(diff)) return '—'
  const sign = diff > 0 ? '+' : ''
  if (unit === 'points') return `${sign}${diff.toFixed(1)}`
  if (unit === 'hours') return `${sign}${diff.toFixed(1)}h`
  if (unit === 'minutes') return `${sign}${Math.round(diff)}m`
  return `${sign}${diff.toFixed(2)}`
}

export function formatPValue(p: number | null): string | undefined {
  if (p == null || !Number.isFinite(p)) return undefined
  if (p < 0.001) return 'p < 0.001'
  if (p < 0.05) return `p = ${p.toFixed(3)}`
  return `p = ${p.toFixed(2)}`
}

export function pickPrimaryMetric(
  metrics: ExperimentComparisonMetric[]
): ExperimentComparisonMetric | undefined {
  return metrics.find((m) => m.key === 'sleepQuality') ?? metrics[0]
}

/**
 * One-line list-card summary from quality before/during means.
 * e.g. "Quality improved by 56%" / "Quality declined by 12%"
 */
export function qualityChangeSummary(
  metric: ExperimentComparisonMetric | undefined | null
): string {
  if (
    metric == null ||
    metric.key !== 'sleepQuality' ||
    !Number.isFinite(metric.beforeMean) ||
    !Number.isFinite(metric.duringMean) ||
    metric.beforeN < 1 ||
    metric.duringN < 1
  ) {
    return 'Not enough quality data yet'
  }
  if (metric.beforeMean === 0) {
    return metric.duringMean > 0
      ? 'Quality improved from zero baseline'
      : 'Not enough quality data yet'
  }
  const pct = (metric.diff / metric.beforeMean) * 100
  const rounded = Math.round(Math.abs(pct))
  if (rounded === 0) return 'Quality roughly unchanged'
  if (pct > 0) return `Quality improved by ${rounded}%`
  return `Quality declined by ${rounded}%`
}
