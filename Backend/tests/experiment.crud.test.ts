import { experimentService } from '../src/services/experiment.service'
import { assert, assertEqual, runTest } from './helpers'

/** Step 97 — Experiment CRUD: create (optional end), list, delete. */
export async function runExperimentCrudTests(): Promise<boolean> {
  console.log('\n[experiment.crud]')
  const results: boolean[] = []
  const ids: string[] = []

  results.push(
    await runTest('POST create with endDate', async () => {
      const created = await experimentService.create({
        name: '  Caffeine cutoff  ',
        startDate: '2026-07-01',
        endDate: '2026-07-14',
      })
      ids.push(created.id)
      assertEqual(created.name, 'Caffeine cutoff', 'trimmed name')
      assert(created.endDate != null, 'endDate set')
    })
  )

  results.push(
    await runTest('POST create open-ended (no endDate)', async () => {
      const created = await experimentService.create({
        name: 'Ongoing magnesium',
        startDate: '2026-07-10',
      })
      ids.push(created.id)
      assertEqual(created.endDate, null, 'open-ended null endDate')
    })
  )

  results.push(
    await runTest('GET list includes created experiments', async () => {
      const list = await experimentService.list()
      assert(
        ids.every((id) => list.some((e) => e.id === id)),
        'created ids listed'
      )
    })
  )

  results.push(
    await runTest('DELETE removes experiment', async () => {
      const id = ids[0]
      await experimentService.delete(id)
      let threw = false
      try {
        await experimentService.getById(id)
      } catch {
        threw = true
      }
      assert(threw, 'getById 404 after delete')
    })
  )

  results.push(
    await runTest('rejects endDate before startDate', async () => {
      let threw = false
      try {
        await experimentService.create({
          name: 'Bad window',
          startDate: '2026-07-10',
          endDate: '2026-07-01',
        })
      } catch {
        threw = true
      }
      assert(threw, 'validation error')
    })
  )

  // cleanup leftovers from this suite
  for (const id of ids.slice(1)) {
    try {
      await experimentService.delete(id)
    } catch {
      /* already gone */
    }
  }

  return results.every(Boolean)
}
