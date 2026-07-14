import {
  addDays,
  eachDayOfInterval,
  endOfWeek,
  format,
  parseISO,
  startOfWeek,
} from 'date-fns'

export type HeatmapDay = {
  /** YYYY-MM-DD */
  date: string
  value: number | null
}

export type HeatmapCell = {
  date: Date
  key: string
  value: number | null
  weekIndex: number
  dayIndex: number
  /** True when the cell falls inside the requested [start, end] range. */
  inRange: boolean
}

export type HeatmapMonthLabel = {
  label: string
  weekIndex: number
}

export type ContributionGrid = {
  cells: HeatmapCell[]
  weekCount: number
  monthLabels: HeatmapMonthLabel[]
  /** Sunday-based week start / end of the drawn grid. */
  gridStart: Date
  gridEnd: Date
}

export function toHeatmapDate(input: string | Date): Date {
  return typeof input === 'string' ? parseISO(input) : input
}

export function toHeatmapKey(d: Date): string {
  return format(d, 'yyyy-MM-dd')
}

export function resolveHeatmapRange(
  days: HeatmapDay[],
  startDate?: string | Date,
  endDate?: string | Date
): { start: Date; end: Date } {
  const end = endDate
    ? toHeatmapDate(endDate)
    : days.length
      ? toHeatmapDate(days[days.length - 1].date)
      : new Date()

  if (startDate) {
    return { start: toHeatmapDate(startDate), end }
  }

  if (days.length) {
    return { start: toHeatmapDate(days[0].date), end }
  }

  return { start: addDays(end, -12 * 7 + 1), end }
}

/**
 * GitHub-style contribution grid: columns = weeks, rows = weekdays (Sun→Sat).
 * A full calendar year typically yields 53 columns (52–54 depending on alignment).
 */
export function buildContributionGrid(
  days: HeatmapDay[],
  startDate?: string | Date,
  endDate?: string | Date
): ContributionGrid {
  const valueByDate = new Map<string, number | null>()
  for (const d of days) {
    valueByDate.set(d.date.slice(0, 10), d.value)
  }

  const { start, end } = resolveHeatmapRange(days, startDate, endDate)
  const rangeStartKey = toHeatmapKey(start)
  const rangeEndKey = toHeatmapKey(end)

  const gridStart = startOfWeek(start, { weekStartsOn: 0 })
  const gridEnd = endOfWeek(end, { weekStartsOn: 0 })
  const allDays = eachDayOfInterval({ start: gridStart, end: gridEnd })

  const cells: HeatmapCell[] = allDays.map((date, i) => {
    const key = toHeatmapKey(date)
    return {
      date,
      key,
      value: valueByDate.has(key) ? (valueByDate.get(key) ?? null) : null,
      weekIndex: Math.floor(i / 7),
      dayIndex: date.getDay(),
      inRange: key >= rangeStartKey && key <= rangeEndKey,
    }
  })

  const weekCount =
    cells.length === 0 ? 0 : cells[cells.length - 1].weekIndex + 1

  const monthLabels: HeatmapMonthLabel[] = []
  let lastMonth = -1
  for (const cell of cells) {
    if (cell.dayIndex !== 0) continue // label weeks on Sunday
    const month = cell.date.getMonth()
    if (month !== lastMonth) {
      monthLabels.push({
        label: format(cell.date, 'MMM'),
        weekIndex: cell.weekIndex,
      })
      lastMonth = month
    }
  }

  return { cells, weekCount, monthLabels, gridStart, gridEnd }
}

/** Approximate SVG width for `weekCount` columns (must stay inside overflow-x scroller). */
export function contributionGridWidth(
  weekCount: number,
  cellSize = 11,
  gap = 3,
  labelWidth = 28
): number {
  return labelWidth + weekCount * (cellSize + gap)
}
