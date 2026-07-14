import {
  experimentOutcomeDiff,
  mean,
  splitExperimentWindows,
} from '../src/services/experimentComparison'
import { welchTTest } from '../src/utils/welchTTest'
import { assert, assertClose, assertEqual, runTest } from './helpers'

type FakeEntry = { date: Date; sleepQuality: number | null }

/** Step 98 — before/after experiment outcome comparison. */
export async function runExperimentComparisonTests(): Promise<boolean> {
  console.log('\n[experiment.beforeAfter]')
  const results: boolean[] = []

  results.push(
    await runTest('mean of [5,5,5] = 5; mean of [8,8,8] = 8', () => {
      assertClose(mean([5, 5, 5])!, 5, 1e-9, 'before mean')
      assertClose(mean([8, 8, 8])!, 8, 1e-9, 'during mean')
    })
  )

  results.push(
    await runTest(
      'synthetic quality before=5 during=8 → diff +3',
      () => {
        // 14 nights quality 5 before; 7 nights quality 8 during
        const before: FakeEntry[] = Array.from({ length: 14 }, (_, i) => ({
          date: new Date(2026, 0, 1 + i), // Jan 1–14
          sleepQuality: 5,
        }))
        const during: FakeEntry[] = Array.from({ length: 7 }, (_, i) => ({
          date: new Date(2026, 0, 15 + i), // Jan 15–21
          sleepQuality: 8,
        }))
        const entries = [...before, ...during]
        const experiment = {
          startDate: new Date(2026, 0, 15),
          endDate: new Date(2026, 0, 21),
        }

        const windows = splitExperimentWindows(entries, experiment)
        assertEqual(windows.before.length, 14, 'before window')
        assertEqual(windows.during.length, 7, 'during window')

        const result = experimentOutcomeDiff(
          entries,
          experiment,
          (e) => e.sleepQuality
        )

        assert(result != null, 'diff computed')
        assertClose(result!.beforeMean, 5, 1e-9, 'beforeMean')
        assertClose(result!.duringMean, 8, 1e-9, 'duringMean')
        assertClose(result!.diff, 3, 1e-9, 'diff +3')
        assertEqual(result!.beforeN, 14, 'beforeN')
        assertEqual(result!.duringN, 7, 'duringN')
        // Zero within-group variance, means 5 vs 8 → Welch p = 0, significant
        assert(result!.pValue != null && result!.pValue < 0.05, 'p < 0.05')
        assert(result!.significant === true, 'significant flag')
      }
    )
  )

  results.push(
    await runTest('Welch helper: different→p<0.05, similar→p>0.3', () => {
      const different = welchTTest(
        [4.9, 5.0, 5.1, 4.95, 5.05, 5.0, 4.9, 5.1],
        [7.9, 8.0, 8.1, 7.95, 8.05, 8.0, 7.9, 8.1]
      )
      assert(different != null && different.pValue < 0.05, 'different p')
      const similar = welchTTest(
        [5.0, 5.1, 4.9, 5.05, 4.95, 5.0, 5.02, 4.98],
        [5.01, 4.99, 5.05, 4.95, 5.0, 5.1, 4.9, 5.02]
      )
      assert(similar != null && similar.pValue > 0.3, 'similar p')
    })
  )

  results.push(
    await runTest('before window keeps only last 14 pre nights', () => {
      const entries: FakeEntry[] = Array.from({ length: 20 }, (_, i) => ({
        date: new Date(2026, 0, 1 + i), // Jan 1–20 before start on 21
        sleepQuality: i < 6 ? 1 : 5, // first 6 low; last 14 all quality 5
      }))
      entries.push(
        ...Array.from({ length: 3 }, (_, i) => ({
          date: new Date(2026, 0, 21 + i),
          sleepQuality: 8,
        }))
      )

      const result = experimentOutcomeDiff(
        entries,
        {
          startDate: new Date(2026, 0, 21),
          endDate: new Date(2026, 0, 23),
        },
        (e) => e.sleepQuality
      )

      assert(result != null, 'diff')
      assertClose(result!.beforeMean, 5, 1e-9, 'only last 14 before nights')
      assertClose(result!.diff, 3, 1e-9, 'still +3 vs during 8')
    })
  )

  results.push(
    await runTest('open-ended endDate includes all nights from start', () => {
      const entries: FakeEntry[] = [
        { date: new Date(2026, 0, 1), sleepQuality: 5 },
        { date: new Date(2026, 0, 10), sleepQuality: 8 },
        { date: new Date(2026, 0, 20), sleepQuality: 8 },
      ]
      const { during } = splitExperimentWindows(entries, {
        startDate: new Date(2026, 0, 10),
        endDate: null,
      })
      assertEqual(during.length, 2, 'both from start onward')
    })
  )

  return results.every(Boolean)
}
