import { StatCard } from '@/features/dashboard/StatCard'
import { formatAverageHours } from '@/features/dashboard/AverageSleepCards'
import {
  formatClockTime,
  formatLatencyDisplay,
} from '@/features/dashboard/ScheduleTimingCards'
import type { DashboardStats } from '@/features/dashboard/useDashboardStats'

type StatDef = {
  key: keyof DashboardStats
  label: string
  format: (stats: DashboardStats) => string
  /** Optional trend line — computed outside StatCard (pure presentation). */
  trend?: (stats: DashboardStats) => string | undefined
  hint?: string
}

function formatDebt(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return `${h}h ${m}m`
}

const STATS: StatDef[] = [
  {
    key: 'todaySleep',
    label: "Today's Sleep",
    format: (s) => (s.todaySleep == null ? '—' : `${s.todaySleep}h`),
    hint: 'Most recent night',
  },
  {
    key: 'sleepDebt',
    label: 'Sleep Debt',
    format: (s) => formatDebt(s.sleepDebt),
    trend: (s) =>
      s.sleepDebt === 0 ? '→ on target (7d)' : '↑ deficit vs 8h (7d)',
    hint: 'Last 7 nights vs 8h',
  },
  {
    key: 'avg7day',
    label: '7-day Avg',
    format: (s) => formatAverageHours(s.avg7day),
  },
  {
    key: 'avg30day',
    label: '30-day Avg',
    format: (s) => formatAverageHours(s.avg30day),
    trend: (s) =>
      s.avg7day != null && s.avg30day != null
        ? `${s.avg7day >= s.avg30day ? '+' : ''}${(s.avg7day - s.avg30day).toFixed(2)}h vs 30d`
        : undefined,
  },
  {
    key: 'consistencyScore',
    label: 'Consistency',
    format: (s) => `${s.consistencyScore}`,
    trend: (s) =>
      s.consistencyScore >= 80
        ? 'Stable schedule'
        : s.consistencyScore >= 50
          ? 'Moderate variation'
          : 'High variation',
    hint: 'Bedtime stability 0–100',
  },
  {
    key: 'avgBedtime',
    label: 'Avg Bedtime',
    format: (s) => formatClockTime(s.avgBedtime),
  },
  {
    key: 'avgWakeTime',
    label: 'Avg Wake',
    format: (s) => formatClockTime(s.avgWakeTime),
  },
  {
    key: 'avgLatency',
    label: 'Avg Latency',
    format: (s) => formatLatencyDisplay(s.avgLatency),
    hint: 'Attempt → estimated sleep',
  },
]

/** Dense Grafana-style KPI strip — formats values; StatCard is pure UI. */
export function StatCardsGrid({
  stats,
  isLoading,
}: {
  stats?: DashboardStats
  isLoading?: boolean
}) {
  return (
    <div
      className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-8"
      data-testid="stat-cards-grid"
    >
      {STATS.map(({ key, label, format, trend, hint }) => (
        <StatCard
          key={key}
          data-testid={`stat-card-${key}`}
          label={label}
          value={stats ? format(stats) : '—'}
          trend={stats && trend ? trend(stats) : undefined}
          hint={hint}
          isLoading={isLoading}
        />
      ))}
    </div>
  )
}
