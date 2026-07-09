import { prisma } from '../src/lib/prisma'
import {
  parseEntryDate,
  sleepEntryService,
} from '../src/services/sleepEntry.service'
import { assert, assertEqual, runTest } from './helpers'

export async function runSleepEntryServiceTests(): Promise<boolean> {
  console.log('\n[sleepEntry.service CRUD]')
  const results: boolean[] = []

  results.push(
    await runTest('parseEntryDate normalizes YYYY-MM-DD to UTC midnight', () => {
      const date = parseEntryDate('2026-07-09')
      assertEqual(date.toISOString(), '2026-07-09T00:00:00.000Z', 'iso')
    })
  )

  results.push(
    await runTest('upsertByDate then getByDate round-trips', async () => {
      const dateParam = '2026-07-09'

      const saved = await sleepEntryService.upsertByDate(dateParam, {
        bedTime: new Date('2026-07-09T04:00:00.000Z'),
        attemptSleepTime: new Date('2026-07-09T04:20:00.000Z'),
        estimatedSleepTime: new Date('2026-07-09T04:35:00.000Z'),
        wakeTime: new Date('2026-07-09T12:00:00.000Z'),
        outOfBedTime: new Date('2026-07-09T12:15:00.000Z'),
        numberOfAwakenings: 1,
        sleepQuality: 8,
        energyMorning: 7,
        energyWork: 6,
        notes: 'step-29-crud-test',
        mood: { mood: 7, stress: 3, anxiety: 2, motivation: 8 },
        food: {
          mealBeforeSleep: false,
          caffeineAmountMg: 80,
        },
        exercise: {
          exercise: true,
          exerciseType: 'walk',
          duration: 30,
        },
        environment: {
          phoneUsedBeforeSleep: false,
          minutesPhoneBeforeSleep: 0,
          roomTemp: 22.5,
        },
        health: {
          weight: 72,
          restingHeartRate: 60,
          bloodPressure: '118/76',
        },
      })

      assertEqual(saved.sleepQuality, 8, 'saved quality')
      assertEqual(saved.notes, 'step-29-crud-test', 'saved notes')
      assert(saved.bedTime, 'bedTime saved')
      assertEqual(
        new Date(saved.bedTime!).toISOString(),
        '2026-07-09T04:00:00.000Z',
        'bedTime iso'
      )
      assert(saved.mood, 'mood linked')
      assertEqual(saved.mood!.stress, 3, 'mood stress')

      const fetched = await sleepEntryService.getByDate(dateParam)
      assertEqual(fetched.id, saved.id, 'same id on get')
      assertEqual(fetched.notes, 'step-29-crud-test', 'fetched notes')

      // cleanup so suite stays deterministic
      await prisma.sleepEntry.delete({
        where: { date: parseEntryDate(dateParam) },
      })
    })
  )

  results.push(
    await runTest('getByDate missing day returns 404 AppError', async () => {
      try {
        await sleepEntryService.getByDate('2099-12-31')
        throw new Error('expected AppError')
      } catch (error) {
        assert(error instanceof Error, 'error object')
        assert(
          'statusCode' in error && (error as { statusCode: number }).statusCode === 404,
          'statusCode 404'
        )
      }
    })
  )

  return results.every(Boolean)
}
