import { rollingAverage } from '../src/utils/rollingAverage'
import { assert, assertEqual, runTest } from './helpers'

/** Step 94 — generic rolling average with NaN warm-up edges. */
export async function runRollingAverageTests(): Promise<boolean> {
  console.log('\nrolling average')

  const results = [
    await runTest('rollingAverage([1,2,3,4,5], 3) → [NaN,NaN,2,3,4]', () => {
      const out = rollingAverage([1, 2, 3, 4, 5], 3)
      assertEqual(out.length, 5, 'length')
      assert(Number.isNaN(out[0]), 'index 0 NaN')
      assert(Number.isNaN(out[1]), 'index 1 NaN')
      assertEqual(out[2], 2, 'index 2')
      assertEqual(out[3], 3, 'index 3')
      assertEqual(out[4], 4, 'index 4')
    }),
    await runTest('rejects invalid windowSize', () => {
      let threw = false
      try {
        rollingAverage([1], 0)
      } catch {
        threw = true
      }
      assert(threw, 'throws on windowSize 0')
    }),
  ]

  return results.every(Boolean)
}
