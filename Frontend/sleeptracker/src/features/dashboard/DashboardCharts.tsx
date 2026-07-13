import { differenceInMinutes, format, parseISO } from 'date-fns'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

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

const tooltipStyle = {
  backgroundColor: 'var(--popover)',
  border: '1px solid var(--border)',
  borderRadius: '8px',
  fontSize: '12px',
  color: 'var(--popover-foreground)',
}

/** Sleep duration + quality charts (last 14 nights). */
export function DashboardCharts({ entries }: { entries: SleepEntry[] }) {
  const data = chartRows(entries)
  const hasHours = data.some((d) => d.hours != null)
  const hasQuality = data.some((d) => d.quality != null)

  return (
    <div
      className="grid gap-3 lg:grid-cols-2"
      data-testid="dashboard-charts"
    >
      <section className="rounded-md border border-border/80 bg-card/40 p-3">
        <h2 className="text-muted-foreground mb-3 text-[10px] font-medium tracking-wide uppercase">
          Sleep duration (14d)
        </h2>
        <div className="h-52 w-full">
          {hasHours ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data} margin={{ top: 4, right: 8, left: -12, bottom: 0 }}>
                <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" />
                <XAxis
                  dataKey="date"
                  tick={{ fill: 'var(--muted-foreground)', fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  domain={[0, 12]}
                  tick={{ fill: 'var(--muted-foreground)', fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                  width={32}
                />
                <Tooltip contentStyle={tooltipStyle} />
                <Line
                  type="monotone"
                  dataKey="hours"
                  name="Hours"
                  stroke="var(--foreground)"
                  strokeWidth={2}
                  dot={false}
                  connectNulls={false}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-muted-foreground text-sm">No duration data yet.</p>
          )}
        </div>
      </section>

      <section className="rounded-md border border-border/80 bg-card/40 p-3">
        <h2 className="text-muted-foreground mb-3 text-[10px] font-medium tracking-wide uppercase">
          Sleep quality (14d)
        </h2>
        <div className="h-52 w-full">
          {hasQuality ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} margin={{ top: 4, right: 8, left: -12, bottom: 0 }}>
                <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" />
                <XAxis
                  dataKey="date"
                  tick={{ fill: 'var(--muted-foreground)', fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  domain={[0, 10]}
                  tick={{ fill: 'var(--muted-foreground)', fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                  width={32}
                />
                <Tooltip contentStyle={tooltipStyle} />
                <Legend
                  wrapperStyle={{ fontSize: 11, color: 'var(--muted-foreground)' }}
                />
                <Bar
                  dataKey="quality"
                  name="Quality"
                  fill="var(--foreground)"
                  opacity={0.85}
                  radius={[2, 2, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-muted-foreground text-sm">No quality data yet.</p>
          )}
        </div>
      </section>    </div>
  )
}
