import * as React from 'react'

/** True below `breakpoint` px (default 640 — Tailwind `sm`). */
export function useCompactChart(breakpoint = 640): boolean {
  const [compact, setCompact] = React.useState(false)

  React.useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${breakpoint}px)`)
    const apply = () => setCompact(mq.matches)
    apply()
    mq.addEventListener('change', apply)
    return () => mq.removeEventListener('change', apply)
  }, [breakpoint])

  return compact
}
