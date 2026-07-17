import type { CSSProperties } from 'react'

/** Shared Recharts tokens — keep colors / axes / tooltips out of feature files. */
export const chartColors = {
  series: 'var(--chart-2)',
  seriesAlt: 'var(--chart-3)',
  seriesStrong: 'var(--foreground)',
  grid: 'var(--border)',
  tick: 'var(--muted-foreground)',
  empty: 'var(--muted)',
  /** Sleep-quality style intensity scale (low → high). */
  heat: [
    'var(--muted)',
    'var(--chart-1)',
    'var(--chart-2)',
    'var(--chart-3)',
    'var(--chart-4)',
    'var(--chart-5)',
  ] as const,
} as const

export const chartMargin = { top: 4, right: 8, left: -12, bottom: 0 }

/** Tighter margins for ≤640px viewports (Step 89). */
export const chartMarginCompact = { top: 2, right: 4, left: -20, bottom: 2 }

export const chartTooltipStyle: CSSProperties = {
  backgroundColor: 'var(--popover)',
  border: '1px solid var(--border)',
  borderRadius: '8px',
  fontSize: '12px',
  color: 'var(--popover-foreground)',
}

export const chartAxisTick = {
  fill: chartColors.tick,
  fontSize: 10,
} as const

export const chartAxisTickCompact = {
  fill: chartColors.tick,
  fontSize: 9,
} as const

export const defaultChartHeight = 208 // h-52
/** Slightly shorter plot on phones — still readable. */
export const compactChartHeight = 176

export function chartPlotMargin(compact: boolean) {
  return compact ? chartMarginCompact : chartMargin
}

export function chartTick(compact: boolean) {
  return compact ? chartAxisTickCompact : chartAxisTick
}

export function chartYAxisWidth(compact: boolean, roomy = 32) {
  return compact ? Math.max(24, roomy - 8) : roomy
}

export function chartTooltipContentStyle(): CSSProperties {
  return chartTooltipStyle
}

/** Map a 0…maxValue intensity onto {@link chartColors.heat}. */
export function heatColor(
  value: number | null | undefined,
  maxValue = 10
): string {
  if (value == null || !Number.isFinite(value) || maxValue <= 0) {
    return chartColors.heat[0]
  }
  const t = Math.max(0, Math.min(1, value / maxValue))
  const idx = Math.min(
    chartColors.heat.length - 1,
    Math.round(t * (chartColors.heat.length - 1))
  )
  return chartColors.heat[idx]
}
