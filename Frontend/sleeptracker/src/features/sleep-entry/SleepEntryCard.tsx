import type { SleepEntry } from '@/types/sleepEntry'

type SleepEntryCardProps = {
  entry: SleepEntry
}

/**
 * Proves SleepEntry shape is usable in components (Step 44).
 * Destructures Prisma-mirrored fields — tsc must stay clean.
 */
export function SleepEntryCard({ entry }: SleepEntryCardProps) {
  const {
    id,
    date,
    sleepQuality,
    bedTime,
    wakeTime,
    notes,
    mood,
    food,
    exercise,
    environment,
    health,
  } = entry

  return (
    <article data-entry-id={id} className="space-y-1 text-sm">
      <p>
        <span className="text-muted-foreground">Date </span>
        {date}
      </p>
      <p>
        Quality {sleepQuality ?? '—'} · Bed {bedTime ?? '—'} · Wake{' '}
        {wakeTime ?? '—'}
      </p>
      {notes ? <p className="text-muted-foreground">{notes}</p> : null}
      <p className="text-muted-foreground">
        mood {mood?.mood ?? '—'} · caffeine {food?.caffeineAmountMg ?? '—'}mg ·
        exercise {exercise?.duration ?? '—'}m · phone{' '}
        {environment?.minutesPhoneBeforeSleep ?? '—'}m · HR{' '}
        {health?.restingHeartRate ?? '—'}
      </p>
    </article>
  )
}
