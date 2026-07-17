import * as React from 'react'
import { ResponsiveContainer } from 'recharts'

import { cn } from '@/lib/utils'

export type ResponsiveChartFrameProps = {
  children: React.ReactElement
  className?: string
}

/**
 * Keeps Recharts plots inside their card from 1440px → 375px.
 * Parent must supply height; this frame supplies width + min-w-0 + debounce.
 */
export function ResponsiveChartFrame({
  children,
  className,
}: ResponsiveChartFrameProps) {
  return (
    <div
      className={cn(
        'relative h-full w-full min-h-[10rem] min-w-0 max-w-full',
        className
      )}
      data-testid="responsive-chart-frame"
    >
      <ResponsiveContainer width="100%" height="100%" debounce={50}>
        {children}
      </ResponsiveContainer>
    </div>
  )
}

/** Grid wrapper: children shrink instead of overflowing flex/grid tracks. */
export const chartGridClassName =
  'grid min-w-0 w-full gap-3 sm:grid-cols-1 lg:grid-cols-2 [&>*]:min-w-0'
