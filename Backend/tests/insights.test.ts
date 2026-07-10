import { generateInsights } from '../src/services/analytics.service'
import type { FactorCorrelation } from '../src/types'
import { assert, assertEqual, runTest } from './helpers'

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
            groupA: {
              label: 'Phone used before sleep',
              avgLatency: 92,
              avgQuality: 6,
              n: 5,
            },
            groupB: {
              label: 'No phone before sleep',
              avgLatency: 5,
              avgQuality: 8,
              n: 5,
            },
          },
          {
            factor: 'mealBeforeSleep',
            groupA: {
              label: 'Meal before sleep',
              avgLatency: 40,
              avgQuality: 7,
              n: 4,
            },
            groupB: {
              label: 'No meal before sleep',
              avgLatency: 38,
              avgQuality: 7.5,
              n: 4,
            },
          },
        ]

        // |92 - 5| = 87 > 15 → insight; |40-38| = 2 ≤ 15 → skipped
        const insights = generateInsights(correlations)
        assertEqual(insights.length, 1, 'only meaningful gap surfaced')
        assert(
          insights[0].includes('87'),
          `expected sentence to contain 87, got: ${insights[0]}`
        )
        assertEqual(
          insights[0],
          'Using phone before sleep changed your average latency by 87 minutes.',
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
          groupA: {
            label: 'Phone used before sleep',
            avgLatency: 50,
            avgQuality: 7,
            n: 3,
          },
          groupB: {
            label: 'No phone before sleep',
            avgLatency: 40,
            avgQuality: 7,
            n: 3,
          },
        },
      ]
      assertEqual(generateInsights(correlations).length, 0, 'no insight for 10min gap')
    })
  )

  return results.every(Boolean)
}
