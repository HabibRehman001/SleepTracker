import { assert, assertEqual, runTest } from './helpers'

const BASE_URL = process.env.API_BASE_URL ?? 'http://localhost:4000'
const FRONTEND_ORIGIN = process.env.CORS_ORIGIN ?? 'http://localhost:5173'

export async function runCorsTests(): Promise<boolean> {
  console.log(`\n[cors] origin=${FRONTEND_ORIGIN}`)
  const results: boolean[] = []

  results.push(
    await runTest('GET /api/health allows Vite origin', async () => {
      const response = await fetch(`${BASE_URL}/api/health`, {
        headers: { Origin: FRONTEND_ORIGIN },
      })
      assertEqual(response.status, 200, 'status')
      assertEqual(
        response.headers.get('access-control-allow-origin'),
        FRONTEND_ORIGIN,
        'ACA-Origin'
      )
    })
  )

  results.push(
    await runTest('OPTIONS preflight for PUT sleep-entries', async () => {
      const response = await fetch(`${BASE_URL}/api/sleep-entries/2026-07-09`, {
        method: 'OPTIONS',
        headers: {
          Origin: FRONTEND_ORIGIN,
          'Access-Control-Request-Method': 'PUT',
          'Access-Control-Request-Headers': 'content-type',
        },
      })
      assert(response.status === 204 || response.status === 200, 'preflight status')
      assertEqual(
        response.headers.get('access-control-allow-origin'),
        FRONTEND_ORIGIN,
        'ACA-Origin'
      )
      const allowMethods = response.headers.get('access-control-allow-methods') ?? ''
      assert(
        allowMethods.toUpperCase().includes('PUT'),
        `Allow-Methods includes PUT (got ${allowMethods})`
      )
    })
  )

  results.push(
    await runTest('static CORS origin always emits configured ACAO header', async () => {
      // With cors({ origin: 'http://localhost:5173' }), the package always sets
      // Access-Control-Allow-Origin to that string. Browsers still block if the
      // page origin does not match the header value.
      const response = await fetch(`${BASE_URL}/api/health`, {
        headers: { Origin: 'http://evil.example' },
      })
      assertEqual(response.status, 200, 'status still 200')
      assertEqual(
        response.headers.get('access-control-allow-origin'),
        FRONTEND_ORIGIN,
        'configured ACAO (browser enforces match)'
      )
    })
  )

  return results.every(Boolean)
}
