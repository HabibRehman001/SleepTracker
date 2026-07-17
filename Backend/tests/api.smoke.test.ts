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
    await runTest('GET /api/analytics/correlations includes phone factor', async () => {
      const { status, body } = await getJson('/api/analytics/correlations')
      assertEqual(status, 200, 'status')
      assert(Array.isArray(body), 'array body')
      const rows = body as Array<{
        factor: string
        outcome: string
        label: string
        groupA: { n: number; avg: number | null }
        groupB: { n: number; avg: number | null }
      }>
      const phoneLatency = rows.find(
        (row) =>
          row.factor === 'phoneUsedBeforeSleep' && row.outcome === 'latency'
      )
      const phoneQuality = rows.find(
        (row) =>
          row.factor === 'phoneUsedBeforeSleep' && row.outcome === 'quality'
      )
      assert(phoneLatency, 'phone vs latency entry')
      assert(phoneQuality, 'phone vs quality entry')
      assert(
        phoneLatency.groupA.n > 0 && phoneLatency.groupB.n > 0,
        'mixed phone days'
      )
      assert(phoneLatency.groupA.avg !== null, 'latency avg')
      assert(phoneQuality.groupA.avg !== null, 'quality avg')
    })
  )

  results.push(
    await runTest(
      'GET /api/analytics/insights returns { insights: string[] }',
      async () => {
        const { status, body } = await getJson('/api/analytics/insights')
        assertEqual(status, 200, 'status')
        assert(body && typeof body === 'object', 'object body')
        const payload = body as { insights?: unknown }
        assert(Array.isArray(payload.insights), 'insights array')
        assert(
          (payload.insights as unknown[]).every(
            (item) => typeof item === 'string'
          ),
          'all strings'
        )
      }
    )
  )

  results.push(
    await runTest(
      'GET /api/analytics/scatter returns points + regression',
      async () => {
        const { status, body } = await getJson('/api/analytics/scatter')
        assertEqual(status, 200, 'status')
        const payload = body as { scatters?: unknown }
        assert(Array.isArray(payload.scatters), 'scatters array')
        const scatters = payload.scatters as Array<{
          key: string
          points: unknown[]
          regression: { slope: number; intercept: number; n: number } | null
        }>
        assert(
          scatters.some((s) => s.key === 'phoneMinutesVsLatency'),
          'phone scatter'
        )
        assert(
          scatters.some((s) => s.key === 'caffeineVsQuality'),
          'caffeine scatter'
        )
        for (const s of scatters) {
          assert(Array.isArray(s.points), `${s.key} points`)
        }
      }
    )
  )

  results.push(
    await runTest('GET /api/stats/summary returns computed fields', async () => {
      const { status, body } = await getJson('/api/stats/summary')
      assertEqual(status, 200, 'status')
      assert(body && typeof body === 'object', 'object body')
      const stats = body as Record<string, unknown>
      for (const key of [
        'todaySleep',
        'sleepDebt',
        'avg7day',
        'avg30day',
        'consistencyScore',
        'avgBedtime',
        'avgWakeTime',
        'avgLatency',
      ]) {
        assert(key in stats, `missing ${key}`)
      }
      assert(typeof stats.avg7day === 'number', 'avg7day is number')
      assert(typeof stats.sleepDebt === 'number', 'sleepDebt is minutes number')
      assert(stats.sleepDebt >= 0, 'sleepDebt never negative')
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
    await runTest('GET /api/export/json nested export', async () => {
      const { status, body } = await getJson('/api/export/json')
      assertEqual(status, 200, 'status')
      assert(body && typeof body === 'object', 'object')
      const payload = body as {
        format: string
        entryCount: number
        entries: unknown[]
      }
      assertEqual(payload.format, 'json', 'format')
      assert(payload.entryCount >= 14, 'entryCount')
      assert(Array.isArray(payload.entries), 'entries array')
      assertEqual(payload.entries.length, payload.entryCount, 'entries length')
      const first = payload.entries[0] as {
        date: string
        sleepQuality: number | null
        mood: { mood: number } | null
      }
      assert(typeof first.date === 'string', 'entry date string')
      assert(first.mood == null || typeof first.mood.mood === 'number', 'nested mood')
    })
  )

  results.push(
    await runTest('GET /api/export/csv flattened export', async () => {
      const response = await fetch(`${BASE_URL}/api/export/csv`)
      assertEqual(response.status, 200, 'status')
      const text = await response.text()
      assert(text.includes('sleepQuality'), 'csv header sleepQuality')
      assert(text.includes('phoneUsedBeforeSleep'), 'nested env header')
      assert(!text.includes('status,stub'), 'not the old stub')
      const lines = text.replace(/^\uFEFF/, '').split(/\r?\n/).filter(Boolean)
      assert(lines.length >= 15, `header + ≥14 data rows, got ${lines.length}`)
    })
  )

  results.push(
    await runTest('GET /api/export/markdown daily log', async () => {
      const response = await fetch(`${BASE_URL}/api/export/markdown`)
      assertEqual(response.status, 200, 'status')
      const text = await response.text()
      assert(text.includes('# SleepTracker export'), 'doc title')
      assert(/^## \d{4}-\d{2}-\d{2}/m.test(text), '## date heading')
      assert(text.includes('- **Sleep quality:**'), 'bullet field')
    })
  )

  results.push(
    await runTest('GET /api/export/pdf monthly report', async () => {
      const response = await fetch(`${BASE_URL}/api/export/pdf`)
      assertEqual(response.status, 200, 'status')
      assert(
        response.headers.get('content-type')?.includes('application/pdf'),
        'content-type pdf'
      )
      const buf = Buffer.from(await response.arrayBuffer())
      assertEqual(buf.subarray(0, 5).toString('utf8'), '%PDF-', 'PDF magic')
      assert(buf.length > 1000, 'non-trivial PDF')
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

  results.push(
    await runTest(
      'PUT nested mood/food/exercise/environment/health in one request',
      async () => {
        const date = '2099-03-03'
        const payload = {
          bedTime: '2099-03-03T22:30:00.000Z',
          wakeTime: '2099-03-04T06:30:00.000Z',
          sleepQuality: 8,
          notes: 'nested-api-put',
          mood: { mood: 8, stress: 2, anxiety: 2, motivation: 8 },
          food: { mealBeforeSleep: false, caffeineAmountMg: 55 },
          exercise: { exercise: true, exerciseType: 'yoga', duration: 20 },
          environment: {
            phoneUsedBeforeSleep: false,
            minutesPhoneBeforeSleep: 0,
            roomTemp: 21.5,
            whiteNoise: true,
          },
          health: {
            weight: 70.5,
            restingHeartRate: 59,
            bloodPressure: '117/75',
          },
        }

        const putResponse = await fetch(`${BASE_URL}/api/sleep-entries/${date}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        const putBody = await putResponse.json()
        assertEqual(putResponse.status, 200, 'PUT status')
        assert(putBody.bedTime, 'bedTime on SleepEntry')
        assert(putBody.mood, 'MoodEntry populated')
        assert(putBody.food, 'FoodEntry populated')
        assert(putBody.exercise, 'ExerciseEntry populated')
        assert(putBody.environment, 'EnvironmentEntry populated')
        assert(putBody.health, 'HealthEntry populated')
        assertEqual(putBody.mood.stress, 2, 'mood stress')
        assertEqual(putBody.food.caffeineAmountMg, 55, 'food caffeine')
        assertEqual(putBody.exercise.duration, 20, 'exercise duration')
        assertEqual(putBody.environment.whiteNoise, true, 'env whiteNoise')
        assertEqual(putBody.health.restingHeartRate, 59, 'health rhr')

        // one PUT must touch SleepEntry + all 5 child tables
        const childTables = [
          putBody.mood,
          putBody.food,
          putBody.exercise,
          putBody.environment,
          putBody.health,
        ]
        assertEqual(
          childTables.filter(Boolean).length,
          5,
          'all 5 child tables populated'
        )
      }
    )
  )

  return results.every(Boolean)
}
