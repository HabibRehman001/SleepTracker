import * as React from 'react'
import { format, parseISO } from 'date-fns'

import { LineChartCard } from '@/components/charts'
import {
  experimentDateKey,
} from '@/features/experiments/experimentFormat'
import type { SleepEntry } from '@/types/sleepEntry'

export type ExperimentQualityChartProps = {
  entries: SleepEntry[]
  startDate: string
  endDate?: string | null
  title?: string
  className?: string
}

function entryKey(entry: SleepEntry): string {
  return experimentDateKey(entry.date)
}

/**
 * Sleep quality line with a vertical marker at experiment start.
 * Window: last 14 pre nights + during nights (same spirit as comparison).
 */
export function ExperimentQualityChart({
  entries,
  startDate,
  endDate,
  title = 'Sleep quality',
  className,
}: ExperimentQualityChartProps) {
  const startKey = experimentDateKey(startDate)
  const endKey = endDate ? experimentDateKey(endDate) : null

  const sorted = [...entries].sort((a, b) =>
    entryKey(a).localeCompare(entryKey(b))
  )

  const before = sorted.filter((e) => entryKey(e) < startKey).slice(-14)
  const during = sorted.filter((e) => {
    const k = entryKey(e)
    if (k < startKey) return false
    if (endKey != null && k > endKey) return false
    return true
  })

  const window = [...before, ...during]
  const data = window.map((entry) => {
    const key = entryKey(entry)
    return {
      date: key.slice(5), // MM-DD
      dateKey: key,
      quality: entry.sleepQuality,
    }
  })

  // Marker must match a categorical x in the series — use MM-DD label
  const markerX = (() => {
    try {
      return format(parseISO(startKey), 'MM-dd')
    } catch {
      return startKey.slice(5)
    }
  })()

  const hasStartInData = data.some((d) => d.dateKey === startKey)

  return (
    <React.Fragment>
      <LineChartCard
        title={title}
        data={data}
        xKey="date"
        series={[{ dataKey: 'quality', name: 'Quality' }]}
        yDomain={[1, 10]}
        verticalMarkerX={hasStartInData ? markerX : undefined}
        verticalMarkerLabel="Start"
        emptyMessage="No quality data in this experiment window."
        className={className}
        data-testid="experiment-quality-chart"
        height={220}
      />
    </React.Fragment>
  )
}
