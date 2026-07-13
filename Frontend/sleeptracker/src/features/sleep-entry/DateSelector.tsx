import { format, parseISO, subDays } from 'date-fns'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useUiStore } from '@/stores/ui-store'

/** Date chip strip — writes only to Zustand selectedDate. */
export function DateSelector() {
  const selectedDate = useUiStore((s) => s.selectedDate)
  const setSelectedDate = useUiStore((s) => s.setSelectedDate)

  const chips = Array.from({ length: 7 }, (_, i) => {
    const d = subDays(new Date(), 6 - i)
    return format(d, 'yyyy-MM-dd')
  })

  return (
    <div className="flex flex-col gap-2" data-testid="date-selector">
      <label className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
        Selected date
      </label>
      <div className="flex flex-wrap gap-1.5">
        {chips.map((date) => {
          const active = date === selectedDate
          return (
            <Button
              key={date}
              type="button"
              size="sm"
              variant={active ? 'default' : 'outline'}
              onClick={() => setSelectedDate(date)}
              aria-pressed={active}
            >
              {format(parseISO(date), 'MMM d')}
            </Button>
          )
        })}
      </div>
      <Input
        type="date"
        value={selectedDate}
        onChange={(e) => {
          if (e.target.value) setSelectedDate(e.target.value)
        }}
        className="max-w-xs"
        aria-label="Pick date"
      />
    </div>
  )
}
