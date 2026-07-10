import { computeCorrelations } from '../src/services/analytics.service'
import { sleepEntryRepository } from '../src/repositories/sleepEntry.repository'
import type { SleepEntryWithRelations } from '../src/types'
import { assert, assertEqual, runTest } from './helpers'

function makeEntry(
  partial: Partial<SleepEntryWithRelations> & { sleepQuality: number | null }
): SleepEntryWithRelations {
  return {
    id: partial.id ?? 'test',
    date: partial.date ?? new Date(2026, 0, 1),
    bedTime: partial.bedTime ?? null,
    attemptSleepTime: partial.attemptSleepTime ?? null,
    estimatedSleepTime: partial.estimatedSleepTime ?? null,
    wakeTime: partial.wakeTime ?? null,
    outOfBedTime: null,
    numberOfAwakenings: null,
    sleepQuality: partial.sleepQuality,
    energyMorning: null,
    energyWork: null,
    notes: null,
    mood: partial.mood ?? null,
    food: partial.food ?? null,
    exercise: partial.exercise ?? null,
    environment: partial.environment ?? null,
    health: partial.health ?? null,
  }
}

export async function runCorrelationsTests(): Promise<boolean> {
  console.log('\n[analytics.correlations]')
  const results: boolean[] = []

  results.push(
    await runTest('computeCorrelations phone groups with known averages', () => {
      const entries: SleepEntryWithRelations[] = [
        makeEntry({
          id: 'p1',
          date: new Date(2026, 0, 5), // Mon
          sleepQuality: 8,
          attemptSleepTime: new Date(2026, 0, 5, 23, 0),
          estimatedSleepTime: new Date(2026, 0, 5, 23, 30), // 30 min
          environment: {
            phoneUsedBeforeSleep: true,
            minutesPhoneBeforeSleep: 40,
            roomTemp: 22,
            sunlightSeenBeforeSleep: true,
          },
          food: { mealBeforeSleep: true, caffeineAmountMg: 50 },
        }),
        makeEntry({
          id: 'p2',
          date: new Date(2026, 0, 6),
          sleepQuality: 6,
          attemptSleepTime: new Date(2026, 0, 6, 23, 0),
          estimatedSleepTime: new Date(2026, 0, 7, 0, 0), // 60 min latency
          environment: {
            phoneUsedBeforeSleep: true,
            minutesPhoneBeforeSleep: 50,
            roomTemp: 22,
            sunlightSeenBeforeSleep: false,
          },
          food: { mealBeforeSleep: false, caffeineAmountMg: 80 },
        }),
        makeEntry({
          id: 'n1',
          date: new Date(2026, 0, 7),
          sleepQuality: 9,
          attemptSleepTime: new Date(2026, 0, 7, 23, 0),
          estimatedSleepTime: new Date(2026, 0, 7, 23, 10), // 10 min
          environment: {
            phoneUsedBeforeSleep: false,
            minutesPhoneBeforeSleep: 0,
            roomTemp: 21,
            sunlightSeenBeforeSleep: true,
          },
          food: { mealBeforeSleep: false, caffeineAmountMg: 40 },
        }),
      ]

      const correlations = computeCorrelations(entries)
      const phone = correlations.find((c) => c.factor === 'phoneUsedBeforeSleep')
      assert(phone, 'phoneUsedBeforeSleep present')
      assertEqual(phone.groupA.n, 2, 'phone yes n')
      assertEqual(phone.groupB.n, 1, 'phone no n')
      assertEqual(phone.groupA.avgLatency, 45, 'phone yes avg latency (30+60)/2')
      assertEqual(phone.groupA.avgQuality, 7, 'phone yes avg quality (8+6)/2')
      assertEqual(phone.groupB.avgLatency, 10, 'phone no latency')
      assertEqual(phone.groupB.avgQuality, 9, 'phone no quality')

      const factors = correlations.map((c) => c.factor)
      assert(factors.includes('sunlightSeenBeforeSleep'), 'sunrise factor')
      assert(factors.includes('mealBeforeSleep'), 'meal factor')
      assert(factors.includes('weekdayWeekend'), 'weekday factor')
    })
  )

  results.push(
    await runTest(
      'seeded data includes phoneUsedBeforeSleep with real averages',
      async () => {
        const entries = await sleepEntryRepository.findAll()
        const correlations = computeCorrelations(entries)
        const phone = correlations.find((c) => c.factor === 'phoneUsedBeforeSleep')
        assert(phone, 'phone factor in seeded correlations')
        assert(phone.groupA.n + phone.groupB.n > 0, 'some classified days')
        assert(
          phone.groupA.n > 0 && phone.groupB.n > 0,
          `expected mix of phone-use days (A=${phone.groupA.n} B=${phone.groupB.n})`
        )
        assert(
          phone.groupA.avgQuality !== null || phone.groupB.avgQuality !== null,
          'computed avgQuality'
        )
        console.log(
          `    phone yes n=${phone.groupA.n} lat=${phone.groupA.avgLatency} q=${phone.groupA.avgQuality}`
        )
        console.log(
          `    phone no  n=${phone.groupB.n} lat=${phone.groupB.avgLatency} q=${phone.groupB.avgQuality}`
        )
      }
    )
  )

  return results.every(Boolean)
}
