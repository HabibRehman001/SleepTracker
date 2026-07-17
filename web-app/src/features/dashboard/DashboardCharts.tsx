import { differenceInMinutes, format, parseISO } from 'date-fns'

import { chartGridClassName, LineChartCard } from '@/components/charts'
import type { SleepEntry } from '@/types/sleepEntry'

function entryDateKey(entry: SleepEntry): string {
  if (
    entry.date.endsWith('T00:00:00.000Z') ||
    /^\d{4}-\d{2}-\d{2}T00:00/.test(entry.date)
  ) {
    return entry.date.slice(0, 10)
  }
  return format(parseISO(entry.date), 'yyyy-MM-dd')
}

function durationHours(entry: SleepEntry): number | null {
  const start =
    entry.estimatedSleepTime ?? entry.attemptSleepTime ?? entry.bedTime
  if (!start || !entry.wakeTime) return null
  const minutes = differenceInMinutes(new Date(entry.wakeTime), new Date(start))
  if (minutes <= 0) return null
  return Math.round((minutes / 60) * 100) / 100
}

function chartRows(entries: SleepEntry[]) {
  return [...entries]
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-14)
    .map((entry) => {
      const key = entryDateKey(entry)
      return {
        date: key.slice(5), // MM-DD
        fullDate: key,
        hours: durationHours(entry),
        quality: entry.sleepQuality,
      }
    })
}

/** Sleep duration + quality charts (last 14 nights) via chart wrappers. */
export function DashboardCharts({ entries }: { entries: SleepEntry[] }) {
  const data = chartRows(entries)

  return (
    <div className={chartGridClassName} data-testid="dashboard-charts">
      <LineChartCard
        title="Sleep duration (14d)"
        data={data}
        xKey="date"
        series={[{ dataKey: 'hours', name: 'Hours' }]}
        yDomain={[0, 12]}
        emptyMessage="No duration data yet."
        data-testid="duration-line-chart"
      />
      <LineChartCard
        title="Sleep quality (14d)"
        data={data}
        xKey="date"
        series={[{ dataKey: 'quality', name: 'Quality' }]}
        yDomain={[0, 10]}
        emptyMessage="No quality data yet."
        data-testid="quality-line-chart"
      />
    </div>
  )
}
