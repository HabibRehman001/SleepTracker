import { format } from 'date-fns'
import { useHotkeys } from 'react-hotkeys-hook'
import { useNavigate } from 'react-router'

import { useUiStore } from '@/stores/ui-store'

/**
 * Global Linear-style shortcut chords (Step 49).
 * - g then d → Dashboard
 * - g then l → Log Entry
 * - n → new entry for today (sets selectedDate + navigates to /log)
 *
 * Disabled while typing in form fields (library default).
 */
export function useAppHotkeys() {
  const navigate = useNavigate()
  const setSelectedDate = useUiStore((s) => s.setSelectedDate)

  useHotkeys(
    'g>d',
    (event) => {
      event.preventDefault()
      navigate('/')
    },
    { sequenceTimeoutMs: 1000 }
  )

  useHotkeys(
    'g>l',
    (event) => {
      event.preventDefault()
      navigate('/log')
    },
    { sequenceTimeoutMs: 1000 }
  )

  useHotkeys('n', (event) => {
    event.preventDefault()
    setSelectedDate(format(new Date(), 'yyyy-MM-dd'))
    navigate('/log')
  })
}
