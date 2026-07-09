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

  return results.every(Boolean)
}
