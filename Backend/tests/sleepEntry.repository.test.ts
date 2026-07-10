import { prisma } from '../src/lib/prisma'
import { sleepEntryRepository } from '../src/repositories/sleepEntry.repository'
import { assert, assertEqual, runTest } from './helpers'

export async function runSleepEntryRepositoryTests(): Promise<boolean> {
  console.log('\n[sleepEntry.repository]')
  const results: boolean[] = []

  results.push(
    await runTest('findAll returns seeded rows with relations', async () => {
      const rows = await sleepEntryRepository.findAll()
      assert(rows.length >= 14, `expected at least 14 rows, got ${rows.length}`)
      const fullyLinked = rows.find(
        (row) => row.mood && row.food && row.exercise && row.environment && row.health
      )
      assert(fullyLinked, 'at least one fully linked seeded row')
    })
  )

  results.push(
    await runTest('findByDate returns the matching entry', async () => {
      const rows = await sleepEntryRepository.findAll()
      assert(rows[0], 'need at least one row')
      const found = await sleepEntryRepository.findByDate(rows[0].date)
      assert(found, 'findByDate result')
      assertEqual(found.id, rows[0].id, 'same id')
    })
  )

  results.push(
    await runTest('upsert creates then updates a temporary entry', async () => {
      const date = new Date('2099-01-01T00:00:00.000Z')

      const created = await sleepEntryRepository.upsert(date, {
        sleepQuality: 9,
        notes: 'temp-seed-test',
        mood: { mood: 8, stress: 2, anxiety: 2, motivation: 8 },
        food: { mealBeforeSleep: false, caffeineAmountMg: 50 },
        exercise: { exercise: true, duration: 30 },
        environment: {
          phoneUsedBeforeSleep: false,
          minutesPhoneBeforeSleep: 0,
          roomTemp: 21,
        },
        health: { weight: 70, restingHeartRate: 60, bloodPressure: '120/80' },
      })

      assertEqual(created.sleepQuality, 9, 'created quality')
      assert(created.mood, 'created mood')

      const updated = await sleepEntryRepository.upsert(date, {
        sleepQuality: 5,
        notes: 'temp-seed-test-updated',
        mood: { mood: 5, stress: 5, anxiety: 5, motivation: 5 },
      })

      assertEqual(updated.sleepQuality, 5, 'updated quality')
      assertEqual(updated.notes, 'temp-seed-test-updated', 'updated notes')
      assertEqual(updated.mood?.stress, 5, 'updated mood stress')

      await prisma.sleepEntry.delete({ where: { date } })
    })
  )

  results.push(
    await runTest(
      'upsert nested mood/food/exercise/environment/health in one write',
      async () => {
        const date = new Date('2099-02-02T00:00:00.000Z')

        const created = await sleepEntryRepository.upsert(date, {
          sleepQuality: 7,
          notes: 'nested-children-create',
          mood: { mood: 6, stress: 4, anxiety: 3, motivation: 7 },
          food: {
            mealBeforeSleep: true,
            mealType: 'light snack',
            caffeineAmountMg: 120,
            caffeineLastConsumed: new Date('2099-02-01T15:00:00.000Z'),
          },
          exercise: {
            exercise: true,
            exerciseType: 'run',
            duration: 45,
            workoutTime: new Date('2099-02-01T18:00:00.000Z'),
          },
          environment: {
            roomTemp: 22.5,
            fanOn: true,
            acOn: false,
            blackoutCurtains: true,
            phoneUsedBeforeSleep: true,
            minutesPhoneBeforeSleep: 25,
            screenBrightness: 40,
          },
          health: {
            weight: 71.2,
            restingHeartRate: 58,
            bloodPressure: '118/76',
          },
        })

        assert(created.mood, 'mood created')
        assert(created.food, 'food created')
        assert(created.exercise, 'exercise created')
        assert(created.environment, 'environment created')
        assert(created.health, 'health created')
        assertEqual(created.mood!.mood, 6, 'mood value')
        assertEqual(created.food!.caffeineAmountMg, 120, 'caffeine')
        assertEqual(created.exercise!.duration, 45, 'exercise duration')
        assertEqual(created.environment!.minutesPhoneBeforeSleep, 25, 'phone mins')
        assertEqual(created.health!.restingHeartRate, 58, 'rhr')

        const updated = await sleepEntryRepository.upsert(date, {
          sleepQuality: 9,
          mood: { mood: 9, stress: 2, anxiety: 1, motivation: 9 },
          food: { mealBeforeSleep: false, caffeineAmountMg: 40 },
          exercise: { exercise: false, duration: null },
          environment: {
            phoneUsedBeforeSleep: false,
            minutesPhoneBeforeSleep: 0,
            roomTemp: 21,
          },
          health: { weight: 71.0, restingHeartRate: 56, bloodPressure: '116/74' },
        })

        assertEqual(updated.mood!.stress, 2, 'mood updated')
        assertEqual(updated.food!.mealBeforeSleep, false, 'food updated')
        assertEqual(updated.exercise!.exercise, false, 'exercise updated')
        assertEqual(updated.environment!.minutesPhoneBeforeSleep, 0, 'env updated')
        assertEqual(updated.health!.restingHeartRate, 56, 'health updated')

        await prisma.sleepEntry.delete({ where: { date } })
      }
    )
  )

  return results.every(Boolean)
}
