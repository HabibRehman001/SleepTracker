import { runApiSmokeTests } from './api.smoke.test'
import { runCorsTests } from './cors.test'

async function main() {
  console.log('SleepTracker API smoke tests')
  console.log('(requires: npm run dev on PORT 4000)')
  console.log('================================')

  const smokeOk = await runApiSmokeTests()
  const corsOk = await runCorsTests()
  const ok = smokeOk && corsOk

  console.log('\n================================')
  console.log(ok ? 'API SMOKE PASSED' : 'API SMOKE FAILED')
  process.exit(ok ? 0 : 1)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
