import { welchTTest } from '../src/utils/welchTTest'
import { assert, runTest } from './helpers'

/** Step 99 — Welch two-sample t-test p-values. */
export async function runWelchTTestTests(): Promise<boolean> {
  console.log('\n[stats.welchTTest]')
  const results: boolean[] = []

  results.push(
    await runTest(
      'clearly different samples (means 5 vs 8, low var) → p < 0.05',
      () => {
        const before = [4.9, 5.0, 5.1, 4.95, 5.05, 5.0, 4.9, 5.1]
        const during = [7.9, 8.0, 8.1, 7.95, 8.05, 8.0, 7.9, 8.1]
        const test = welchTTest(before, during)
        assert(test != null, 'test computed')
        assert(test!.pValue < 0.05, `expected p<0.05, got ${test!.pValue}`)
      }
    )
  )

  results.push(
    await runTest('near-identical samples → p > 0.3', () => {
      const a = [5.0, 5.1, 4.9, 5.05, 4.95, 5.0, 5.02, 4.98]
      const b = [5.01, 4.99, 5.05, 4.95, 5.0, 5.1, 4.9, 5.02]
      const test = welchTTest(a, b)
      assert(test != null, 'test computed')
      assert(test!.pValue > 0.3, `expected p>0.3, got ${test!.pValue}`)
    })
  )

  results.push(
    await runTest('identical constant samples → p = 1', () => {
      const test = welchTTest([5, 5, 5, 5], [5, 5, 5, 5])
      assert(test != null, 'test')
      assert(test!.pValue === 1, `p=${test!.pValue}`)
    })
  )

  return results.every(Boolean)
}
