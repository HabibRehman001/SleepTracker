import {
  buildInsights,
  createAnalyticsService,
  formatOptimalRoomTemp,
  formatSunriseBeforeBedImpact,
  detectCircadianDrift,
  detectWeekendJetlag,
  formatCircadianDrift,
  formatWeekendBedtimeShift,
  formatWeekendJetlag,
  generateInsightSentences,
  generateInsights,
  linearRegressionSlope,
  optimalRoomTempRange,
  rankInsightCandidates,
  roomTempBucket,
  sunriseBeforeBedImpact,
  toInsightCandidate,
  weekendBedtimeShiftHours,
  weekendJetlagHours,
} from '../src/services/analytics.service'
import type { InsightCandidate } from '../src/services/insightTemplates'
import type { FactorCorrelation, SleepEntryWithRelations } from '../src/types'
import { assert, assertClose, assertEqual, runTest } from './helpers'

function makeEntry(
  partial: Partial<SleepEntryWithRelations> & {
    date: Date
    bedTime?: Date | null
    wakeTime?: Date | null
  }
): SleepEntryWithRelations {
  return {
    id: partial.id ?? 'test',
    date: partial.date,
    bedTime: partial.bedTime ?? null,
    attemptSleepTime: null,
    estimatedSleepTime: null,
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
    environment: partial.environment ?? null,
    health: null,
  }
}

export async function runInsightsTests(): Promise<boolean> {
  console.log('\n[analytics.insights]')
  const results: boolean[] = []

  results.push(
    await runTest(
      'generateInsights embeds exact latency gap (87) from synthetic correlations',
      () => {
        const correlations: FactorCorrelation[] = [
          {
            factor: 'phoneUsedBeforeSleep',
            outcome: 'latency',
            label: 'Phone before sleep vs latency',
            groupA: { label: 'YES', avg: 92, n: 5 },
            groupB: { label: 'NO', avg: 5, n: 5 },
          },
          {
            factor: 'phoneUsedBeforeSleep',
            outcome: 'quality',
            label: 'Phone before sleep vs quality',
            groupA: { label: 'YES', avg: 6, n: 5 },
            groupB: { label: 'NO', avg: 8, n: 5 },
          },
          {
            factor: 'mealBeforeSleep',
            outcome: 'latency',
            label: 'Ate before sleep vs latency',
            groupA: { label: 'YES', avg: 40, n: 4 },
            groupB: { label: 'NO', avg: 38, n: 4 },
          },
        ]

        const insights = generateInsights(correlations)
        assertEqual(insights.length, 1, 'only meaningful latency gap surfaced')
        assertEqual(
          insights[0],
          'used your phone before sleep increased your average sleep latency by 87 minutes.',
          'exact template sentence'
        )
      }
    )
  )

  results.push(
    await runTest('generateInsights skips gaps ≤ 15 minutes', () => {
      const correlations: FactorCorrelation[] = [
        {
          factor: 'phoneUsedBeforeSleep',
          outcome: 'latency',
          label: 'Phone before sleep vs latency',
          groupA: { label: 'YES', avg: 50, n: 3 },
          groupB: { label: 'NO', avg: 40, n: 3 },
        },
      ]
      const insights = generateInsights(correlations)
      assertEqual(insights.length, 0, 'no insight for small gap')
    })
  )

  results.push(
    await runTest(
      'insight templates: exact sentences from known correlation objects',
      () => {
        const candidates: InsightCandidate[] = [
          {
            label: 'exercised',
            effectMinutes: 45,
            latencyDiff: 10, // below 15 → no latency sentence
          },
          {
            label: 'used your phone before sleep',
            effectMinutes: 5, // below 20 → no duration sentence
            latencyDiff: 87,
          },
          {
            label: 'ate before sleep',
            effectMinutes: 12,
            latencyDiff: 8,
          },
        ]

        const sentences = generateInsightSentences(candidates)
        assertEqual(sentences.length, 2, 'two templates fire')
        // Ranked by effect size: 87 latency before 45 duration
        assertEqual(
          sentences[0],
          'used your phone before sleep increased your average sleep latency by 87 minutes.',
          'larger effect (87) ranked first'
        )
        assertEqual(
          sentences[1],
          'You slept 45 minutes longer on days where you exercised.',
          'smaller effect (45) ranked second'
        )

        // Adapter: FactorCorrelation → candidate → same latency sentence
        const fromCorr = toInsightCandidate({
          factor: 'phoneUsedBeforeSleep',
          outcome: 'latency',
          label: 'Phone before sleep vs latency',
          groupA: { label: 'YES', avg: 92, n: 5 },
          groupB: { label: 'NO', avg: 5, n: 5 },
        })
        assert(fromCorr, 'candidate mapped')
        assertEqual(fromCorr.latencyDiff, 87, 'latencyDiff YES−NO')
        assertEqual(
          generateInsightSentences([fromCorr])[0],
          'used your phone before sleep increased your average sleep latency by 87 minutes.',
          'adapter + template string match'
        )
      }
    )
  )

  results.push(
    await runTest(
      'rank insights by effect size: 80-minute effect above 12-minute effect',
      () => {
        // Candidate ranking ignores registration order
        const ranked = rankInsightCandidates([
          { label: 'small habit', effectMinutes: 12 },
          { label: 'large habit', effectMinutes: 80 },
          { label: 'mid habit', latencyDiff: 40 },
        ])
        assertEqual(ranked[0].effectMinutes, 80, '80m first')
        assertEqual(ranked[1].latencyDiff, 40, '40m second')
        assertEqual(ranked[2].effectMinutes, 12, '12m last')

        // Sentence list: 80 latency above a smaller passing effect (25);
        // 12m latency is under the template threshold so it does not become a sentence,
        // but ranking of candidates still places 80 above 12.
        const sentences = generateInsightSentences([
          { label: 'small lag factor', latencyDiff: 12 },
          { label: 'large lag factor', latencyDiff: 80 },
          { label: 'medium lag factor', latencyDiff: 25 },
          { label: 'tiny sleep boost', effectMinutes: 12 },
          { label: 'big sleep boost', effectMinutes: 55 },
        ])

        assert(
          sentences[0].includes('80'),
          `expected 80m first, got: ${sentences[0]}`
        )
        assertEqual(
          sentences[0],
          'large lag factor increased your average sleep latency by 80 minutes.',
          '80m sentence exact'
        )

        const idx80 = sentences.findIndex((s) => s.includes('80'))
        const idx25 = sentences.findIndex((s) => s.includes('25'))
        const idx55 = sentences.findIndex((s) => s.includes('55'))
        assert(idx80 === 0, '80m at top of sentences')
        assert(idx55 > idx80, '55m duration below 80m latency')
        assert(idx25 > idx80, '25m below 80m')
        assert(
          !sentences.some((s) => s.includes('12')),
          '12m effects stay under template thresholds'
        )
        assert(sentences.length <= 5, 'at most 5 ranked insights')

        // Feed only 80 vs 12 as duration effects — 80 produces a sentence and ranks first
        const durationOnly = generateInsightSentences([
          { label: 'weak routine', effectMinutes: 12 },
          { label: 'strong routine', effectMinutes: 80 },
        ])
        assertEqual(durationOnly.length, 1, 'only 80m clears >20 threshold')
        assertEqual(
          durationOnly[0],
          'You slept 80 minutes longer on days where you strong routine.',
          '80m duration sentence'
        )
      }
    )
  )

  results.push(
    await runTest(
      'GET /analytics/insights payload: { insights: string[] } sorted by effect size',
      async () => {
        const service = createAnalyticsService({
          findAll: async () => [],
        })
        const body = await service.getInsights()
        assert(body && typeof body === 'object', 'object payload')
        assert(Array.isArray(body.insights), 'insights is string[]')
        assertEqual(body.insights.length, 0, 'empty entries → empty insights')

        // Ranking contract for the array inside the payload (Step 77)
        const ranked = generateInsightSentences([
          { label: 'small lag factor', latencyDiff: 25 },
          { label: 'large lag factor', latencyDiff: 80 },
        ])
        assertEqual(
          ranked[0],
          'large lag factor increased your average sleep latency by 80 minutes.',
          'payload insights would lead with 80m'
        )
        assert(
          ranked[0].includes('80') && ranked[1].includes('25'),
          '80 before 25 in ranked list'
        )
      }
    )
  )

  results.push(
    await runTest(
      'weekend bedtime shift matches spec: "Weekends shift your bedtime by 4.8 hours."',
      () => {
        /**
         * Weekday Mon–Fri bed 18:00 → 1080 min
         * Weekend Sat–Sun bed 22:48 → 1368 min
         * shift = (1368 - 1080) / 60 = 4.8 hours
         */
        const entries: SleepEntryWithRelations[] = [
          // Mon 2026-01-05 … Fri 2026-01-09
          makeEntry({
            id: 'wd1',
            date: new Date(2026, 0, 5),
            bedTime: new Date(2026, 0, 5, 18, 0),
          }),
          makeEntry({
            id: 'wd2',
            date: new Date(2026, 0, 6),
            bedTime: new Date(2026, 0, 6, 18, 0),
          }),
          makeEntry({
            id: 'wd3',
            date: new Date(2026, 0, 7),
            bedTime: new Date(2026, 0, 7, 18, 0),
          }),
          makeEntry({
            id: 'wd4',
            date: new Date(2026, 0, 8),
            bedTime: new Date(2026, 0, 8, 18, 0),
          }),
          makeEntry({
            id: 'wd5',
            date: new Date(2026, 0, 9),
            bedTime: new Date(2026, 0, 9, 18, 0),
          }),
          // Sat + Sun
          makeEntry({
            id: 'we1',
            date: new Date(2026, 0, 10),
            bedTime: new Date(2026, 0, 10, 22, 48),
          }),
          makeEntry({
            id: 'we2',
            date: new Date(2026, 0, 11),
            bedTime: new Date(2026, 0, 11, 22, 48),
          }),
        ]

        assertClose(
          weekendBedtimeShiftHours(entries)!,
          4.8,
          1e-9,
          'shift hours'
        )
        assertEqual(
          formatWeekendBedtimeShift(entries),
          'Weekends shift your bedtime by 4.8 hours.',
          'spec sentence'
        )

        const insights = buildInsights(entries)
        assert(
          insights.includes('Weekends shift your bedtime by 4.8 hours.'),
          'buildInsights includes weekend shift'
        )
      }
    )
  )

  results.push(
    await runTest(
      'weekend jetlag: 3 AM Sat/Sun vs 4 AM weekday → minor, not normal false positive',
      () => {
        // Mon–Fri 4 AM beds/wakes; Sat+Sun 3 AM
        const jetlagged = [
          ...[5, 6, 7, 8, 9].map((d) =>
            makeEntry({
              id: `wd-${d}`,
              date: new Date(2026, 0, d),
              bedTime: new Date(2026, 0, d, 4, 0),
              wakeTime: new Date(2026, 0, d + 1, 12, 0),
            })
          ),
          makeEntry({
            id: 'sat',
            date: new Date(2026, 0, 10),
            bedTime: new Date(2026, 0, 11, 3, 0),
            wakeTime: new Date(2026, 0, 11, 11, 0),
          }),
          makeEntry({
            id: 'sun',
            date: new Date(2026, 0, 11),
            bedTime: new Date(2026, 0, 12, 3, 0),
            wakeTime: new Date(2026, 0, 12, 11, 0),
          }),
        ]

        assertClose(weekendJetlagHours(jetlagged)!, 1, 1e-9, 'jetlag hours')
        assertEqual(
          detectWeekendJetlag(jetlagged)!.severity,
          'minor',
          'minor severity'
        )
        assertEqual(
          formatWeekendJetlag(jetlagged),
          'Minor weekend jetlag: Sunday night is 1.0h off your weekday average.',
          'minor sentence'
        )
        assert(
          buildInsights(jetlagged).some((s) => s.includes('Minor weekend jetlag')),
          'buildInsights includes jetlag'
        )

        const normal = [
          ...[5, 6, 7, 8, 9].map((d) =>
            makeEntry({
              id: `n-wd-${d}`,
              date: new Date(2026, 0, d),
              bedTime: new Date(2026, 0, d, 4, 0),
              wakeTime: new Date(2026, 0, d + 1, 12, 0),
            })
          ),
          makeEntry({
            id: 'n-sat',
            date: new Date(2026, 0, 10),
            bedTime: new Date(2026, 0, 11, 4, 0),
            wakeTime: new Date(2026, 0, 11, 12, 0),
          }),
          makeEntry({
            id: 'n-sun',
            date: new Date(2026, 0, 11),
            bedTime: new Date(2026, 0, 12, 4, 0),
            wakeTime: new Date(2026, 0, 12, 12, 0),
          }),
        ]
        assertEqual(detectWeekendJetlag(normal)!.severity, 'none', 'no false positive')
        assertEqual(formatWeekendJetlag(normal), null, 'no jetlag copy when aligned')
      }
    )
  )

  results.push(
    await runTest(
      'circadian drift: +10 min/day over 14 nights → drifting later',
      () => {
        // 21:00 + 10×i → day 13 = 23:10 (no midnight wrap)
        const entries = Array.from({ length: 14 }, (_, i) => {
          const total = 21 * 60 + i * 10
          return makeEntry({
            id: `drift-${i}`,
            date: new Date(2026, 0, 1 + i),
            bedTime: new Date(
              2026,
              0,
              1 + i,
              Math.floor(total / 60),
              total % 60
            ),
          })
        })

        const points = entries.map((e, i) => [
          i,
          e.bedTime!.getHours() * 60 + e.bedTime!.getMinutes(),
        ]) as Array<[number, number]>
        assertClose(linearRegressionSlope(points)!, 10, 1e-5, 'slope 10 min/day')
        assertEqual(
          detectCircadianDrift(entries)!.direction,
          'later',
          'direction later'
        )
        assert(
          formatCircadianDrift(entries)!.includes('drifting later'),
          'sentence says drifting later'
        )
        assert(
          buildInsights(entries).some((s) => s.includes('drifting later')),
          'buildInsights includes drift'
        )
      }
    )
  )

  results.push(
    await runTest(
      'optimal room temp: 24–26°C bucket wins when those nights are quality 8+',
      () => {
        /**
         * Bucket = Math.round(temp / 2) * 2
         * 24°C nights quality 8+ → bucket 24 (range display 24–26°C)
         * Other temps quality 5 → lower averages
         */
        assertEqual(roomTempBucket(24), 24, '24 → bucket 24')
        assertEqual(roomTempBucket(25), 26, '25 → bucket 26')
        assertEqual(roomTempBucket(22.4), 22, '22.4 → bucket 22')

        const entries: SleepEntryWithRelations[] = [
          makeEntry({
            id: 't24a',
            date: new Date(2026, 0, 5),
            sleepQuality: 8,
            environment: { roomTemp: 24, phoneUsedBeforeSleep: null, minutesPhoneBeforeSleep: null },
          }),
          makeEntry({
            id: 't24b',
            date: new Date(2026, 0, 6),
            sleepQuality: 9,
            environment: { roomTemp: 24.2, phoneUsedBeforeSleep: null, minutesPhoneBeforeSleep: null },
          }),
          makeEntry({
            id: 't24c',
            date: new Date(2026, 0, 7),
            sleepQuality: 8,
            environment: { roomTemp: 23.6, phoneUsedBeforeSleep: null, minutesPhoneBeforeSleep: null },
          }),
          makeEntry({
            id: 't20',
            date: new Date(2026, 0, 8),
            sleepQuality: 5,
            environment: { roomTemp: 20, phoneUsedBeforeSleep: null, minutesPhoneBeforeSleep: null },
          }),
          makeEntry({
            id: 't22',
            date: new Date(2026, 0, 9),
            sleepQuality: 5,
            environment: { roomTemp: 22, phoneUsedBeforeSleep: null, minutesPhoneBeforeSleep: null },
          }),
          makeEntry({
            id: 't28',
            date: new Date(2026, 0, 10),
            sleepQuality: 5,
            environment: { roomTemp: 28, phoneUsedBeforeSleep: null, minutesPhoneBeforeSleep: null },
          }),
        ]

        const result = optimalRoomTempRange(entries)
        assert(result, 'optimal range found')
        assertEqual(result.bucket, 24, 'winning bucket is 24')
        assertEqual(result.rangeLow, 24, 'range low')
        assertEqual(result.rangeHigh, 26, 'range high → 24–26°C')
        assert(result.avgQuality >= 8, `avg quality ${result.avgQuality} ≥ 8`)
        assertEqual(
          formatOptimalRoomTemp(entries),
          'Your optimal room temperature range is 24–26°C.',
          'insight sentence'
        )

        const insights = buildInsights(entries)
        assert(
          insights.includes(
            'Your optimal room temperature range is 24–26°C.'
          ),
          'buildInsights includes room temp'
        )
      }
    )
  )

  results.push(
    await runTest(
      'sunrise before bed impact matches spec numbers 5.2 vs 8.1',
      () => {
        /**
         * with sunrise: 5.2, 5.2, 5.2 → avg 5.2
         * without:      8.1, 8.1, 8.1 → avg 8.1
         */
        const entries: SleepEntryWithRelations[] = [
          makeEntry({
            id: 'sun1',
            date: new Date(2026, 0, 5),
            sleepQuality: 5.2,
            environment: {
              roomTemp: 22,
              phoneUsedBeforeSleep: null,
              minutesPhoneBeforeSleep: null,
              sunlightSeenBeforeSleep: true,
            },
          }),
          makeEntry({
            id: 'sun2',
            date: new Date(2026, 0, 6),
            sleepQuality: 5.2,
            environment: {
              roomTemp: 22,
              phoneUsedBeforeSleep: null,
              minutesPhoneBeforeSleep: null,
              sunlightSeenBeforeSleep: true,
            },
          }),
          makeEntry({
            id: 'sun3',
            date: new Date(2026, 0, 7),
            sleepQuality: 5.2,
            environment: {
              roomTemp: 22,
              phoneUsedBeforeSleep: null,
              minutesPhoneBeforeSleep: null,
              sunlightSeenBeforeSleep: true,
            },
          }),
          makeEntry({
            id: 'nosun1',
            date: new Date(2026, 0, 8),
            sleepQuality: 8.1,
            environment: {
              roomTemp: 22,
              phoneUsedBeforeSleep: null,
              minutesPhoneBeforeSleep: null,
              sunlightSeenBeforeSleep: false,
            },
          }),
          makeEntry({
            id: 'nosun2',
            date: new Date(2026, 0, 9),
            sleepQuality: 8.1,
            environment: {
              roomTemp: 22,
              phoneUsedBeforeSleep: null,
              minutesPhoneBeforeSleep: null,
              sunlightSeenBeforeSleep: false,
            },
          }),
          makeEntry({
            id: 'nosun3',
            date: new Date(2026, 0, 10),
            sleepQuality: 8.1,
            environment: {
              roomTemp: 22,
              phoneUsedBeforeSleep: null,
              minutesPhoneBeforeSleep: null,
              sunlightSeenBeforeSleep: false,
            },
          }),
        ]

        const impact = sunriseBeforeBedImpact(entries)
        assert(impact, 'impact computed')
        assertEqual(impact.withSunrise.avg, 5.2, 'with sunrise avg')
        assertEqual(impact.withoutSunrise.avg, 8.1, 'without sunrise avg')
        assertEqual(
          formatSunriseBeforeBedImpact(entries),
          'Average quality with sunrise before sleep: 5.2; without: 8.1.',
          'spec example sentence'
        )

        const insights = buildInsights(entries)
        assert(
          insights.includes(
            'Average quality with sunrise before sleep: 5.2; without: 8.1.'
          ),
          'buildInsights includes sunrise impact'
        )
      }
    )
  )

  return results.every(Boolean)
}
