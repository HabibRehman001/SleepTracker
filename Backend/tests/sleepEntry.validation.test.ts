import { sleepEntrySchema } from '../src/schemas/sleepEntry.schema'
import { assert, assertEqual, runTest } from './helpers'

export async function runSleepEntryValidationTests(): Promise<boolean> {
  console.log('\n[sleepEntry.schema Zod]')
  const results: boolean[] = []

  results.push(
    await runTest('rejects sleepQuality 99', () => {
      const result = sleepEntrySchema.safeParse({ sleepQuality: 99 })
      assertEqual(result.success, false, 'should fail')
      if (!result.success) {
        const path = result.error.issues[0]?.path.join('.')
        assertEqual(path, 'sleepQuality', 'path')
      }
    })
  )

  results.push(
    await runTest('rejects sleepQuality 15', () => {
      const result = sleepEntrySchema.safeParse({ sleepQuality: 15 })
      assertEqual(result.success, false, 'should fail')
    })
  )

  results.push(
    await runTest('accepts valid sleepQuality 8 with coerced dates', () => {
      const result = sleepEntrySchema.safeParse({
        bedTime: '2026-07-09T04:00:00.000Z',
        wakeTime: '2026-07-09T12:00:00.000Z',
        sleepQuality: 8,
        mood: { mood: 7, stress: 3, anxiety: 2, motivation: 8 },
      })
      assertEqual(result.success, true, 'should pass')
      if (result.success) {
        assert(result.data.bedTime instanceof Date, 'bedTime coerced to Date')
        assertEqual(result.data.sleepQuality, 8, 'quality')
      }
    })
  )

  results.push(
    await runTest('rejects unknown keys (strict)', () => {
      const result = sleepEntrySchema.safeParse({ notAField: true })
      assertEqual(result.success, false, 'should fail')
    })
  )

  return results.every(Boolean)
}
