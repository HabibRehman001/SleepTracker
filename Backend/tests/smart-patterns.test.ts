import { computeSmartPatterns } from '../src/services/analytics.service'
import { sleepEntryRepository } from '../src/repositories/sleepEntry.repository'
import type { SleepEntryWithRelations } from '../src/types'
import { assert, assertEqual, runTest } from './helpers'

function makeEntry(
  partial: Partial<SleepEntryWithRelations> & { date: Date }
): SleepEntryWithRelations {
  return {
    id: partial.id ?? `p-${partial.date.toISOString()}`,
    date: partial.date,
    bedTime: partial.bedTime ?? null,
    attemptSleepTime: null,
    estimatedSleepTime: partial.estimatedSleepTime ?? null,
    wakeTime: partial.wakeTime ?? null,
    outOfBedTime: null,
    numberOfAwakenings: null,
    sleepQuality: partial.sleepQuality ?? null,
    energyMorning: null,
    energyWork: null,
    notes: null,
    mood: null,
    food: null,
    exercise: null,
    environment: null,
    health: null,
  }
}

/** Step 96 — dashboard smart patterns (warnings only when strong). */
export async function runSmartPatternsTests(): Promise<boolean> {
  console.log('\nsmart patterns (dashboard)')

  const results = [
    await runTest(
      'seeded DB: no amber warning banners (no false positives)',
      async () => {
        const entries = await sleepEntryRepository.findAll()
        assert(entries.length >= 30, 'need seeded nights')
        const patterns = computeSmartPatterns(entries)
        assertEqual(
          patterns.warnings.length,
          0,
          `seed warnings must be empty, got ${JSON.stringify(patterns.warnings)}`
        )
      }
    ),
    await runTest('moderate jetlag fixture → weekendJetlag warning', () => {
      const entries = [
        ...[5, 6, 7, 8, 9].map((d) =>
          makeEntry({
            date: new Date(2026, 0, d),
            bedTime: new Date(2026, 0, d, 4, 0),
            wakeTime: new Date(2026, 0, d + 1, 12, 0),
          })
        ),
        makeEntry({
          date: new Date(2026, 0, 10),
          bedTime: new Date(2026, 0, 11, 6, 0),
          wakeTime: new Date(2026, 0, 11, 14, 0),
        }),
        makeEntry({
          date: new Date(2026, 0, 11),
          bedTime: new Date(2026, 0, 12, 6, 0),
          wakeTime: new Date(2026, 0, 12, 14, 0),
        }),
      ]
      const patterns = computeSmartPatterns(entries)
      assert(
        patterns.warnings.some((w) => w.key === 'weekendJetlag'),
        'jetlag warning present'
      )
    }),
  ]

  return results.every(Boolean)
}
