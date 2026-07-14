import {
  FACTORS,
  MIN_CORRELATION_GROUP_N,
  OUTCOMES,
  computeCorrelations,
  type CorrelationFactorDef,
} from '../src/services/analytics.service'
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

/** Build a night with known latency / quality / duration for tests. */
function night(opts: {
  id: string
  day: number // day of month Jan 2026
  phone: boolean
  latencyMin: number
  quality: number
  durationMin: number
  sunlight?: boolean
  meal?: boolean
  exercise?: boolean
}): SleepEntryWithRelations {
  const date = new Date(2026, 0, opts.day)
  const attempt = new Date(2026, 0, opts.day, 23, 0)
  const estimated = new Date(attempt.getTime() + opts.latencyMin * 60_000)
  const wake = new Date(estimated.getTime() + opts.durationMin * 60_000)
  return makeEntry({
    id: opts.id,
    date,
    sleepQuality: opts.quality,
    attemptSleepTime: attempt,
    estimatedSleepTime: estimated,
    wakeTime: wake,
    environment: {
      phoneUsedBeforeSleep: opts.phone,
      minutesPhoneBeforeSleep: opts.phone ? 40 : 0,
      roomTemp: 22,
      sunlightSeenBeforeSleep: opts.sunlight ?? true,
    },
    food: {
      mealBeforeSleep: opts.meal ?? false,
      caffeineAmountMg: 50,
    },
    exercise: {
      exercise: opts.exercise ?? false,
      duration: opts.exercise ? 30 : null,
    },
  })
}

export async function runCorrelationsTests(): Promise<boolean> {
  console.log('\n[analytics.correlations]')
  const results: boolean[] = []

  results.push(
    await runTest(
      'computeCorrelations phone groups with known averages (n≥3 each side)',
      () => {
        // YES: lat 30,60,45 → 45; q 8,6,7 → 7; dur 480,360,420 → 420
        // NO:  lat 10×3 → 10; q 9×3 → 9; dur 480×3 → 480
        const entries: SleepEntryWithRelations[] = [
          night({
            id: 'p1',
            day: 5,
            phone: true,
            latencyMin: 30,
            quality: 8,
            durationMin: 480,
            sunlight: true,
            meal: true,
          }),
          night({
            id: 'p2',
            day: 6,
            phone: true,
            latencyMin: 60,
            quality: 6,
            durationMin: 360,
            sunlight: false,
            meal: false,
          }),
          night({
            id: 'p3',
            day: 7,
            phone: true,
            latencyMin: 45,
            quality: 7,
            durationMin: 420,
            sunlight: true,
            meal: true,
          }),
          night({
            id: 'n1',
            day: 8,
            phone: false,
            latencyMin: 10,
            quality: 9,
            durationMin: 480,
            sunlight: false,
            meal: false,
          }),
          night({
            id: 'n2',
            day: 9,
            phone: false,
            latencyMin: 10,
            quality: 9,
            durationMin: 480,
            sunlight: true,
            meal: false,
          }),
          night({
            id: 'n3',
            day: 10,
            phone: false,
            latencyMin: 10,
            quality: 9,
            durationMin: 480,
            sunlight: false,
            meal: true,
          }),
        ]

        const correlations = computeCorrelations(entries)

        const phoneLatency = correlations.find(
          (c) =>
            c.factor === 'phoneUsedBeforeSleep' && c.outcome === 'latency'
        )
        const phoneQuality = correlations.find(
          (c) =>
            c.factor === 'phoneUsedBeforeSleep' && c.outcome === 'quality'
        )
        const phoneDuration = correlations.find(
          (c) =>
            c.factor === 'phoneUsedBeforeSleep' && c.outcome === 'duration'
        )

        assert(phoneLatency, 'phone vs latency')
        assert(phoneQuality, 'phone vs quality')
        assert(phoneDuration, 'phone vs duration')
        assertEqual(
          phoneLatency.label,
          'Phone before sleep vs latency',
          'latency label'
        )
        assertEqual(
          phoneQuality.label,
          'Phone before sleep vs quality',
          'quality label'
        )

        assertEqual(phoneLatency.groupA.n, 3, 'phone yes latency n')
        assertEqual(phoneLatency.groupB.n, 3, 'phone no latency n')
        assertEqual(phoneLatency.groupA.avg, 45, 'phone yes avg latency')
        assertEqual(phoneLatency.groupB.avg, 10, 'phone no latency')

        assertEqual(phoneQuality.groupA.avg, 7, 'phone yes avg quality')
        assertEqual(phoneQuality.groupB.avg, 9, 'phone no quality')

        assertEqual(phoneDuration.groupA.avg, 420, 'phone yes avg duration')
        assertEqual(phoneDuration.groupB.avg, 480, 'phone no duration')

        for (const c of correlations) {
          assert(
            c.groupA.n >= MIN_CORRELATION_GROUP_N &&
              c.groupB.n >= MIN_CORRELATION_GROUP_N,
            `${c.label} slipped past min-n filter`
          )
        }
      }
    )
  )

  results.push(
    await runTest(
      'only 2 phone-use days → phone correlation cards suppressed',
      () => {
        // 2 phone YES + 3 phone NO → phone × * filtered out until more YES data
        const entries: SleepEntryWithRelations[] = [
          night({
            id: 'p1',
            day: 5,
            phone: true,
            latencyMin: 40,
            quality: 8,
            durationMin: 480,
          }),
          night({
            id: 'p2',
            day: 6,
            phone: true,
            latencyMin: 50,
            quality: 6,
            durationMin: 360,
          }),
          night({
            id: 'n1',
            day: 7,
            phone: false,
            latencyMin: 10,
            quality: 9,
            durationMin: 480,
          }),
          night({
            id: 'n2',
            day: 8,
            phone: false,
            latencyMin: 12,
            quality: 9,
            durationMin: 480,
          }),
          night({
            id: 'n3',
            day: 9,
            phone: false,
            latencyMin: 8,
            quality: 8,
            durationMin: 480,
          }),
        ]

        const correlations = computeCorrelations(entries)
        const phoneCards = correlations.filter(
          (c) => c.factor === 'phoneUsedBeforeSleep'
        )
        assertEqual(
          phoneCards.length,
          0,
          'phone cards suppressed when YES n=2 < 3'
        )
        assertEqual(MIN_CORRELATION_GROUP_N, 3, 'threshold is 3')
      }
    )
  )

  results.push(
    await runTest(
      'adding a 5th FACTORS entry with n≥3 each side surfaces 3 outcome cards',
      () => {
        const entries: SleepEntryWithRelations[] = [
          night({
            id: 'e1',
            day: 5,
            phone: true,
            latencyMin: 20,
            quality: 8,
            durationMin: 480,
            exercise: true,
          }),
          night({
            id: 'e2',
            day: 6,
            phone: true,
            latencyMin: 20,
            quality: 8,
            durationMin: 480,
            exercise: true,
          }),
          night({
            id: 'e3',
            day: 7,
            phone: false,
            latencyMin: 20,
            quality: 7,
            durationMin: 480,
            exercise: true,
          }),
          night({
            id: 'e4',
            day: 8,
            phone: false,
            latencyMin: 50,
            quality: 6,
            durationMin: 360,
            exercise: false,
          }),
          night({
            id: 'e5',
            day: 9,
            phone: true,
            latencyMin: 50,
            quality: 6,
            durationMin: 360,
            exercise: false,
          }),
          night({
            id: 'e6',
            day: 10,
            phone: false,
            latencyMin: 50,
            quality: 6,
            durationMin: 360,
            exercise: false,
          }),
        ]

        const withFifth: CorrelationFactorDef[] = [
          ...FACTORS,
          {
            key: 'exercised',
            label: 'Exercised',
            get: (e) => e.exercise?.exercise,
          },
        ]

        const correlations = computeCorrelations(entries, withFifth)
        const exercised = correlations.filter((c) => c.factor === 'exercised')
        assertEqual(exercised.length, OUTCOMES.length, '3 exercised cards')
        const exercisedLatency = exercised.find((c) => c.outcome === 'latency')
        assert(exercisedLatency, 'exercised vs latency')
        assertEqual(
          exercisedLatency.label,
          'Exercised vs latency',
          'label from registries'
        )
        assertEqual(exercisedLatency.groupA.avg, 20, 'exercise yes latency')
        assertEqual(exercisedLatency.groupB.avg, 50, 'exercise no latency')
      }
    )
  )

  results.push(
    await runTest(
      'seeded data includes phoneUsedBeforeSleep with real averages',
      async () => {
        const entries = await sleepEntryRepository.findAll()
        const correlations = computeCorrelations(entries)
        assert(
          correlations.length <= FACTORS.length * OUTCOMES.length,
          'at most FACTORS × OUTCOMES after confidence filter'
        )
        for (const c of correlations) {
          assert(
            c.groupA.n >= MIN_CORRELATION_GROUP_N &&
              c.groupB.n >= MIN_CORRELATION_GROUP_N,
            `${c.label} has low-n side`
          )
        }
        const phone = correlations.find(
          (c) =>
            c.factor === 'phoneUsedBeforeSleep' && c.outcome === 'latency'
        )
        assert(phone, 'phone vs latency in seeded correlations')
        assert(
          phone.groupA.n > 0 && phone.groupB.n > 0,
          `expected mix of phone-use days (A=${phone.groupA.n} B=${phone.groupB.n})`
        )
        assert(phone.groupA.avg !== null || phone.groupB.avg !== null, 'avg')
        console.log(
          `    phone vs latency yes n=${phone.groupA.n} avg=${phone.groupA.avg} | ` +
            `no n=${phone.groupB.n} avg=${phone.groupB.avg}`
        )
      }
    )
  )

  return results.every(Boolean)
}
