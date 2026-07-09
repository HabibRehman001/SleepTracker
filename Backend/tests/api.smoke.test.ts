import { assert, assertEqual, runTest } from './helpers'

const BASE_URL = process.env.API_BASE_URL ?? 'http://localhost:4000'

async function getJson(path: string) {
  const response = await fetch(`${BASE_URL}${path}`)
  const body = await response.json().catch(() => null)
  return { status: response.status, body }
}

export async function runApiSmokeTests(): Promise<boolean> {
  console.log(`\n[api.smoke] base=${BASE_URL}`)
  const results: boolean[] = []

  results.push(
    await runTest('GET /api/health', async () => {
      const { status, body } = await getJson('/api/health')
      assertEqual(status, 200, 'status')
      assert(body && typeof body === 'object' && 'message' in body, 'message field')
    })
  )

  results.push(
    await runTest('GET /api/sleep-entries returns array', async () => {
      const { status, body } = await getJson('/api/sleep-entries')
      assertEqual(status, 200, 'status')
      assert(Array.isArray(body), 'array body')
      assert((body as unknown[]).length >= 14, 'at least 14 seeded entries')
    })
  )

  results.push(
    await runTest('GET /api/analytics/summary', async () => {
      const { status, body } = await getJson('/api/analytics/summary')
      assertEqual(status, 200, 'status')
      assert(body && typeof body === 'object', 'object body')
      const summary = body as {
        entryCount: number
        averageSleepQuality: number | null
        correlations: unknown[]
      }
      assert(summary.entryCount >= 14, 'entryCount')
      assert(Array.isArray(summary.correlations), 'correlations array')
    })
  )

  results.push(
    await runTest('GET /api/export/sleep-entries.csv', async () => {
      const response = await fetch(`${BASE_URL}/api/export/sleep-entries.csv`)
      assertEqual(response.status, 200, 'status')
      const text = await response.text()
      assert(text.includes('sleepQuality'), 'csv header')
    })
  )

  results.push(
    await runTest('PUT then GET /api/sleep-entries/:date', async () => {
      const date = '2026-07-09'
      const payload = {
        bedTime: '2026-07-09T04:00:00.000Z',
        wakeTime: '2026-07-09T12:00:00.000Z',
        sleepQuality: 8,
        notes: 'api-smoke-put',
        mood: { mood: 7, stress: 3, anxiety: 2, motivation: 8 },
        food: { mealBeforeSleep: false, caffeineAmountMg: 60 },
      }

      const putResponse = await fetch(`${BASE_URL}/api/sleep-entries/${date}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const putBody = await putResponse.json()
      assertEqual(putResponse.status, 200, 'PUT status')
      assertEqual(putBody.notes, 'api-smoke-put', 'PUT notes')
      assertEqual(putBody.sleepQuality, 8, 'PUT quality')

      const getResponse = await fetch(`${BASE_URL}/api/sleep-entries/${date}`)
      const getBody = await getResponse.json()
      assertEqual(getResponse.status, 200, 'GET status')
      assertEqual(getBody.id, putBody.id, 'same id')
      assertEqual(getBody.notes, 'api-smoke-put', 'GET notes')
    })
  )

  results.push(
    await runTest('PUT sleepQuality 99 returns 400 before DB', async () => {
      const response = await fetch(`${BASE_URL}/api/sleep-entries/2099-06-01`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sleepQuality: 99 }),
      })
      const body = await response.json()
      assertEqual(response.status, 400, 'status')
      assert(
        typeof body.message === 'string' &&
          body.message.includes('Validation failed'),
        'clear validation message'
      )
      assert(Array.isArray(body.details), 'details array')
      assert(
        body.details.some(
          (d: { path: string }) => d.path === 'sleepQuality'
        ),
        'sleepQuality in details'
      )
    })
  )

  return results.every(Boolean)
}
