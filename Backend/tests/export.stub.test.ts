import { exportService } from '../src/services/export.service'
import { assert, assertEqual, runTest } from './helpers'

export async function runExportStubTests(): Promise<boolean> {
  console.log('\n[export.stubs]')
  const results: boolean[] = []

  results.push(
    await runTest('exportJsonStub returns stub metadata + entryCount', async () => {
      const stub = await exportService.exportJsonStub()
      assertEqual(stub.status, 'stub', 'status')
      assertEqual(stub.format, 'json', 'format')
      assertEqual(stub.plannedSteps, '104-106', 'plannedSteps')
      assert(stub.entryCount >= 14, `entryCount >= 14, got ${stub.entryCount}`)
      assert(stub.message.includes('104'), 'message mentions planned steps')
    })
  )

  results.push(
    await runTest('exportCsvStub returns stub CSV text', async () => {
      const csv = await exportService.exportCsvStub()
      assert(csv.includes('status,stub'), 'stub status row')
      assert(csv.includes('104-106'), 'mentions planned steps')
      assert(csv.includes('entryCount,'), 'entryCount row')
    })
  )

  return results.every(Boolean)
}
