import * as React from 'react'

import { Button } from '@/components/ui/button'
import {
  ANALYTICS_DATE_RANGES,
  ANALYTICS_RANGE_LABELS,
  type AnalyticsDateRange,
} from '@/features/analytics/analyticsRange'
import { cn } from '@/lib/utils'

export type DateRangeFilterProps = {
  value: AnalyticsDateRange
  onChange: (range: AnalyticsDateRange) => void
  className?: string
  'data-testid'?: string
}

/**
 * Segmented 7d / 30d / 90d / all-time control for the Analytics page.
 */
export function DateRangeFilter({
  value,
  onChange,
  className,
  'data-testid': testId = 'date-range-filter',
}: DateRangeFilterProps) {
  return (
    <React.Fragment>
      <div
        role="group"
        aria-label="Date range"
        className={cn('flex flex-wrap gap-1', className)}
        data-testid={testId}
      >
        {ANALYTICS_DATE_RANGES.map((range) => {
          const active = value === range
          return (
            <Button
              key={range}
              type="button"
              size="sm"
              variant={active ? 'default' : 'outline'}
              aria-pressed={active}
              data-range={range}
              data-testid={`date-range-${range}`}
              onClick={() => onChange(range)}
            >
              {ANALYTICS_RANGE_LABELS[range]}
            </Button>
          )
        })}
      </div>
    </React.Fragment>
  )
}
